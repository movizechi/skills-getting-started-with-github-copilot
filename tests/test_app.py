from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Basic sanity check for a known activity
    assert "Chess Club" in data


def test_signup_and_remove_flow():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure the test email is not present at start
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up the user
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Signing up again should fail (duplicate)
    resp_dup = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp_dup.status_code == 400

    # Remove the participant
    resp_rem = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert resp_rem.status_code == 200
    assert email not in activities[activity]["participants"]

    # Removing again should return 404
    resp_rem2 = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert resp_rem2.status_code == 404
