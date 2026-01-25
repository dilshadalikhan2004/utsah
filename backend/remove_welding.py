import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def remove_welding():
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("Deleting 'FUN WITH WELDING' events...")
    # Delete by name case-insensitive
    result = await db.events.delete_many({"name": {"$regex": "FUN WITH WELDING", "$options": "i"}})
    
    print(f"✅ Deleted {result.deleted_count} events.")
    client.close()

if __name__ == "__main__":
    asyncio.run(remove_welding())
