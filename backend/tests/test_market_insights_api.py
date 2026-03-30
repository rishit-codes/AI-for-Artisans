import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from app.models.market_signal import MarketSignal

@pytest.mark.asyncio
async def test_market_insights_api(client: AsyncClient, db_session):
    # Insert mock market signal for Jaipur Blue Pottery
    ms1 = MarketSignal(
        signal_type="trend_score",
        key="Jaipur Blue Pottery",
        value=0.85,
        source="pytrends",
        recorded_at=datetime.now(timezone.utc).date()
    )
    db_session.add(ms1)
    await db_session.commit()
    
    response = await client.get("/market/insights?category=pottery")
    assert response.status_code == 200
    data = response.json()
    
    assert data["category"] == "pottery"
    assert "insights" in data
    assert len(data["insights"]) == 4 # We have 4 niches under pottery
    
    niches = [i["niche"] for i in data["insights"]]
    assert "Jaipur Blue Pottery" in niches
    assert "Khurja Ceramics" in niches
    
    # Verify the structure has our new custom fields
    first = data["insights"][0]
    assert "confidence_score" in first
    assert "status" in first
    assert "trend_momentum" in first
    assert "upcoming_season" in first

@pytest.mark.asyncio
async def test_market_insights_invalid_category(client: AsyncClient):
    response = await client.get("/market/insights?category=invalid_cat")
    assert response.status_code == 400
    assert "Invalid category" in response.json()["detail"]
