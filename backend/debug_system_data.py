import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import pprint

# Setup
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.getenv("MONGO_URL")
db_name = os.getenv("DB_NAME")

async def check_data():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    data = await db.system.find_one({"type": "coordinator_data"})
    print("--- RAW DATA ---")
    pprint.pprint(data)
    
    if data and 'schedule' in data:
        print("\n--- SCHEDULE TYPE ---")
        print(f"Type: {type(data['schedule'])}")
        if isinstance(data['schedule'], list):
            for i, item in enumerate(data['schedule']):
                print(f"Item {i}: {type(item)} - {item}")

if __name__ == "__main__":
    asyncio.run(check_data())
