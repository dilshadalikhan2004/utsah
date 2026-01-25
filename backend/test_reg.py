import requests
import json

url = "http://127.0.0.1:8000/api/auth/register"
data = {
    "full_name": "Test User",
    "email": "test@test.com",
    "password": "Password123",
    "roll_number": "2026CS111",
    "department": "CS",
    "year": 1,
    "mobile_number": "9876543210"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
