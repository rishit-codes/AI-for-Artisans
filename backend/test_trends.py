import asyncio
import sys
from app.api.endpoints.trends import get_trends

async def test():
    try:
        res = await get_trends(tab="All Trends", db=None)
        print("RESULT:")
        print(res)
    except Exception as e:
        print(f"FAILED WITH: {e}")

if __name__ == '__main__':
    asyncio.run(test())
