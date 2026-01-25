import requests
import json

try:
    response = requests.get("http://127.0.0.1:8000/api/events?sub_fest=TECHNOLOGY-ANWESH")
    print(f"Status: {response.status_code}")
    events = response.json()
    print(f"Found {len(events)} events")
    for event in events:
        print(f"- {event['name']}")
except Exception as e:
    print(f"Error: {e}")
