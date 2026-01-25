import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def debug_welding():
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("🔎 Inspecting 'FUN WITH WELDING'...")
    cursor = db.events.find({"name": {"$regex": "WELDING", "$options": "i"}})
    events = await cursor.to_list(None)

    for e in events:
        print(f"Name: {e.get('name')}")
        print(f"Sub Fest: {e.get('sub_fest')}")
        print(f"ID: {e.get('id')}")
        print("---")

    # Force fix
    print("\n🛠 Fixing 'FUN WITH WELDING' to be TECHNOLOGY-ANWESH...")
    result = await db.events.update_many(
        {"name": {"$regex": "WELDING", "$options": "i"}},
        {"$set": {"sub_fest": "TECHNOLOGY-ANWESH"}}
    )
    print(f"✅ Updated {result.modified_count} events.")

    client.close()

if __name__ == "__main__":
    asyncio.run(debug_welding())
