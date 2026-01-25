import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load env
load_dotenv()

with open("seed_status.txt", "w") as f:
    f.write("Script Started\n")

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']

events_data = [
    {
        "name": "FUN WITH WELDING",
        "description": "Structural Design competition. Demonstrate your welding and structural design skills.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "team",
        "min_team_size": 2,
        "max_team_size": 3,
        "coordinators": ["Student Coord 1", "Faculty Coord 1"],
        "timing": "10th Feb 2026, 10:00 AM",
        "venue": "Workshop",
        "capacity": 30,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "BRIDGE DESIGNING",
        "description": "BRIDGE ARCHITECH. Design and construct the most efficient bridge structure.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "team",
        "min_team_size": 3,
        "max_team_size": 4,
        "coordinators": ["Student Coord 2", "Faculty Coord 2"],
        "timing": "10th Feb 2026, 11:00 AM",
        "venue": "Civil Block",
        "capacity": 40,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "CIRCUIT DESIGNING",
        "description": "FUN WITH ELECTRONICS. Design and debug electronic circuits.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "team",
        "min_team_size": 2,
        "max_team_size": 2,
        "coordinators": ["Student Coord 3"],
        "timing": "10th Feb 2026, 02:00 PM",
        "venue": "Electronics Lab",
        "capacity": 40,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "MATH OLYMPIAD",
        "description": "MATH OLYMPIA. Test your mathematical prowess.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["Student Coord 4"],
        "timing": "11th Feb 2026, 10:00 AM",
        "venue": "Exam Hall",
        "capacity": 100,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "QUIZ",
        "description": "TECH QUIZ. A battle of wits and technical knowledge.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "team",
        "min_team_size": 2,
        "max_team_size": 3,
        "coordinators": ["Student Coord 5"],
        "timing": "11th Feb 2026, 02:00 PM",
        "venue": "Auditorium",
        "capacity": 50,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "FUN WITH CODING",
        "description": "CODATHAN. Competitive coding challenge.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["Student Coord 6"],
        "timing": "10th Feb 2026, 10:00 AM",
        "venue": "Computer Center",
        "capacity": 100,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "JAM",
        "description": "Just A Minute. Show off your speaking skills in one minute.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["Student Coord 7"],
        "timing": "11th Feb 2026, 11:00 AM",
        "venue": "Seminar Hall",
        "capacity": 60,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "FACE PAINTING",
        "description": "FACE THEME. Colours and Paint brush to be arranged by the participants.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "team",
        "min_team_size": 2,
        "max_team_size": 2,
        "coordinators": ["Student Coord 8"],
        "timing": "10th Feb 2026, 03:00 PM",
        "venue": "Main Garden",
        "capacity": 30,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "RANGOLI",
        "description": "FLOOR ART. Colours to be arranged by the participants.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "team",
        "min_team_size": 2,
        "max_team_size": 4,
        "coordinators": ["Student Coord 9"],
        "timing": "11th Feb 2026, 09:00 AM",
        "venue": "Main Corridor",
        "capacity": 30,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "FUN EVENTS ON STAGE",
        "description": "Outdoor Fun Events.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["Student Coord 10"],
        "timing": "11th Feb 2026, 04:00 PM",
        "venue": "Open Air Stage",
        "capacity": 200,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "POSTER PAINTING",
        "description": "DIMAG KI BATTI. Colours and Paint brush to be arranged by the participants.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "individual",
        "min_team_size": 1,
        "max_team_size": 1,
        "coordinators": ["Student Coord 11"],
        "timing": "10th Feb 2026, 11:00 AM",
        "venue": "Drawing Hall",
        "capacity": 50,
        "registration_deadline": "2026-02-09T23:59:59"
    },
    {
        "name": "ROBOTICS",
        "description": "Robotics competition. Build and battle.",
        "sub_fest": "TECHNOLOGY-ANWESH",
        "event_type": "team",
        "min_team_size": 2,
        "max_team_size": 4,
        "coordinators": ["Student Coord 12"],
        "timing": "11th Feb 2026, 02:00 PM",
        "venue": "Robotics Lab",
        "capacity": 40,
        "registration_deadline": "2026-02-09T23:59:59"
    }
]

async def seed_events():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Adding ANWESH events...")
    
    for event in events_data:
        event_id = f"{event['sub_fest']}-{event['name']}".replace(" ", "-").lower()
        
        event_doc = event.copy()
        event_doc['id'] = event_id
        event_doc['registered_count'] = 0
        event_doc['is_active'] = True
        event_doc['created_at'] = datetime.now(timezone.utc).isoformat()
        event_doc['max_events_per_student'] = 3
        
        await db.events.update_one(
            {"id": event_id},
            {"$set": event_doc},
            upsert=True
        )
        print(f"Added: {event['name']}")

    print("Success! All events added.")

if __name__ == "__main__":
    asyncio.run(seed_events())
