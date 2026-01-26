import requests
import sys

# URL from user
BASE_URL = "https://utsah-production.up.railway.app"

try:
    # 1. Check Docs (GET)
    print(f"Checking {BASE_URL}/docs...")
    resp = requests.get(f"{BASE_URL}/docs", timeout=5)
    print(f"GET /docs: Status {resp.status_code}")

    # 2. Check Register Prefixed (POST /api/auth/register)
    url_api = f"{BASE_URL}/api/auth/register"
    print(f"\nChecking {url_api}...")
    resp = requests.post(url_api, json={"email": "test@test.com", "password": "pass"}, timeout=5)
    print(f"POST /api/auth/register: Status {resp.status_code}")
    if resp.status_code != 200:
        print(f"Response: {resp.text[:100]}")

    # 3. Check Register Unprefixed (POST /auth/register)
    url_no_api = f"{BASE_URL}/auth/register"
    print(f"\nChecking {url_no_api}...")
    resp = requests.post(url_no_api, json={"email": "test@test.com", "password": "pass"}, timeout=5)
    print(f"POST /auth/register: Status {resp.status_code}")

except Exception as e:
    print(f"Error: {e}")
