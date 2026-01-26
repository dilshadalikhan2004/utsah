import requests

url = "https://utsah-production.up.railway.app/api/auth/register"
headers = {
    "Origin": "https://www.utsahfest.in",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type"
}

try:
    print(f"Checking OPTIONS request to {url} with Origin: {headers['Origin']}")
    response = requests.options(url, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print("Response Headers:")
    for k, v in response.headers.items():
        if 'access-control' in k.lower():
            print(f"{k}: {v}")
            
    if 'Access-Control-Allow-Origin' not in response.headers:
        print("\n❌ CORS Header Missing! Requests will fail.")
    elif response.headers['Access-Control-Allow-Origin'] != headers['Origin'] and response.headers['Access-Control-Allow-Origin'] != '*':
        print(f"\n❌ CORS Origin Mismatch: Expected {headers['Origin']}, got {response.headers['Access-Control-Allow-Origin']}")
    else:
        print("\n✅ CORS Preflight looks CORRECT.")

except Exception as e:
    print(f"Error: {e}")
