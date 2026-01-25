import requests
import json
try:
    r = requests.get("http://127.0.0.1:8000/api/events?sub_fest=TECHNOLOGY-ANWESH")
    with open("check_events.txt", "w") as f:
        f.write(f"Count: {len(r.json())}\n")
        for e in r.json():
            f.write(f"- {e['name']}\n")
except Exception as e:
    with open("check_events.txt", "w") as f:
        f.write(str(e))
