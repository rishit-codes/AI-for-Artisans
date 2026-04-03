import logging
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.models.material import Material
from app.core.config import settings

logger = logging.getLogger(__name__)

# Map the frontend full names to Alpha Vantage functions and INR conversion multipliers
COMMODITY_MAPPINGS = {
    "Cotton Yarn (40s)": {"av_function": "COTTON", "multiplier": 2.5},
    "Copper Wire": {"av_function": "COPPER", "multiplier": 0.083},
    "Brass Sheet": {"av_function": "ALUMINUM", "multiplier": 0.095},  # Fallback for Brass
}

async def fetch_alpha_vantage_data(function: str) -> List[float]:
    """Fetch monthly commodity data from Alpha Vantage and return the last 8 valid data points."""
    api_key = settings.ALPHA_VANTAGE_API_KEY
    url = f"https://www.alphavantage.co/query?function={function}&interval=monthly&apikey={api_key}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            
            if "Information" in data and "rate limit" in data["Information"].lower():
                logger.warning(f"Alpha Vantage rate limit reached for {function}.")
                return []
                
            if "data" not in data:
                logger.warning(f"Unexpected Alpha Vantage response for {function}: {data}")
                return []
                
            # Parse valid float values
            valid_points = []
            for item in data["data"]:
                try:
                    val = float(item["value"])
                    valid_points.append(val)
                except (ValueError, TypeError):
                    continue
                    
            # We want the most recent 8 points, assuming the API returns newest first
            recent_points = valid_points[:8]
            
            # Reverse so the oldest is first, newest is last (for sparkline left-to-right)
            recent_points.reverse()
            
            return recent_points
            
        except Exception as e:
            logger.error(f"Error fetching {function} from Alpha Vantage: {e}")
            return []

def generate_sparkline_svg(points: List[float]) -> str:
    """Map a sequence of float prices to a 120x40 SVG polyline string."""
    if not points:
        return ""
        
    min_p = min(points)
    max_p = max(points)
    rng = max_p - min_p
    
    if rng == 0:
        rng = 1 # Avoid division by zero
        
    width = 120
    height = 40
    
    # 8 points means 7 segments
    dx = width / max(1, len(points) - 1)
    
    svg_points = []
    for i, p in enumerate(points):
        x = i * dx
        # In SVG, y=0 is top, y=40 is bottom
        y = height - ((p - min_p) / rng) * height
        svg_points.append(f"{x:.1f},{y:.1f}")
        
    return " ".join(svg_points)

async def update_commodity_prices(db: AsyncSession):
    """Fetch live data and update the Material table."""
    logger.info("Starting live commodity price update from Alpha Vantage...")
    
    # Get all materials
    result = await db.execute(select(Material))
    materials = result.scalars().all()
    
    updated_count = 0
    for material in materials:
        mapping = COMMODITY_MAPPINGS.get(material.commodity_full_name)
        if mapping:
            function = mapping["av_function"]
            multiplier = mapping["multiplier"]
            
            points = await fetch_alpha_vantage_data(function)
            if len(points) >= 2:
                # Calculate new price and trend
                latest_raw = points[-1]
                prev_raw = points[-2]
                
                # Apply INR conversion
                latest_inr = latest_raw * multiplier
                
                # Percentage change
                change_pct = ((latest_raw - prev_raw) / prev_raw) * 100
                
                # Determine trend and color (Inverted: UP = Red, DOWN = Green)
                if change_pct >= 1.0:
                    trend = "up"
                    color = "#ef4444" # Red
                elif change_pct <= -1.0:
                    trend = "down"
                    color = "#22c55e" # Green
                else:
                    trend = "flat"
                    color = "#9ca3af" # Gray
                    
                # Format string
                change_str = f"{'+' if change_pct > 0 else ''}{change_pct:.1f}%"
                if abs(change_pct) < 1.0:
                    change_str = f"— {change_pct:.1f}%"
                    
                price_str = f"₹{int(latest_inr):,}"
                
                # Generate new SVG sparkline
                sparkline_str = generate_sparkline_svg(points)
                
                # Update model
                material.price = price_str
                material.change_pct = change_str
                material.trend = trend
                material.color = color
                material.sparkline_points = sparkline_str
                
                updated_count += 1
                
    if updated_count > 0:
        await db.commit()
        logger.info(f"Successfully updated {updated_count} commodities.")
    else:
        logger.info("No commodities were updated (rate limits or no mappings found).")
