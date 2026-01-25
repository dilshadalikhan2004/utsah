import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def seed():
    print("Attempting to login as admin...")
    # 1. Login
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "admin@utsah.com",
            "password": "Admin@123"
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        
        token = resp.json()['token']
        headers = {"Authorization": f"Bearer {token}"}
        print("Logged in as Admin.")
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    # 2. Events Data
    events_data = [
        {
            "name": "FUN WITH WELDING",
            "description": "Structural Design competition.",
            "sub_fest": "TECHNOLOGY-ANWESH",
            "event_type": "team",
            "min_team_size": 2,
            "max_team_size": 3,
            "coordinators": ["TBD"],
            "timing": "10th Feb 2026, 10:00 AM",
            "venue": "Workshop",
            "capacity": 30,
            "registration_deadline": "2026-02-09T23:59:59"
        },
        {
            "name": "BRIDGE DESIGNING",
            "description": "Design and construct the most efficient bridge structure.",
            "sub_fest": "TECHNOLOGY-ANWESH",
            "event_type": "team",
            "min_team_size": 3,
            "max_team_size": 4,
            "coordinators": ["TBD"],
            "timing": "10th Feb 2026, 11:00 AM",
            "venue": "Civil Block",
            "capacity": 40,
            "registration_deadline": "2026-02-09T23:59:59"
        },
        {
            "name": "CIRCUIT DESIGNING",
            "description": "Design and debug electronic circuits.",
            "sub_fest": "TECHNOLOGY-ANWESH",
            "event_type": "team",
            "min_team_size": 2,
            "max_team_size": 2,
            "coordinators": ["TBD"],
            "timing": "10th Feb 2026, 02:00 PM",
            "venue": "Electronics Lab",
            "capacity": 40,
            "registration_deadline": "2026-02-09T23:59:59"
        },
        {
            "name": "MATH OLYMPIAD",
            "description": "Test your mathematical prowess.",
            "sub_fest": "TECHNOLOGY-ANWESH",
            "event_type": "individual",
            "min_team_size": 1,
            "max_team_size": 1,
            "coordinators": ["TBD"],
            "timing": "11th Feb 2026, 10:00 AM",
            "venue": "Exam Hall",
            "capacity": 100,
            "registration_deadline": "2026-02-09T23:59:59"
        },
        {
            "name": "QUIZ",
            "description": "A battle of wits and technical knowledge.",
            "sub_fest": "TECHNOLOGY-ANWESH",
            "event_type": "team",
            "min_team_size": 2,
            "max_team_size": 3,
            "coordinators": ["TBD"],
            "timing": "11th Feb 2026, 02:00 PM",
            "venue": "Auditorium",
            "capacity": 50,
            "registration_deadline": "2026-02-09T23:59:59"
        },
        {
            "name": "FUN WITH CODING",
            "description": "Competitive coding challenge.",
            "sub_fest": "TECHNOLOGY-ANWESH",
            "event_type": "individual",
            "min_team_size": 1,
            "max_team_size": 1,
            "coordinators": ["TBD"],
            "timing": "10th Feb 2026, 10:00 AM",
            "venue": "Computer Center",
            "capacity": 100,
            "registration_deadline": "2026-02-09T23:59:59"
        },
        {
            "name": "JAM",
            "description": "Just A Minute. Show off your speaking skills.",
            "sub_fest": "TECHNOLOGY-ANWESH",
            "event_type": "individual",
            "min_team_size": 1,
            "max_team_size": 1,
            "coordinators": ["TBD"],
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
            "coordinators": ["TBD"],
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
            "coordinators": ["TBD"],
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
            "coordinators": ["TBD"],
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
            "coordinators": ["TBD"],
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
            "coordinators": ["TBD"],
            "timing": "11th Feb 2026, 02:00 PM",
            "venue": "Robotics Lab",
            "capacity": 40,
            "registration_deadline": "2026-02-09T23:59:59"
        }
    ]
    
    count = 0
    for event in events_data:
        try:
            r = requests.post(f"{BASE_URL}/events", json=event, headers=headers)
            if r.status_code == 200:
                print(f"Created: {event['name']}")
                count += 1
            else:
                print(f"Failed to create {event['name']}: {r.status_code} - {r.text}")
        except Exception as e:
            print(f"Error creating {event['name']}: {e}")
            
    print(f"Finished. Created {count} events.")

if __name__ == "__main__":
    seed()
