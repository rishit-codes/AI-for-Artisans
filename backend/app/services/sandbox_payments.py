"""Simulated payment gateway.

No Razorpay/Stripe credentials exist for this project, so checkout goes
through this sandbox stand-in instead: it always succeeds and returns a
fake payment reference, matching the same "real object, sandboxed
transport" pattern as app.services.email (real EmailOutbox rows instead
of a live SMTP send).
"""
import uuid


def create_sandbox_payment(amount, currency: str) -> str:
    return f"sandbox_pay_{uuid.uuid4().hex}"
