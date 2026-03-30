import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.services.festivals import get_festival_feature_df, get_days_to_next_festival
from app.services.trend_reader import get_trend_series, get_trend_feature_df
from app.models.sale import Sale
from app.models.model_version import ModelVersion

class InsufficientDataError(Exception):
    pass

class DeepARForecaster:
    MODEL_VERSION = "deepar_v1"
    MIN_TRAIN_ROWS = 60
    CONTEXT_LENGTH = 30
    PREDICTION_LENGTH = 90
    
    # In-process cache to avoid reloading the model file on every request per worker
    _predictor_cache = {}

    def __init__(self, user_id: str, product_id: str, craft_type: str, db: AsyncSession):
        self.user_id = user_id
        self.product_id = product_id
        self.craft_type = craft_type
        self.db = db

    async def _load_training_data(self) -> pd.DataFrame:
        query = select(
            Sale.sale_date.label('ds_date'),
            func.sum(Sale.quantity).label('y')
        ).where(
            Sale.user_id == self.user_id,
            Sale.product_id == self.product_id
        ).group_by(Sale.sale_date).order_by('ds_date')
        
        result = await self.db.execute(query)
        rows = result.all()
        
        if len(rows) < self.MIN_TRAIN_ROWS:
            raise InsufficientDataError(f"Found {len(rows)} records, minimum {self.MIN_TRAIN_ROWS} required.")
            
        df = pd.DataFrame([{"ds": r.ds_date, "y": float(r.y)} for r in rows])
        df['ds'] = pd.to_datetime(df['ds'])
        # Pad start date so GluonTS always has at least (context_length + prediction_length) points
        start_date = df['ds'].min() - timedelta(days=90)
        end_date = df['ds'].max()
        
        idx = pd.date_range(start_date, end_date, freq='D')
        df = df.set_index('ds').reindex(idx).fillna(0).reset_index()
        df.rename(columns={'index': 'ds'}, inplace=True)
        
        fest_df = get_festival_feature_df(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
        fest_df['ds'] = pd.to_datetime(fest_df['ds'])
        
        trend_df = await get_trend_series(self.craft_type, start_date.date(), end_date.date(), self.db)
        trend_df['ds'] = pd.to_datetime(trend_df['ds'])
        
        df = pd.merge(df, fest_df, on='ds', how='left')
        df = pd.merge(df, trend_df, on='ds', how='left')
        
        df['y'] = df['y'].fillna(0)
        df['holiday'] = df['holiday'].fillna(0)
        df['multiplier'] = df['multiplier'].fillna(1.0)
        df['trend_score'] = df['trend_score'].fillna(0.5)
        
        return df

    def _build_gluonts_dataset(self, df: pd.DataFrame):
        from gluonts.dataset.common import ListDataset
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
        return dataset

    async def train(self) -> dict:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            from gluonts.torch.model.deepar import DeepAREstimator
            from gluonts.evaluation import Evaluator
            from sklearn.metrics import mean_absolute_percentage_error
        
        df = await self._load_training_data()
        
        train_df = df.iloc[:-14]
        val_df = df.iloc[-14:]
        
        train_ds = self._build_gluonts_dataset(train_df)
        val_ds = self._build_gluonts_dataset(val_df)
        
        estimator = DeepAREstimator(
            freq="D",
            prediction_length=self.PREDICTION_LENGTH,
            context_length=self.CONTEXT_LENGTH,
            num_feat_dynamic_real=3,
            num_layers=2,
            hidden_size=40,
            dropout_rate=0.1,
            trainer_kwargs={
                "max_epochs": 30,
                "accelerator": "cpu",
            }
        )
        
        predictor = estimator.train(train_ds)
        
        forecasts = list(predictor.predict(val_ds))
        val_preds = forecasts[0].quantile(0.5)[:14]
        y_true = np.where(val_df['y'] == 0, 1e-6, val_df['y'])
        deepar_mape = mean_absolute_percentage_error(y_true, val_preds)
        
        # Compare with existing active model
        query = select(ModelVersion).where(
            ModelVersion.user_id == self.user_id,
            ModelVersion.product_id == self.product_id,
            ModelVersion.is_active == True
        )
        res = await self.db.execute(query)
        active_model = res.scalar_one_or_none()
        
        sarima_mape = active_model.mape if (active_model and active_model.mape is not None) else float('inf')
        
        # Usually we only overwrite if MAPE < SARIMA or better
        promoted = bool(deepar_mape < min(sarima_mape, 0.25))
        
        base_dir = Path(__file__).parent.parent.parent / "data" / "models" / str(self.user_id) / str(self.product_id) / self.MODEL_VERSION
        os.makedirs(base_dir, exist_ok=True)
        save_path = base_dir / "latest"
        
        predictor.serialize(save_path)
        
        new_row = ModelVersion(
            user_id=self.user_id,
            product_id=self.product_id,
            model_type=self.MODEL_VERSION,
            is_active=promoted,
            mape=float(deepar_mape),
            training_rows=len(df),
            trained_at=datetime.now(timezone.utc),
            params_json={"save_path": str(save_path), "context_length": self.CONTEXT_LENGTH}
        )
        
        if promoted and active_model:
            active_model.is_active = False
            
        self.db.add(new_row)
        await self.db.commit()
        
        # Clear cache if promoted
        if promoted:
            cache_key = f"{self.user_id}_{self.product_id}"
            if cache_key in self.__class__._predictor_cache:
                del self.__class__._predictor_cache[cache_key]
                
        return {
            "mape": deepar_mape,
            "promoted": promoted,
            "training_rows": len(df),
            "model_version": self.MODEL_VERSION
        }

    async def predict(self, horizon_days: int = 90) -> dict:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            from gluonts.model.predictor import Predictor
            
        # Ensure deepar is active
        query = select(ModelVersion).where(
            ModelVersion.user_id == self.user_id,
            ModelVersion.product_id == self.product_id,
            ModelVersion.is_active == True
        )
        res = await self.db.execute(query)
        active = res.scalar_one_or_none()
        
        if not active or active.model_type != self.MODEL_VERSION:
            return {"forecast": [], "has_enough_data": False}
            
        cache_key = f"{self.user_id}_{self.product_id}"
        predictor = self.__class__._predictor_cache.get(cache_key)
        
        if not predictor:
            save_path = Path(active.params_json["save_path"])
            predictor = Predictor.deserialize(save_path)
            self.__class__._predictor_cache[cache_key] = predictor
            
        df = await self._load_training_data()
        today = df['ds'].max()
        
        # DeepAR needs context length history to start generating
        context_df = df.iloc[-self.CONTEXT_LENGTH:]
        
        future_start = (today + timedelta(days=1))
        future_end = (today + timedelta(days=horizon_days))
        
        fest_df = get_festival_feature_df(future_start.strftime('%Y-%m-%d'), future_end.strftime('%Y-%m-%d'))
        fest_df['ds'] = pd.to_datetime(fest_df['ds'])
        
        trend_df = await get_trend_feature_df(self.craft_type, future_start.date(), future_end.date(), self.db)
        trend_df['ds'] = pd.to_datetime(trend_df['ds'])
        
        fut_exog = pd.merge(fest_df, trend_df, on='ds', how='left')
        fut_exog['trend_score'] = fut_exog['trend_score'].fillna(0.5)
        
        # Inference dataset must wrap the context (target) + exog mapping through both context+horizon
        # In gluonts, inference requires the context + horizon exogs if prediction_length is used.
        # Actually, if we just want horizon_days, and predictor's length is 90, we can use the same dataset schema:
        
        full_holiday = np.concatenate([context_df['holiday'].values, fut_exog['holiday'].values])
        full_mult = np.concatenate([context_df['multiplier'].values, fut_exog['multiplier'].values])
        full_trend = np.concatenate([context_df['trend_score'].values, fut_exog['trend_score'].values])
        
        from gluonts.dataset.common import ListDataset
        infer_ds = ListDataset(
            [
                {
                    "start": pd.Period(context_df['ds'].min(), freq='D'),
                    "target": context_df['y'].values.astype(float),
                    "feat_dynamic_real": np.stack([full_holiday, full_mult, full_trend])
                }
            ],
            freq="D"
        )
        
        forecasts = list(predictor.predict(infer_ds))
        fcst = forecasts[0]
        
        p10 = fcst.quantile(0.1)
        p50 = fcst.quantile(0.5)
        p90 = fcst.quantile(0.9)
        
        forecast = []
        for i, date_val in enumerate(fut_exog['ds']):
            if i >= len(p50):
                break
            forecast.append({
                "date": date_val.strftime('%Y-%m-%d'),
                "demand": max(0, float(p50[i])),
                "lower": max(0, float(p10[i])),
                "upper": max(0, float(p90[i]))
            })
            
        # Peak periods logic
        peak_periods = []
        if len(p50) > 0:
            rolling_mean = pd.Series(p50).rolling(window=30, min_periods=1).mean()
            is_peak = p50 >= 1.5 * rolling_mean
            
            in_peak = False
            start = None
            for i, val in enumerate(is_peak):
                if val and not in_peak:
                    in_peak = True
                    start = fut_exog['ds'].iloc[i]
                elif not val and in_peak:
                    in_peak = False
                    peak_periods.append({
                        "start": start.strftime('%Y-%m-%d'),
                        "end": fut_exog['ds'].iloc[i-1].strftime('%Y-%m-%d'),
                        "multiplier": round(float(p50[i-1] / rolling_mean.iloc[i-1]), 2)
                    })
            if in_peak:
                peak_periods.append({
                    "start": start.strftime('%Y-%m-%d'),
                    "end": fut_exog['ds'].iloc[-1].strftime('%Y-%m-%d'),
                    "multiplier": round(float(p50[-1] / rolling_mean.iloc[-1]), 2)
                })

        next_fest = get_days_to_next_festival(self.craft_type)
        
        return {
            "forecast": forecast,
            "next_festival": next_fest,
            "peak_periods": peak_periods,
            "has_enough_data": True,
            "model_version": self.MODEL_VERSION,
            "mape": float(active.mape) if active.mape else 0.0
        }

    async def retrain_if_stale(self) -> bool:
        query = select(ModelVersion).where(
            ModelVersion.user_id == self.user_id,
            ModelVersion.product_id == self.product_id,
            ModelVersion.model_type == self.MODEL_VERSION
        ).order_by(desc(ModelVersion.trained_at)).limit(1)
        res = await self.db.execute(query)
        latest = res.scalar_one_or_none()
        
        now = datetime.utcnow()
        if not latest or latest.trained_at < now - timedelta(days=7):
            try:
                await self.train()
                return True
            except InsufficientDataError:
                return False
        return False
