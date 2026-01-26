import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import requests

# Setup DB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "utsah2026")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

async def test_update():
    # 1. Get an event
    event = await db.events.find_one({"is_active": True})
    if not event:
        print("No active events found")
        return

    event_id = event['id']
    print(f"Testing with event: {event_id}")
    print(f"Current deadline (DB): {event.get('registration_deadline')}")

    # 2. Update via curl (requests)
    # Target: Tomorrow same time + 1 hour
    # We need to simulate the frontend payload
    # Frontend sends: "2026-01-27T12:00:00.000Z" (UTC)
    
    # Let's say we want to set it to 2026-05-20 10:00 AM UTC
    new_deadline_utc = "2026-05-20T10:00:00.000Z"
    
    # We need a token? Backend update_event requires admin.
    # The endpoint: @api_router.put("/events/{event_id}", ... admin: dict = Depends(get_admin_user))
    # We can't hit the endpoint without a token.
    
    # Skipping curl, I will just inspect the DB logic directly.
    # Actually, I can check if the value in DB is string or datetime object?
    print(f"Type of deadline in DB: {type(event.get('registration_deadline'))}")

    # If it is a string in DB, does Pydantic convert it?
    # server.py: 
    # if isinstance(updated['registration_deadline'], str): 
    #    updated['registration_deadline'] = datetime.fromisoformat(...)
    
    # If DB has datetime object, Pydantic handles it.
    
    # I suspect DB might have mixed types.
    
    client.close()

if __name__ == "__main__":
    asyncio.run(test_update())
