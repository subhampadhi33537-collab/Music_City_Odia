import requests
import json

BASE_URL = "http://localhost:8000"

def get_token():
    payload = {"email": "test@example.com", "password": "password123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def test_genres():
    print("Testing Genres...")
    response = requests.get(f"{BASE_URL}/genres")
    print(f"Genres Response: {response.status_code}, Count: {len(response.json())}")
    return response.status_code == 200

def test_songs():
    print("Testing Songs List...")
    response = requests.get(f"{BASE_URL}/songs")
    print(f"Songs Response: {response.status_code}, Count: {len(response.json())}")
    if response.status_code == 200 and len(response.json()) > 0:
        song_id = response.json()[0]['id']
        print(f"Testing Song Detail for ID {song_id}...")
        detail_resp = requests.get(f"{BASE_URL}/songs/{song_id}")
        print(f"Song Detail Response: {detail_resp.status_code}")
        return detail_resp.status_code == 200
    return response.status_code == 200

def test_admin(token):
    print("Testing Admin Stats...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/stats", headers=headers)
    print(f"Admin Stats Response: {response.status_code}, Data: {response.json()}")
    return response.status_code == 200

def test_admin_songs(token):
    print("Testing Admin Songs List...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/songs", headers=headers)
    print(f"Admin Songs Response: {response.status_code}, Count: {len(response.json())}")
    return response.status_code == 200

if __name__ == "__main__":
    print("Starting detailed verification...")
    token = get_token()
    if not token:
        print("Could not get token. Make sure the server is running and test user exists.")
    else:
        test_genres()
        test_songs()
        test_admin(token)
        test_admin_songs(token)
