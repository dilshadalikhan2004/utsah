import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def fix_missing_event_fields():
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("running patch for missing fields (timing, venue, capacity)...")

    # Update all events missing 'timing'
    res_timing = await db.events.update_many(
        {"timing": {"$exists": False}},
        {"$set": {"timing": "TBD"}}
    )
    print(f"Updated {res_timing.modified_count} events with default timing.")

    # Update all events missing 'venue'
    res_venue = await db.events.update_many(
        {"venue": {"$exists": False}},
        {"$set": {"venue": "TBD"}}
    )
    print(f"Updated {res_venue.modified_count} events with default venue.")

    # Update all events missing 'capacity'
    res_capacity = await db.events.update_many(
        {"capacity": {"$exists": False}},
        {"$set": {"capacity": 100}}
    )
    print(f"Updated {res_capacity.modified_count} events with default capacity.")

    print("✅ Patch complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_missing_event_fields())
