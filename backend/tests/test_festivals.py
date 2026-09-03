from datetime import date
from app.services.festivals import get_days_to_next_festival, get_festival_feature_df

# Both tests mock get_indian_festivals_upcoming() directly rather than
# hardcoding real calendar dates from the `holidays` package: that package's
# output is year-relative (current year / next year), so any hardcoded date
# silently goes stale and starts failing once the real clock rolls past it —
# which is exactly what happened to the previous version of these tests.
# Mocking the festival list keeps these tests deterministic forever and
# focused on this module's own date-math/filtering logic, not on what a
# third-party holidays library happens to return this year.

def test_festival_days_calculation(monkeypatch):
    fake_festivals = [
        {"name": "Test Festival", "date": "2025-10-02", "multiplier": 2.5, "crafts": ["textile"]},
        {"name": "Past Festival", "date": "2025-08-01", "multiplier": 3.0, "crafts": ["textile"]},
    ]
    monkeypatch.setattr("app.services.festivals.get_indian_festivals_upcoming", lambda: fake_festivals)

    result = get_days_to_next_festival("textile", today=date(2025, 9, 1))

    assert result is not None
    assert result["name"] == "Test Festival"
    assert result["date"] == "2025-10-02"
    # 2025-09-01 to 2025-10-02 is 31 days (September has 30 days)
    assert result["days_away"] == 31
    assert result["multiplier"] == 2.5

def test_festival_days_calculation_no_match_returns_none(monkeypatch):
    fake_festivals = [
        {"name": "Pottery Only Festival", "date": "2025-10-02", "multiplier": 2.0, "crafts": ["pottery"]},
    ]
    monkeypatch.setattr("app.services.festivals.get_indian_festivals_upcoming", lambda: fake_festivals)

    result = get_days_to_next_festival("textile", today=date(2025, 9, 1))
    assert result is None

def test_get_festival_feature_df(monkeypatch):
    fake_festivals = [
        {"name": "Test Diwali", "date": "2025-10-20", "multiplier": 4.0, "crafts": ["textile"]},
    ]
    monkeypatch.setattr("app.services.festivals.get_indian_festivals_upcoming", lambda: fake_festivals)

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
