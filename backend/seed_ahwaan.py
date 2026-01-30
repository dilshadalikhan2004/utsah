import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load env variables
load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

if not MONGO_URL:
    print("Error: MONGO_URL not found in environment variables.")
    # Fallback for dev if needed, strictly speaking we should rely on env
    # MONGO_URL = "mongodb+srv://..." 
    exit(1)

if not DB_NAME:
    print("Error: DB_NAME not found in environment variables.")
    exit(1)

EVENTS = [
    # Boys Events
    {
        "name": "100 Meters (Boys)",
        "description": "100 meters sprint event for boys.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "200 Meters (Boys)",
        "description": "200 meters sprint event for boys.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "400 Meters (Boys)",
        "description": "400 meters sprint event for boys.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "100x4 Relay (Boys)",
        "description": "100x4 meters relay race for boys.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "team",
        "min_team_size": 4,
        "max_team_size": 4,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "Javelin (Boys)",
        "description": "Javelin throw event for boys.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "Shot Put (Boys)",
        "description": "Shot Put event for boys.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "Discus (Boys)",
        "description": "Discus throw event for boys.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "High Jump (Boys)",
        "description": "High Jump event for boys.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "Long Jump (Boys)",
        "description": "Long Jump event for boys.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },

    # Girls Events
    {
        "name": "100 Meters (Girls)",
        "description": "100 meters sprint event for girls.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "200 Meters (Girls)",
        "description": "200 meters sprint event for girls.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "100x4 Relay (Girls)",
        "description": "100x4 meters relay race for girls.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "team",
        "min_team_size": 4,
        "max_team_size": 4,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "Javelin (Girls)",
        "description": "Javelin throw event for girls.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "Shot Put (Girls)",
        "description": "Shot Put event for girls.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "Discus (Girls)",
        "description": "Discus throw event for girls.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    },
    {
        "name": "Long Jump (Girls)",
        "description": "Long Jump event for girls.",
        "sub_fest": "SPORTS-AHWAAN",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["TBD"],
        "timing": "9th-10th Feb 2026",
        "venue": "Sports Ground",
        "registration_deadline": "2026-02-08T23:59:59",
        "max_events_per_student": 4
    }
]

async def seed_events():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Adding AHWAAN events...")
    
    for event in EVENTS:
        event_id = f"{event['sub_fest']}-{event['name']}".replace(" ", "-").lower()
        
        event_doc = event.copy()
        event_doc['id'] = event_id
        # Preserve existing fields if updating, or defaults
        event_doc['registered_count'] = 0 
        event_doc['is_active'] = True
        event_doc['created_at'] = datetime.now(timezone.utc).isoformat()
        
        # Use update_one with upsert to avoid duplicates but update content
        # Note: This resets registered_count if we are not careful. 
        # But for seeding, we usually want to reset or we should check existence.
        # Let's check if it exists first to preserve registration count.
        
        existing = await db.events.find_one({"id": event_id})
        if existing:
            event_doc['registered_count'] = existing.get('registered_count', 0)
        
        await db.events.update_one(
            {"id": event_id},
            {"$set": event_doc},
            upsert=True
        )
        print(f"Added/Updated: {event['name']}")

    print("Success! All Ahwaan events added.")

if __name__ == "__main__":
    asyncio.run(seed_events())
