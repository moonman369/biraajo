"""Backend API tests for Biraajo by Vidip Shah."""
import os
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://feast-studio-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "reachbiraajo@gmail.com"
ADMIN_PASSWORD = "Biraajo@2026"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and "user" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Auth ----------
def test_health():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=10)
    assert r.status_code == 401


def test_auth_me(admin_headers):
    r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == ADMIN_EMAIL
    assert "password_hash" not in body


def test_auth_me_no_token():
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


# ---------- Seeded content ----------
def test_menu_seeded():
    r = requests.get(f"{API}/menu", timeout=10)
    assert r.status_code == 200
    docs = r.json()
    assert isinstance(docs, list)
    assert len(docs) >= 4


def test_gallery_seeded():
    r = requests.get(f"{API}/gallery", timeout=10)
    assert r.status_code == 200
    docs = r.json()
    assert isinstance(docs, list)
    assert len(docs) >= 10


# ---------- Events ----------
def test_events_list_public():
    r = requests.get(f"{API}/events", timeout=10)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_events_upcoming_filter():
    r = requests.get(f"{API}/events", params={"upcoming": "true"}, timeout=10)
    assert r.status_code == 200
    today = datetime.now(timezone.utc).date().isoformat()
    for d in r.json():
        assert d.get("date", "") >= today


def test_event_crud_and_registration(admin_headers):
    # Create
    future_date = (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat()
    payload = {
        "title": "TEST_Supper",
        "date": future_date,
        "time": "19:30",
        "venue": "TEST Venue",
        "description": "Test event for QA",
        "price": 1500.0,
        "seats_total": 2,
        "image_url": "https://example.com/img.jpg",
        "tag": "TestTag",
    }
    r = requests.post(f"{API}/events", json=payload, headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text
    ev = r.json()
    eid = ev["id"]
    assert ev["title"] == "TEST_Supper"
    assert ev["seats_booked"] == 0

    # Unauthorized create
    r2 = requests.post(f"{API}/events", json=payload, timeout=10)
    assert r2.status_code == 401

    # GET single
    r = requests.get(f"{API}/events/{eid}", timeout=10)
    assert r.status_code == 200 and r.json()["id"] == eid

    # Update
    payload["title"] = "TEST_Supper_Updated"
    r = requests.put(f"{API}/events/{eid}", json=payload, headers=admin_headers, timeout=10)
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_Supper_Updated"

    # Register (public)
    unique = uuid.uuid4().hex[:8]
    reg_payload = {
        "event_id": eid,
        "full_name": "TEST User",
        "email": f"test_{unique}@example.com",
        "phone": "9999999999",
        "guests": 1,
    }
    r = requests.post(f"{API}/events/{eid}/register", json=reg_payload, timeout=10)
    assert r.status_code == 200, r.text
    reg = r.json()
    assert reg["event_id"] == eid

    # Duplicate (409)
    r = requests.post(f"{API}/events/{eid}/register", json=reg_payload, timeout=10)
    assert r.status_code == 409

    # Overbook (400) - only 1 seat left now, request 5
    over_payload = dict(reg_payload)
    over_payload["email"] = f"test2_{unique}@example.com"
    over_payload["guests"] = 5
    r = requests.post(f"{API}/events/{eid}/register", json=over_payload, timeout=10)
    assert r.status_code == 400

    # Verify seats_booked incremented
    r = requests.get(f"{API}/events/{eid}", timeout=10)
    assert r.json()["seats_booked"] == 1

    # Admin lists registrations
    r = requests.get(f"{API}/registrations", params={"event_id": eid}, headers=admin_headers, timeout=10)
    assert r.status_code == 200 and len(r.json()) >= 1

    # Export CSV
    r = requests.get(f"{API}/registrations/export", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert "full_name" in r.text

    # Delete event -> registrations should be cleared
    r = requests.delete(f"{API}/events/{eid}", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    r = requests.get(f"{API}/events/{eid}", timeout=10)
    assert r.status_code == 404
    r = requests.get(f"{API}/registrations", params={"event_id": eid}, headers=admin_headers, timeout=10)
    assert r.json() == []


# ---------- Newsletter ----------
def test_newsletter_subscribe_and_duplicate(admin_headers):
    unique = uuid.uuid4().hex[:8]
    email = f"TEST_sub_{unique}@example.com"
    r = requests.post(f"{API}/newsletter", json={"email": email, "name": "TEST"}, timeout=10)
    assert r.status_code == 200 and r.json().get("ok") is True

    r = requests.post(f"{API}/newsletter", json={"email": email}, timeout=10)
    assert r.status_code == 200
    assert "Already subscribed" in r.json().get("message", "")

    r = requests.get(f"{API}/newsletter", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    assert any(s["email"] == email.lower() for s in r.json())

    r = requests.get(f"{API}/newsletter/export", headers=admin_headers, timeout=15)
    assert r.status_code == 200 and "text/csv" in r.headers.get("content-type", "")


# ---------- Contact ----------
def test_contact_create_and_list(admin_headers):
    payload = {"name": "TEST Person", "email": "test_contact@example.com", "phone": "1234", "message": "Hello test"}
    r = requests.post(f"{API}/contact", json=payload, timeout=10)
    assert r.status_code == 200 and r.json().get("ok") is True

    r = requests.get(f"{API}/contact", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    assert any(m["message"] == "Hello test" for m in r.json())


# ---------- Gallery & Menu admin ----------
def test_gallery_admin_crud(admin_headers):
    r = requests.post(f"{API}/gallery", json={"url": "https://example.com/test.jpg", "caption": "TEST", "order": 99},
                      headers=admin_headers, timeout=10)
    assert r.status_code == 200
    gid = r.json()["id"]
    r = requests.delete(f"{API}/gallery/{gid}", headers=admin_headers, timeout=10)
    assert r.status_code == 200


def test_menu_admin_crud(admin_headers):
    r = requests.post(f"{API}/menu", json={"title": "TEST_Section", "subtitle": "qa", "items": [], "order": 99},
                      headers=admin_headers, timeout=10)
    assert r.status_code == 200
    sid = r.json()["id"]
    r = requests.put(f"{API}/menu/{sid}", json={"title": "TEST_Section_Up", "items": [], "order": 99},
                     headers=admin_headers, timeout=10)
    assert r.status_code == 200 and r.json()["title"] == "TEST_Section_Up"
    r = requests.delete(f"{API}/menu/{sid}", headers=admin_headers, timeout=10)
    assert r.status_code == 200


# ---------- Stats ----------
def test_stats(admin_headers):
    r = requests.get(f"{API}/stats", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    data = r.json()
    for k in ("total_events", "upcoming_events", "total_registrations", "total_subscribers", "total_contacts"):
        assert k in data and isinstance(data[k], int)


def test_stats_unauthorized():
    r = requests.get(f"{API}/stats", timeout=10)
    assert r.status_code == 401
