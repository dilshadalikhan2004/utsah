import requests

url = "https://utsah-production.up.railway.app/api/auth/register"
try:
    print(f"Testing POST {url}")
    resp = requests.post(url, json={"test": "data"})
    print(f"Status: {resp.status_code}")
    print(f"Content: {resp.text[:200]}")
    
    # Try without /api just in case
    url_no_api = "https://utsah-production.up.railway.app/auth/register"
    print(f"Testing POST {url_no_api}")
    resp = requests.post(url_no_api, json={"test": "data"})
    print(f"Status: {resp.status_code}")
    print(f"Content: {resp.text[:200]}")
    
    # Try GET to see if it exists but only accepts GET (unlikely for register)
    print(f"Testing GET {url}")
    resp = requests.get(url)
    print(f"Status: {resp.status_code}")

except Exception as e:
    print(e)
