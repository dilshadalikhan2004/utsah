import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

async def update_rules():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    new_rules = [
        "REGISTER ONLY THROUGH THE WEBSITE 'UTSAH2026' (utsahfest.in).",
        "Registration opens FROM 24 JAN 2026 from 7pm to 27 JAN 2026 till 10 am (*No on spot registration allowed).",
        "One student can REGISTER in maximum two events out of the followings.",
        "Anyone not participating in the audition won't be allowed to participate in the events.",
        "Mere participation in the audition does not confirm to be a part of the final event on-stage.",
        "College uniform is mandatory for all participants during audition.",
        "Decisions of jury members are final.",
        "All Faculty Members who are a part of the Cultural Society are requested to reach the venue by 10AM.",
        "All the student coordinators for audition need to contact the respective faculty in-charge."
    ]
    
    print("Updating rules...")
    result = await db.system.update_one(
        {"type": "coordinator_data"},
        {"$set": {"rules": new_rules}}
    )
    
    if result.modified_count > 0:
        print("✅ SUCCESS: Rules updated to 'utsahfest.in'")
    else:
        print("⚠️  No changes made (maybe it was already updated?)")

if __name__ == "__main__":
    asyncio.run(update_rules())
