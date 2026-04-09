import pandas as pd
from datetime import datetime
import holidays

def get_indian_festivals_upcoming():
    # Fetch holidays for the current year and next year
    current_year = datetime.now().year
    in_holidays = holidays.India(years=[current_year, current_year + 1])
    
    # We map specific known holidays to roughly matched weights (multiplier)
    holiday_multipliers = {
        "Diwali": 4.0,
        "Deepavali": 4.0,
        "Holi": 2.0,
        "Dussehra": 2.0,
        "Id-ul-Fitr": 3.0,
        "Christmas": 2.0,
        "Makar Sankranti": 2.0 # Pongal equivalent roughly
    }
    
    festivals_list = []
    
    for date, name in sorted(in_holidays.items()):
        # Explicitly skip non-shopping national holidays
        if any(skip_word in name for skip_word in ["Independence Day", "Republic Day", "Gandhi Jayanti"]):
            continue

        multiplier = 2.0 # Default multiplier for typical festivals
        for key_holiday, mult in holiday_multipliers.items():
            if key_holiday.lower() in name.lower():
                multiplier = mult
                break
                
        festivals_list.append({
            "name": name,
            "date": date.strftime("%Y-%m-%d"),
            "multiplier": multiplier,
            # Dynamic crafts list; generalizing to standard crafts
            "crafts": ["textile", "home_decor_brassware", "pottery"]
        })
    return festivals_list

# Fallback cache variable
FESTIVALS = get_indian_festivals_upcoming()

def get_days_to_next_festival(craft_type: str) -> dict:
    """
    Returns: { name, date, days_away, multiplier }
    Logic: filter by craft_type, find earliest future date computationally.
    """
    today = datetime.now().date()
    dynamic_festivals = get_indian_festivals_upcoming()
    
    upcoming = []
    
    for f in dynamic_festivals:
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
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    df = pd.DataFrame({'ds': dates})
    
    df['holiday'] = 0
    df['multiplier'] = 1.0 # Default multiplier is 1.0 (no effect)
    
    dynamic_festivals = get_indian_festivals_upcoming()
    fest_dict = {}
    for f in dynamic_festivals:
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
