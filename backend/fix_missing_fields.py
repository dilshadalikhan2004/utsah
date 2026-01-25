import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def fix_missing_fields():
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")

    if not mongo_url or not db_name:
        print("❌ Error: MONGO_URL or DB_NAME not found in .env")
        return

    print(f"Connecting to database: {db_name}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("Checking for events missing 'capacity' field...")

    # Update all events that don't have a capacity field
    result = await db.events.update_many(
        {"capacity": {"$exists": False}},
        {"$set": {"capacity": 100}}
    )

    print(f"✅ Updated {result.modified_count} events with default capacity (100).")
    
    # Also check for other potential missing fields if seeded incorrectly
    result_subfest = await db.events.update_many(
        {"registered_count": {"$exists": False}},
        {"$set": {"registered_count": 0}}
    )
    if result_subfest.modified_count > 0:
        print(f"✅ Fixed registered_count for {result_subfest.modified_count} events.")

    client.close()
    print("\nFix complete! You can now restart your backend server.")

if __name__ == "__main__":
    asyncio.run(fix_missing_fields())
