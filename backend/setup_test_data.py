import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime

# Setup
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "utsah2026"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def setup():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # create admin
    admin_email = "admin@test.com"
    admin_password = "password123"
    hashed_password = pwd_context.hash(admin_password)
    
    admin_user = {
        "email": admin_email,
        "hashed_password": hashed_password,
        "full_name": "Test Admin",
        "role": "admin",
        "is_active": True,
        "verified": True,
        "roll_number": "ADMIN001",
        "department": "ADMIN",
        "year": 4,
        "mobile_number": "9999999999",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.users.update_one(
        {"email": admin_email}, 
        {"$set": admin_user}, 
        upsert=True
    )
    print(f"Upserted Admin: {admin_email} / {admin_password}")

    # create student
    student_email = "student@test.com"
    student_password = "password123"
    hashed_pass_student = pwd_context.hash(student_password)
    
    student_user = {
        "email": student_email,
        "hashed_password": hashed_pass_student,
        "full_name": "Test Student",
        "role": "student",
        "is_active": True,
        "verified": True,
        "roll_number": "STU001",
        "department": "CSE",
        "year": 2,
        "mobile_number": "8888888888",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.users.update_one(
        {"email": student_email}, 
        {"$set": student_user}, 
        upsert=True
    )
    print(f"Upserted Student: {student_email} / {student_password}")

if __name__ == "__main__":
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_until_complete(setup())
