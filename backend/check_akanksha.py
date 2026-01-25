import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def list_akanksha_events():
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("Fetching Akanksha events...")
    events = await db.events.find({"sub_fest": "CULTURAL-AKANKSHA"}).to_list(None)

    if not events:
        print("❌ No Akanksha events found.")
    else:
        print(f"✅ Found {len(events)} events:")
        for e in events:
            print(f"- {e.get('name')} (Active: {e.get('is_active')})")

    client.close()

if __name__ == "__main__":
    asyncio.run(list_akanksha_events())
