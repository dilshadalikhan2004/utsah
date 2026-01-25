import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def test_mongo():
    try:
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        print(f"Connecting to: {mongo_url}")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        # Try a simple command
        await db.command("ping")
        print("SUCCESS: Connected to MongoDB")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_mongo())
