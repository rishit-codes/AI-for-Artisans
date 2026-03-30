import pandas as pd
from datetime import datetime

# Hardcoded dict of Indian festivals 2025–2027
FESTIVALS = [
  {"name": "Navratri",       "date": "2025-10-02", "multiplier": 2.5, "crafts": ["textile", "home_decor_brassware", "pottery"]},
  {"name": "Dussehra",       "date": "2025-10-12", "multiplier": 2.0, "crafts": ["textile", "home_decor_brassware", "pottery"]},
  {"name": "Diwali",         "date": "2025-10-20", "multiplier": 4.0, "crafts": ["pottery", "home_decor_brassware", "textile"]},
  {"name": "Christmas",      "date": "2025-12-25", "multiplier": 2.0, "crafts": ["home_decor_brassware", "textile"]},
  {"name": "Eid ul-Fitr",    "date": "2026-03-20", "multiplier": 3.0, "crafts": ["textile", "home_decor_brassware"]},
  {"name": "Holi",           "date": "2026-03-14", "multiplier": 2.0, "crafts": ["pottery", "textile"]},
  {"name": "Wedding Season", "date": "2025-11-15", "multiplier": 3.5, "crafts": ["textile", "home_decor_brassware", "pottery"]},
  {"name": "Pongal",         "date": "2026-01-14", "multiplier": 2.0, "crafts": ["pottery", "textile"]},
  # Added a few more 2026-2027 to satisfy the requirement
  {"name": "Navratri",       "date": "2026-10-10", "multiplier": 2.5, "crafts": ["textile", "home_decor_brassware", "pottery"]},
  {"name": "Dussehra",       "date": "2026-10-19", "multiplier": 2.0, "crafts": ["textile", "home_decor_brassware", "pottery"]},
  {"name": "Diwali",         "date": "2026-11-08", "multiplier": 4.0, "crafts": ["pottery", "home_decor_brassware", "textile"]},
  {"name": "Christmas",      "date": "2026-12-25", "multiplier": 2.0, "crafts": ["home_decor_brassware", "textile"]},
  {"name": "Eid ul-Fitr",    "date": "2027-03-09", "multiplier": 3.0, "crafts": ["textile", "home_decor_brassware"]},
  {"name": "Holi",           "date": "2027-03-22", "multiplier": 2.0, "crafts": ["pottery", "textile"]},
  {"name": "Wedding Season", "date": "2026-11-20", "multiplier": 3.5, "crafts": ["textile", "home_decor_brassware", "pottery"]},
  {"name": "Pongal",         "date": "2027-01-14", "multiplier": 2.0, "crafts": ["pottery", "textile"]},
]

def get_days_to_next_festival(craft_type: str) -> dict:
    """
    Returns: { name, date, days_away, multiplier }
    Logic: filter by craft_type, find earliest future date, compute (festival_date - today).days
    """
    today = datetime.now().date()
    
    upcoming = []
    
    for f in FESTIVALS:
        if craft_type.lower() in [c.lower() for c in f["crafts"]]:
            f_date = datetime.strptime(f["date"], "%Y-%m-%d").date()
            if f_date >= today:
                days_away = (f_date - today).days
                upcoming.append({
                    "name": f["name"],
                    "date": f["date"],
                    "days_away": days_away,
                    "multiplier": f["multiplier"]
                })
    
    if not upcoming:
        return None
        
    # Sort by nearest date
    upcoming.sort(key=lambda x: x["days_away"])
    return upcoming[0]

def get_festival_feature_df(start_date: str, end_date: str) -> pd.DataFrame:
    """
    Returns a DataFrame with columns [ds, holiday, multiplier]
    covering all festivals in the date range.
    """
    # Create daily date range
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    df = pd.DataFrame({'ds': dates})
    
    df['holiday'] = 0
    df['multiplier'] = 1.0 # Default multiplier is 1.0 (no effect)
    
    # Apply festival multipliers globally (without grouping by craft, as SARIMA takes global exog)
    # The requirement says: [ds, holiday, multiplier]. 
    # If multiple festivals fall on the same date, take max multiplier
    
    fest_dict = {}
    for f in FESTIVALS:
        d = pd.to_datetime(f["date"])
        if d not in fest_dict or f["multiplier"] > fest_dict[d]:
            fest_dict[d] = f["multiplier"]
            
    def get_holiday(dt):
        return 1 if dt in fest_dict else 0
        
    def get_multiplier(dt):
        return fest_dict.get(dt, 1.0)
        
    df['holiday'] = df['ds'].apply(get_holiday)
    df['multiplier'] = df['ds'].apply(get_multiplier)
    
    return df
