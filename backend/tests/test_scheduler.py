import pytest
import uuid
from datetime import datetime, timedelta
from app.models.model_version import ModelVersion
from app.ml.deepar_forecaster import DeepARForecaster

@pytest.mark.asyncio
async def test_weekly_retrain_skips_fresh_model(client, test_user, db_session):
    uid = test_user.id
    pid = uuid.uuid4()
    
    # Needs to be less than 7 days old
    fresh = ModelVersion(user_id=uid, product_id=pid, model_type="deepar_v1", is_active=True, trained_at=datetime.utcnow() - timedelta(days=2))
    db_session.add(fresh)
    await db_session.commit()
    
    forecaster = DeepARForecaster(uid, pid, "textile", db_session)
    retrained = await forecaster.retrain_if_stale()
    
    assert retrained == False # Skipped because it's fresh
