import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from app.db.base import Base

class MandiScrapingLog(Base):
    """Audit log table mapping to `mandi_scraping_logs` specified in paper Section 8.2 & ERD Figure 3."""

    __tablename__ = "mandi_scraping_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(String(50), default=lambda: str(uuid.uuid4()), index=True)
    mandi_city = Column(String(50), nullable=False, index=True)
    commodity_name = Column(String(100), nullable=False, index=True)
    price_per_unit = Column(Float, nullable=False, default=0.0)
    unit = Column(String(20), default="₹/kg")
    status_code = Column(Integer, default=200)
    response_time_ms = Column(Float, default=0.0)
    scraped_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

class MandiPrice(Base):
    """Real-time scraped rates per city and commodity across Surat, Delhi, Jaipur, Varanasi, and Mumbai."""

    __tablename__ = "mandi_prices"

    id = Column(Integer, primary_key=True, index=True)
    commodity_name = Column(String(100), nullable=False, index=True)
    hindi_name = Column(String(100), default="")
    category = Column(String(50), default="Textiles")  # Textiles, Metals, Pottery
    unit = Column(String(20), default="₹/kg")
    
    # Prices across 5 cities
    varanasi_price = Column(Float, default=0.0)
    surat_price = Column(Float, default=0.0)
    delhi_price = Column(Float, default=0.0)
    jaipur_price = Column(Float, default=0.0)
    mumbai_price = Column(Float, default=0.0)
    
    delta_7d = Column(Float, default=0.0)
    sparkline_points = Column(Text, default="")  # JSON array of 7 daily prices, oldest first
    supply_status = Column(String(20), default="stable")  # high, tight, stable
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    # "live" if agmarknet.gov.in returned a matching commodity-name row in the
    # last scrape cycle, "estimated" if it fell back to a calibrated base price
    # + small jitter (agmarknet tracks raw agricultural produce, not most craft
    # inputs like zari thread or lac, so most commodities are honestly estimated).
    data_source = Column(String(20), default="estimated")
