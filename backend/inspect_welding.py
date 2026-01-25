import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def inspect():
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("Searching for 'WEL'...")
    cursor = db.events.find({"name": {"$regex": "WEL", "$options": "i"}})
    events = await cursor.to_list(None)

    for e in events:
        print("\n--- Event Found ---")
        print(f"Name: '{e.get('name')}'")
        print(f"ID: '{e.get('id')}'")
        print(f"Sub Fest: '{e.get('sub_fest')}'")
        print(f"Type: {type(e.get('sub_fest'))}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(inspect())
