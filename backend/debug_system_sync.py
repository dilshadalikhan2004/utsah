from pymongo import MongoClient
import os
from dotenv import load_dotenv
from pathlib import Path
import pprint

# Setup
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.getenv("MONGO_URL")
db_name = os.getenv("DB_NAME")

def check_data():
    print("Connecting to MongoDB...")
    client = MongoClient(mongo_url)
    db = client[db_name]
    print(f"Associated DB: {db.name}")

    data = db.system.find_one({"type": "coordinator_data"})
    print("\n--- RAW DATA ---")
    pprint.pprint(data)
    
    if data and 'schedule' in data:
        print("\n--- SCHEDULE ANALYSIS ---")
        schedule = data['schedule']
        print(f"Schedule Type: {type(schedule)}")
        if isinstance(schedule, list):
            for i, item in enumerate(schedule):
                print(f"Item {i}: {type(item)}")
                if isinstance(item, dict):
                    for k, v in item.items():
                        print(f"  {k}: {type(v)} = {v}")

if __name__ == "__main__":
    check_data()
