import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Pointing to the .env file in the same directory as this script
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

print(f"Loaded config. DB_NAME: {DB_NAME}")

ahwaan_data = [
    {
        "event": "AHWAAN - LEADERSHIP",
        "faculty": [
            {"name": "Dr. C.K. Nayak", "dept": "VP Athletic Society", "phone": "-"},
            {"name": "Dr. SK Biswal", "dept": "VP Athletic Society", "phone": "-"}
        ],
        "students": [
            {"name": "Anand Raj", "year": "4th (CSE)", "phone": "9142888432"},
            {"name": "Pooja Das", "year": "4th (CSIT)", "phone": "9040472927"},
            {"name": "Simpy Jaiswal", "year": "3rd (CSE)", "phone": "7077330598"}
        ]
    },
    {
        "event": "AHWAAN - TRACK (100m, 200m, 400m, 800m)",
        "faculty": [],
        "students": [
            {"name": "Mamuni Behera", "year": "1st (CSE)", "phone": "7855977937"},
            {"name": "Komal Kumari Singh", "year": "1st (CSEAIML)", "phone": "7004211516"},
            {"name": "Pranab Sahoo", "year": "3rd (CSEDS)", "phone": "9692371718"},
            {"name": "Satyajit Sahoo", "year": "2nd (CST)", "phone": "9861010590"},
            {"name": "Jishnu Mohapatra", "year": "3rd (CSIT)", "phone": "7735295239"},
            {"name": "Priyanshu Pattanaik", "year": "3rd (CSEIoT)", "phone": "9337181983"}
        ]
    },
    {
        "event": "AHWAAN - THROWS & JUMPS",
        "faculty": [],
        "students": [
            {"name": "Ankita Kumari", "year": "1st (CSE)", "phone": "9771913050"},
            {"name": "Neha Sethy", "year": "3rd (CSIT)", "phone": "9668370798"},
            {"name": "Priya Kumari", "year": "2nd (CSIT)", "phone": "7067451886"},
            {"name": "Shrishti Gupta", "year": "2nd (CSEDS)", "phone": "8002447034"},
            {"name": "Rakesh Kumar Biswal", "year": "3rd (CSEAIML)", "phone": "9348719421"},
            {"name": "Ayushman Sandha", "year": "2nd (CSIT)", "phone": "8249127449"},
            {"name": "Mohit Sutar", "year": "2nd (Civil)", "phone": "9778180531"},
            {"name": "Satyajit Gochhayat", "year": "2nd (CSE)", "phone": "7847975882"},
            {"name": "Manish Jenamani", "year": "2nd (CSIT)", "phone": "7978157575"},
            {"name": "Ayush Singh", "year": "1st (CSEDS)", "phone": "9668848434"}
        ]
    },
    {
        "event": "AHWAAN - GENERAL & RELAY",
        "faculty": [],
        "students": [
            {"name": "Divyajyoti Mahakul", "year": "1st (CSE)", "phone": "9861279383"},
            {"name": "Payal Pritinanda", "year": "3rd (CSEIoT)", "phone": "9337766931"}
        ]
    }
]

def update_coordinators():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Fetching existing coordinator data...")
    system_data = db.system.find_one({"type": "coordinator_data"})
    
    if not system_data:
        print("No system data found! Creating new structure...")
        system_data = {"type": "coordinator_data", "coordinators": []}

    current_coordinators = system_data.get('coordinators', [])
    
    # Remove existing Ahwaan entries to avoid duplicates
    print("Removing existing AHWAAN entries...")
    filtered_coordinators = [
        c for c in current_coordinators 
        if not c.get('event', '').startswith('AHWAAN')
    ]
    
    # Add new entries
    print("Adding new AHWAAN entries...")
    updated_coordinators = filtered_coordinators + ahwaan_data
    
    # Update database
    if system_data.get('_id'):
        db.system.update_one(
            {"type": "coordinator_data"},
            {"$set": {"coordinators": updated_coordinators}}
        )
    else:
         db.system.insert_one({
             "type": "coordinator_data",
             "coordinators": updated_coordinators,
             "schedule": [],
             "rules": []
         })
    
    print("Success! Coordinator data updated.")

if __name__ == "__main__":
    update_coordinators()
