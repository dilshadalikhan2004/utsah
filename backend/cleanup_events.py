import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def cleanup_duplicates():
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")

    if not mongo_url or not db_name:
        print("❌ Error: MONGO_URL or DB_NAME not found in .env")
        return

    print(f"Connecting to database: {db_name}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print("Checking for duplicate events...")
    
    # aggregation pipeline to find duplicates
    pipeline = [
        {"$group": {
            "_id": "$id",
            "count": {"$sum": 1},
            "docs": {"$push": "$_id"}
        }},
        {"$match": {
            "count": {"$gt": 1}
        }}
    ]

    duplicates = await db.events.aggregate(pipeline).to_list(None)

    if not duplicates:
        print("✅ No duplicate events found.")
    else:
        print(f"⚠️ Found {len(duplicates)} events with duplicates.")
        
        for group in duplicates:
            event_id = group["_id"]
            doc_ids = group["docs"]
            
            # Keep the first one, delete the rest
            ids_to_delete = doc_ids[1:]
            
            print(f"  - Fix: '{event_id}' has {len(doc_ids)} entries. Deleting {len(ids_to_delete)}...")
            
            result = await db.events.delete_many({"_id": {"$in": ids_to_delete}})
            print(f"    Deleted {result.deleted_count} documents.")

    print("\nCleanup complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_duplicates())
