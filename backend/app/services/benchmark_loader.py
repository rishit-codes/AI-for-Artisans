import pandas as pd
import os
from pathlib import Path

def load_benchmark_series(craft_type: str) -> pd.DataFrame:
    """
    Returns: DataFrame with columns [ds, y] representing daily
    aggregated sales for that craft category from the Kaggle CSV.
    This is the fallback training data for new users with <30 records.
    """
    current_dir = Path(__file__).parent
    csv_path = current_dir.parent.parent / "data" / "benchmark" / "indian_retail.csv"
    
    if not csv_path.exists():
        # Return empty dataframe if benchmark missing
        return pd.DataFrame(columns=['ds', 'y'])
        
    df = pd.read_csv(csv_path)
    
    # Filter by craft type (category column in our synthetic dataset)
    if 'category' in df.columns:
        filtered_df = df[df['category'].str.lower() == craft_type.lower()]
        if filtered_df.empty:
            # Fallback to all data if category not found to prevent cold start failures
            filtered_df = df
    else:
        filtered_df = df
        
    # Group by date and sum quantity
    # Assume columns: date, quantity
    date_col = 'date' if 'date' in filtered_df.columns else filtered_df.columns[0]
    qty_col = 'quantity' if 'quantity' in filtered_df.columns else filtered_df.columns[1]
    
    agg_df = filtered_df.groupby(date_col)[qty_col].sum().reset_index()
    agg_df.rename(columns={date_col: 'ds', qty_col: 'y'}, inplace=True)
    
    # Ensure ds is datetime
    agg_df['ds'] = pd.to_datetime(agg_df['ds'])
    agg_df = agg_df.sort_values('ds')
    
    return agg_df
