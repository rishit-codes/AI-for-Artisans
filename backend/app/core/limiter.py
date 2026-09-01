from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter instance, keyed by client IP. Kept in its own module so both
# main.py (app-level wiring) and individual endpoint files (per-route limits)
# can import it without a circular import.
limiter = Limiter(key_func=get_remote_address)
