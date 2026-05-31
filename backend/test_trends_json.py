import asyncio
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.api.endpoints.trends import get_trends

async def test():
    try:
        res = await get_trends(tab="All trends", db=None)
        with open("test_output.json", "w", encoding="utf-8") as f:
            json.dump(res, f, ensure_ascii=False)
        print("SUCCESS")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
