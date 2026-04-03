from fastapi import APIRouter
from . import auth, users, products, dashboard, advisor, orders, sales, predictions, market, trends, production, materials

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(advisor.router, prefix="/advisor", tags=["advisor"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(trends.router, prefix="/trends", tags=["trends"])
api_router.include_router(production.router, prefix="/production", tags=["production"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
