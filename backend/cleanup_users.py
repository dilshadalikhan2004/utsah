import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URL:
    print("Error: MONGO_URL not found in environment")
    exit(1)

async def cleanup_users():
    print("Starting user cleanup process...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # 1. Find users with invalid mobile numbers (not 10 digits)
    # We use a regex to look for anything that isn't exactly 10 digits or is not numeric
    invalid_mobile_cursor = db.users.find({
        "$or": [
            {"mobile_number": {"$not": {"$regex": "^\\d{10}$"}}},
            {"mobile_number": {"$exists": False}},
            {"mobile_number": None},
            {"mobile_number": ""}
        ]
    })
    
    users_to_delete = []
    async for user in invalid_mobile_cursor:
        # Double check in python just to be safe
        mobile = str(user.get('mobile_number', '')).strip()
        if len(mobile) != 10 or not mobile.isdigit():
            users_to_delete.append(user['email'])

    print(f"Found {len(users_to_delete)} users with invalid mobile numbers.")
    
    if len(users_to_delete) > 0:
        print("Deleting users:", users_to_delete)
        result = await db.users.delete_many({"email": {"$in": users_to_delete}})
        print(f"✅ Deleted {result.deleted_count} users.")
        
        # Also clean up their registrations? 
        # Ideally yes, but let's keep it safe. If user is deleted, they can't login.
        # If they register again with same email, they get a fresh start.
    else:
        print("✅ No invalid users found.")

    print("Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(cleanup_users())
