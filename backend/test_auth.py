import asyncio, sys
sys.path.insert(0, '.')
from app.db.session import AsyncSessionLocal
from app.api.dependencies import get_current_user

async def main():
    async with AsyncSessionLocal() as db:
        u = await get_current_user(token=None, db=db)
        print("got user")
        print(u.id)

asyncio.run(main())
