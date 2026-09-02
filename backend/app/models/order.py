import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, ForeignKey, DateTime, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Order(Base):
    """Order model — specified in Blueprint §6.2."""

    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    artisan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(nullable=False, default=1)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    # pending -> confirmed -> shipped -> delivered, or cancelled at any point before shipped
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # buyer_id is set for real marketplace purchases (app.api.endpoints.marketplace);
    # it stays nullable because orders an artisan logs manually (offline/walk-in
    # sales via POST /orders) have no buyer account, only free-text contact info.
    buyer_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    buyer_name: Mapped[Optional[str]] = mapped_column(String(255))
    buyer_email: Mapped[Optional[str]] = mapped_column(String(255))
    buyer_phone: Mapped[Optional[str]] = mapped_column(String(20))
    shipping_address: Mapped[Optional[str]] = mapped_column(String(500))
    shipping_city: Mapped[Optional[str]] = mapped_column(String(100))
    shipping_state: Mapped[Optional[str]] = mapped_column(String(100))
    shipping_pincode: Mapped[Optional[str]] = mapped_column(String(10))

    # Fulfillment, set by the artisan once they ship
    carrier: Mapped[Optional[str]] = mapped_column(String(100))
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100))
    shipped_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Sandbox payment (see app.services.sandbox_payments) — no real payment
    # gateway credentials exist, so purchases go through a simulated gateway
    # that always succeeds rather than a real Razorpay/Stripe integration.
    payment_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, paid, failed
    payment_ref: Mapped[Optional[str]] = mapped_column(String(100))
