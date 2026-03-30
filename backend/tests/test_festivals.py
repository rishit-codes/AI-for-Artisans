import pytest
import pandas as pd
from datetime import datetime
from unittest.mock import patch
from app.services.festivals import get_days_to_next_festival, get_festival_feature_df

def test_festival_days_calculation():
    # Mock 'today' to be '2025-09-01' so Navratri (2025-10-02) is indeed upcoming
    mock_today = datetime(2025, 9, 1).date()
    
    with patch('app.services.festivals.datetime') as mock_datetime:
        mock_datetime.now.return_value.date.return_value = mock_today
        mock_datetime.strptime = datetime.strptime # Keep original strptime functionality
        
        result = get_days_to_next_festival("textile")
        
        assert result is not None
        assert result["name"] == "Navratri"
        assert result["date"] == "2025-10-02"
        # 2025-09-01 to 2025-10-02 is 31 days (sept has 30 days)
        assert result["days_away"] == 31
        assert result["multiplier"] == 2.5

def test_get_festival_feature_df():
    # Test over Diwali 2025-10-20
    df = get_festival_feature_df("2025-10-18", "2025-10-22")
    assert len(df) == 5
    assert "ds" in df.columns
    assert "holiday" in df.columns
    assert "multiplier" in df.columns
    
    diwali_row = df[df["ds"] == "2025-10-20"].iloc[0]
    assert diwali_row["holiday"] == 1
    assert diwali_row["multiplier"] == 4.0
    
    normal_row = df[df["ds"] == "2025-10-18"].iloc[0]
    assert normal_row["holiday"] == 0
    assert normal_row["multiplier"] == 1.0
