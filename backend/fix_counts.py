
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URL or not DB_NAME:
    print("Please set MONGO_URL and DB_NAME environment variables.")
    exit(1)

async def fix_counts():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Starting registration count sync...")
    
    # Get all events
    events = await db.events.find({}).to_list(None)
    print(f"Found {len(events)} events.")
    
    updated_count = 0
    
    for event in events:
        event_id = event['id']
        current_count = event.get('registered_count', 0)
        
        # Count actual registrations
        actual_count = await db.registrations.count_documents({"event_id": event_id})
        
        if current_count != actual_count:
            print(f"Mismatch for {event['sub_fest']} - {event['name']} ({event_id}): stored={current_count}, actual={actual_count}")
            
            await db.events.update_one(
                {"id": event_id},
                {"$set": {"registered_count": actual_count}}
            )
            updated_count += 1
            
    print(f"Sync complete. Updated {updated_count} events.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_counts())
