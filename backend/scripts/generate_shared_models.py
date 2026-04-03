import asyncio
import os
import pandas as pd
import numpy as np
from pathlib import Path
import warnings
import logging
import sys

# Add the 'app' directory to Python path if executed directly
sys.path.append(str(Path(__file__).parent.parent))

from gluonts.torch.model.deepar import DeepAREstimator
from gluonts.dataset.common import ListDataset

from app.db.session import engine, AsyncSessionLocal
from app.services.benchmark_loader import load_benchmark_series
from app.services.festivals import get_festival_feature_df
from app.services.trend_reader import get_trend_series

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def train_shared_model_for_category(category: str):
    logger.info(f"Loading benchmark for category: {category}")
    
    # 1. Load the benchmark time series
    df = load_benchmark_series(category)
    if len(df) < 10:
        logger.warning(f"Skipping {category}, insufficient benchmark data (found {len(df)}).")
        return
        
    # 2. Extract bounds
    start_date = df['ds'].min() - pd.Timedelta(days=90)
    end_date = df['ds'].max()
    
    # 3. Create a continuous daily timeline
    idx = pd.date_range(start_date, end_date, freq='D')
    df = df.set_index('ds').reindex(idx).fillna(0).reset_index()
    df.rename(columns={'index': 'ds'}, inplace=True)
    
    # 4. Exogenous Feature: Festivals & Holidays
    fest_df = get_festival_feature_df(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
    fest_df['ds'] = pd.to_datetime(fest_df['ds'])
    
    # 5. Exogenous Feature: Google Trends (requires DB block)
    async with AsyncSessionLocal() as db:
        trend_df = await get_trend_series(category, start_date.date(), end_date.date(), db)
        
    trend_df['ds'] = pd.to_datetime(trend_df['ds'])
    
    # 6. Merge features
    df = pd.merge(df, fest_df, on='ds', how='left')
    df = pd.merge(df, trend_df, on='ds', how='left')
    
    # Clean NaNs
    df['y'] = df['y'].fillna(0)
    df['holiday'] = df['holiday'].fillna(0)
    df['multiplier'] = df['multiplier'].fillna(1.0)
    df['trend_score'] = df['trend_score'].fillna(0.5)

    # 7. Package for GluonTS PyTorch
    dataset = ListDataset(
        [
            {
                "start": pd.Period(df['ds'].min(), freq='D'),
                "target": df['y'].values.astype(float),
                "feat_dynamic_real": np.stack([
                    df['holiday'].values,
                    df['multiplier'].values,
                    df['trend_score'].values,
                ])
            }
        ],
        freq="D"
    )

    logger.info(f"Initialized PyTorch DeepAR Trainer for {category}...")
    estimator = DeepAREstimator(
        freq="D",
        prediction_length=90,  # Forecast the next 90 days
        context_length=30,     # View the past 30 days
        num_feat_dynamic_real=3,
        num_layers=2,
        hidden_size=40,
        dropout_rate=0.1,
        trainer_kwargs={
            "max_epochs": 30, # Hardcoded to 30 as requested! Wait, user said `max_epochs=30` yes! 
            "accelerator": "cpu", # Safe fallback
        }
    )
    
    # 8. Train Model
    logger.info(f"Commencing neural network training array for {category} (this may take a few minutes)...")
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        # We assign the training sequence
        predictor = estimator.train(dataset)
        
    # 9. Serialize Checkpoint Object explicitly to JSON & parameters
    save_dir = Path(__file__).parent.parent / "data" / "models" / "shared" / category / "deepar_v1" / "latest"
    os.makedirs(save_dir, exist_ok=True)
    
    # Using GluonTS standard serialize interface
    predictor.serialize(save_dir)
    logger.info(f"✅ Pre-trained PyTorch weight checkpoint successfully saved! Path: {save_dir}")

async def main():
    logger.info("Initializing offline shared model generation pipeline.")
    
    csv_path = Path(__file__).parent.parent / "data" / "benchmark" / "indian_retail.csv"
    if not csv_path.exists():
        logger.error(f"Cannot find benchmark dataset at {csv_path}")
        return
        
    # Discover unique business niches/crafts from the benchmark CSV
    pdf = pd.read_csv(csv_path)
    if 'category' in pdf.columns:
        categories = pdf['category'].unique()
    else:
        logger.warning("No 'category' column present in kaggle benchmark... defaulting to synthetic 'textile'")
        categories = ["textile"]
        
    for cat in categories:
        try:
            await train_shared_model_for_category(cat)
        except Exception as e:
            logger.error(f"Failed critical training cycle for category '{cat}' due to: {e}")
            
    # Cleanup DB engine explicitly when running as script
    await engine.dispose()
    logger.info("Process finished successfully.")

if __name__ == "__main__":
    asyncio.run(main())
