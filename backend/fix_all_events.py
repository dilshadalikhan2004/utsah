import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def fix_all_events():
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")

    if not mongo_url:
        print("❌ MONGO_URL not found")
        return

    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("Fetching all events...")
    events = await db.events.find({}).to_list(None)
    print(f"Found {len(events)} events.")

    updates_count = 0
    for event in events:
        update_fields = {}
        
        # Check and set defaults for missing fields
        if "capacity" not in event:
            update_fields["capacity"] = 100
        
        if "max_events_per_student" not in event:
            update_fields["max_events_per_student"] = 2
            
        if "registered_count" not in event:
            update_fields["registered_count"] = 0
            
        if "min_team_size" not in event:
            update_fields["min_team_size"] = 1
            
        if "max_team_size" not in event:
            update_fields["max_team_size"] = 1

        if update_fields:
            print(f"Fixing event: {event.get('name', 'Unknown')} (ID: {event.get('id')}) -> Adding {list(update_fields.keys())}")
            await db.events.update_one({"_id": event["_id"]}, {"$set": update_fields})
            updates_count += 1

    print(f"✅ Fixed {updates_count} events.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_all_events())
