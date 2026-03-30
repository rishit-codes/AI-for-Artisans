import uuid
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import String, DateTime, JSON, ForeignKey, Boolean, Integer, Numeric, Index
from sqlalchemy.orm import mapped_column, Mapped
from app.db.base import Base

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    model_type: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    mape: Mapped[float | None] = mapped_column(Numeric(precision=6, scale=4))
    training_rows: Mapped[int | None] = mapped_column(Integer)
    trained_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    params_json: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.func.now())

    # Constraints
    # Partial unique index: UNIQUE (user_id, product_id) WHERE is_active = TRUE
    # Note: SQLite supports partial indexes since 3.8.0
    
    __table_args__ = (
        Index(
            "uix_model_versions_active",
            "user_id", "product_id",
            unique=True,
            sqlite_where=sa.text("is_active = 1"),
            postgresql_where=sa.text("is_active = true")
        ),
        Index(
            "ix_model_versions_history",
            "user_id", "product_id", sa.text("trained_at DESC")
        ),
    )
