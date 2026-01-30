import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

async def check_events():
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        events = await db.events.find({"sub_fest": "SPORTS-AHWAAN"}).to_list(None)
        
        with open("verification.txt", "w") as f:
            f.write(f"Count: {len(events)}\n")
            for e in events:
                f.write(f"- {e.get('name')} ({e.get('id')})\n")
                
    except Exception as e:
        with open("verification.txt", "w") as f:
            f.write(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_events())
