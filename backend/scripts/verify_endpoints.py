import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_signup():
    print("Testing Signup...")
    payload = {
        "full_name": "Test User",
        "email": "test@example.com",
        "phone": "1234567890",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    print(f"Signup Response: {response.status_code}, {response.json()}")
    return response.status_code == 201

def test_login():
    print("Testing Login...")
    payload = {
        "email": "test@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    print(f"Login Response: {response.status_code}, {response.json()}")
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def test_booking(token):
    print("Testing Booking Submission...")
    payload = {
        "name": "Booking Test",
        "email": "test@example.com",
        "phone": "9876543210",
        "service": "recording",
        "message": "I want to record a song."
    }
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/bookings", json=payload, headers=headers)
    print(f"Booking Response: {response.status_code}, {response.json()}")
    return response.status_code == 201

if __name__ == "__main__":
    # Note: Flask app must be running for this test to work
    print("Starting verification tests...")
    try:
        if test_signup():
            token = test_login()
            if token:
                test_booking(token)
            else:
                print("Login failed, skipping booking test.")
        else:
            print("Signup failed, trying login directly in case user exists...")
            token = test_login()
            if token:
                test_booking(token)
    except Exception as e:
        print(f"Error during tests: {e}")
