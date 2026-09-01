import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.metrics import mean_absolute_percentage_error
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.services.benchmark_loader import load_benchmark_series
from app.services.festivals import get_festival_feature_df, get_days_to_next_festival
from app.models.sale import Sale
from app.models.prediction import Prediction

# Below this many historical daily records, fitting a per-product SARIMAX is
# unstable — matches the paper's Tier 2/Tier 3 boundary (N < 20 falls back to
# the category-level prior instead of a real model).
CATEGORY_PRIOR_THRESHOLD = 20

def _detect_peak_periods(dates: list, values: np.ndarray, window: int = 30, factor: float = 1.5) -> list:
    """Flag contiguous stretches where forecast demand runs well above its own
    rolling baseline — shared by both the SARIMAX and category-prior paths so
    DeepAR isn't the only tier that reports peak_periods."""
    if len(values) == 0:
        return []
    rolling = pd.Series(values).rolling(window=window, min_periods=1).mean()
    is_peak = values >= factor * rolling
    peaks, in_peak, start = [], False, None
    for i, flagged in enumerate(is_peak):
        if flagged and not in_peak:
            in_peak, start = True, dates[i]
        elif not flagged and in_peak:
            in_peak = False
            peaks.append({"start": start, "end": dates[i - 1], "multiplier": round(float(values[i - 1] / rolling.iloc[i - 1]), 2)})
    if in_peak:
        peaks.append({"start": start, "end": dates[-1], "multiplier": round(float(values[-1] / rolling.iloc[-1]), 2)})
    return peaks

class DemandForecaster:
    def __init__(self, user_id, product_id, craft_type, db: AsyncSession):
        self.user_id = user_id
        self.product_id = product_id
        self.craft_type = craft_type
        self.db = db
        self.using_benchmark = True

    async def _real_record_count(self) -> int:
        res = await self.db.execute(
            select(func.count(Sale.id)).where(Sale.user_id == self.user_id, Sale.product_id == self.product_id)
        )
        return res.scalar() or 0

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

        df = pd.DataFrame([{
            "ds": r.ds_date,
            "y": float(r.y)
        } for r in rows])

        if len(df) < CATEGORY_PRIOR_THRESHOLD:
            bm_df = load_benchmark_series(self.craft_type)
            if not bm_df.empty:
                df = bm_df
            self.using_benchmark = True
        else:
            self.using_benchmark = False

        if len(df) == 0:
            return df
            
        df['ds'] = pd.to_datetime(df['ds'])
        
        start_date = df['ds'].min()
        end_date = df['ds'].max()
        
        # Ensure daily frequency
        idx = pd.date_range(start_date, end_date, freq='D')
        df = df.set_index('ds').reindex(idx).fillna(0).reset_index()
        df.rename(columns={'index': 'ds'}, inplace=True)
        
        # Merge festivals
        fest_df = get_festival_feature_df(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
        fest_df['ds'] = pd.to_datetime(fest_df['ds'])
        
        df = pd.merge(df, fest_df, on='ds', how='left')
        df['holiday'] = df['holiday'].fillna(0)
        df['multiplier'] = df['multiplier'].fillna(1.0)
        
        return df

    def _build_exog(self, df) -> np.ndarray:
        return df[['holiday', 'multiplier']].values

    async def train(self) -> dict:
        df = await self._load_training_data()

        if len(df) < CATEGORY_PRIOR_THRESHOLD:
            return {"mape": 0.0, "using_benchmark": self.using_benchmark, "model_version": "sarima_v1_insufficient_data"}
            
        # Holdout last 14 days
        train_df = df.iloc[:-14]
        test_df = df.iloc[-14:]
        
        exog_train = self._build_exog(train_df)
        exog_test = self._build_exog(test_df)
        
        model = SARIMAX(train_df['y'], exog=exog_train, order=(1,1,1), seasonal_order=(1,1,0,7))
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            fitted = model.fit(disp=False)
        
        preds = fitted.forecast(steps=14, exog=exog_test)
        
        y_true = np.where(test_df['y'] == 0, 1e-6, test_df['y'])
        mape = mean_absolute_percentage_error(y_true, preds)
        
        # Train on full data
        exog_full = self._build_exog(df)
        final_model = SARIMAX(df['y'], exog=exog_full, order=(1,1,1), seasonal_order=(1,1,0,7))
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            final_fitted = final_model.fit(disp=False)
        
        params = [float(p) for p in final_fitted.params]
        
        new_pred = Prediction(
            user_id=self.user_id,
            product_id=self.product_id,
            model_version="sarima_v1",
            params={"params": params, "mape": float(mape)},
        )
        self.db.add(new_pred)
        await self.db.commit()
        
        return {
            "mape": mape,
            "using_benchmark": self.using_benchmark,
            "model_version": "sarima_v1"
        }

    async def _category_prior_forecast(self, horizon_days: int) -> dict:
        """Tier 3 (N < 20): ŷ_t = α · B_c(t) · M_fest(t) — the artisan's own
        observed sales ratio against the category benchmark, scaled by festival
        proximity, rather than trying to fit a real model on too little data."""
        raw_query = select(
            Sale.sale_date.label('ds_date'), func.sum(Sale.quantity).label('y')
        ).where(Sale.user_id == self.user_id, Sale.product_id == self.product_id).group_by(Sale.sale_date)
        raw_rows = (await self.db.execute(raw_query)).all()
        artisan_mean = (sum(float(r.y) for r in raw_rows) / len(raw_rows)) if raw_rows else 0.0

        bm_df = load_benchmark_series(self.craft_type)
        cluster_mean = float(bm_df['y'].mean()) if not bm_df.empty else 0.0
        alpha = (artisan_mean / cluster_mean) if cluster_mean > 0 else 1.0

        last_date = pd.to_datetime(max((r.ds_date for r in raw_rows), default=datetime.now().date()))
        future_start = (last_date + timedelta(days=1)).strftime('%Y-%m-%d')
        future_end = (last_date + timedelta(days=horizon_days)).strftime('%Y-%m-%d')
        fut_exog = get_festival_feature_df(future_start, future_end)
        fut_exog['ds'] = pd.to_datetime(fut_exog['ds'])

        by_doy = bm_df.assign(doy=bm_df['ds'].dt.dayofyear).groupby('doy')['y'].mean() if not bm_df.empty else None

        forecast, demands, dates = [], [], []
        for _, row in fut_exog.iterrows():
            base = float(by_doy.get(row['ds'].dayofyear, cluster_mean)) if by_doy is not None else 0.0
            demand = max(0.0, alpha * base * float(row['multiplier']))
            date_str = row['ds'].strftime('%Y-%m-%d')
            forecast.append({"date": date_str, "demand": demand, "lower": max(0.0, demand * 0.7), "upper": demand * 1.3})
            demands.append(demand)
            dates.append(date_str)

        peak_periods = _detect_peak_periods(dates, np.array(demands))
        next_fest = get_days_to_next_festival(self.craft_type)

        return {
            "forecast": forecast,
            "next_festival": next_fest,
            "peak_periods": peak_periods,
            "has_enough_data": False,
            "model_version": "category_prior_v1",
            "mape": None,
            "alpha": round(alpha, 3),
        }

    async def predict(self, horizon_days=90) -> dict:
        record_count = await self._real_record_count()
        if record_count < CATEGORY_PRIOR_THRESHOLD:
            return await self._category_prior_forecast(horizon_days)

        df = await self._load_training_data()

        if len(df) == 0:
            return {"forecast": [], "has_enough_data": False}

        last_date = df['ds'].max()
        future_start = (last_date + timedelta(days=1)).strftime('%Y-%m-%d')
        future_end = (last_date + timedelta(days=horizon_days)).strftime('%Y-%m-%d')
        
        fut_exog = get_festival_feature_df(future_start, future_end)
        fut_exog['ds'] = pd.to_datetime(fut_exog['ds'])
        exog_matrix = self._build_exog(fut_exog)
        
        query = select(Prediction).where(
            Prediction.user_id == self.user_id,
            Prediction.product_id == self.product_id
        ).order_by(desc(Prediction.created_at)).limit(1)
        res = await self.db.execute(query)
        db_pred = res.scalar_one_or_none()
        
        if not db_pred or not db_pred.params:
            await self.train()
            res = await self.db.execute(query)
            db_pred = res.scalar_one_or_none()
            
        if not db_pred or not db_pred.params:
            return {"forecast": [], "has_enough_data": False}
            
        historical_exog = self._build_exog(df)
        model = SARIMAX(df['y'], exog=historical_exog, order=(1,1,1), seasonal_order=(1,1,0,7))
        res = model.filter(db_pred.params["params"])
        
        pred_res = res.get_prediction(start=len(df), end=len(df)+horizon_days-1, exog=exog_matrix)
        preds = pred_res.predicted_mean
        conf_int = pred_res.conf_int()
        
        forecast, demands, dates = [], [], []
        for i, date_val in enumerate(fut_exog['ds']):
            demand = max(0, float(preds.iloc[i])) # Demand can't be negative
            date_str = date_val.strftime('%Y-%m-%d')
            forecast.append({
                "date": date_str,
                "demand": demand,
                "lower": max(0, float(conf_int.iloc[i, 0])),
                "upper": max(0, float(conf_int.iloc[i, 1]))
            })
            demands.append(demand)
            dates.append(date_str)

        next_fest = get_days_to_next_festival(self.craft_type)

        return {
            "forecast": forecast,
            "next_festival": next_fest,
            "peak_periods": _detect_peak_periods(dates, np.array(demands)),
            "has_enough_data": not self.using_benchmark,
            "model_version": "sarima_v1",
            "mape": db_pred.params.get("mape") if isinstance(db_pred.params, dict) else None
        }

    async def has_enough_data_for_upgrade(self) -> bool:
        query = select(func.count(Sale.id)).where(Sale.user_id == self.user_id, Sale.product_id == self.product_id)
        res = await self.db.execute(query)
        count = res.scalar() or 0
        return count >= 60
