"""Backend API tests for Biraajo by Vidip Shah."""
from __future__ import annotations

import io
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

# Load credentials from backend/.env (no hardcoded secrets)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BASE_URL: str = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://biraajo-chef.preview.emergentagent.com",
).rstrip("/")
API: str = f"{BASE_URL}/api"
ADMIN_EMAIL: str = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD: str = os.environ["ADMIN_PASSWORD"]


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def admin_token() -> str:
    r = requests.post(
        f"{API}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and "user" in data
    assert data["user"]["email"] == ADMIN_EMAIL.lower()
    return data["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def test_event(admin_headers: dict[str, str]):
    """Create a fresh event per test and clean it up afterwards."""
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
    yield ev
    requests.delete(f"{API}/events/{ev['id']}", headers=admin_headers, timeout=10)


def _tiny_png_bytes() -> bytes:
    """Return bytes of a minimal valid PNG image."""
    import struct
    import zlib

    def chunk(t: bytes, d: bytes) -> bytes:
        crc = zlib.crc32(t + d)
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", crc)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", 2, 2, 8, 2, 0, 0, 0))
    raw = b"\x00\xff\x00\x00\x00\xff\x00\x00\x00\xff\x00\x00\x00\xff\x00\x00"
    idat = chunk(b"IDAT", zlib.compress(raw))
    iend = chunk(b"IEND", b"")
    return sig + ihdr + idat + iend


# ---------- Health & Auth ----------
def test_health() -> None:
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_login_invalid() -> None:
    r = requests.post(
        f"{API}/auth/login",
        json={"email": ADMIN_EMAIL, "password": "wrong"},
        timeout=10,
    )
    assert r.status_code == 401


def test_auth_me(admin_headers: dict[str, str]) -> None:
    r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == ADMIN_EMAIL.lower()
    assert "password_hash" not in body


def test_auth_me_no_token() -> None:
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


# ---------- Seeded content ----------
def test_menu_seeded() -> None:
    r = requests.get(f"{API}/menu", timeout=10)
    assert r.status_code == 200
    docs = r.json()
    assert isinstance(docs, list)
    assert len(docs) >= 4


def test_gallery_seeded() -> None:
    r = requests.get(f"{API}/gallery", timeout=10)
    assert r.status_code == 200
    docs = r.json()
    assert isinstance(docs, list)
    assert len(docs) >= 10


# ---------- Public Events ----------
def test_events_list_public() -> None:
    r = requests.get(f"{API}/events", timeout=10)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_events_upcoming_filter() -> None:
    r = requests.get(f"{API}/events", params={"upcoming": "true"}, timeout=10)
    assert r.status_code == 200
    today = datetime.now(timezone.utc).date().isoformat()
    for d in r.json():
        assert d.get("date", "") >= today


# ---------- Events CRUD (small, focused tests) ----------
def test_event_create_unauthorized() -> None:
    payload = {
        "title": "TEST_Unauth",
        "date": (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat(),
        "time": "19:30",
        "venue": "v",
        "description": "d",
        "seats_total": 1,
    }
    r = requests.post(f"{API}/events", json=payload, timeout=10)
    assert r.status_code == 401


def test_event_get_single(test_event: dict) -> None:
    r = requests.get(f"{API}/events/{test_event['id']}", timeout=10)
    assert r.status_code == 200
    assert r.json()["id"] == test_event["id"]


def test_event_update(admin_headers: dict[str, str], test_event: dict) -> None:
    payload = {**test_event, "title": "TEST_Supper_Updated"}
    # Remove server-only fields
    for k in ("id", "seats_booked", "is_published", "created_at"):
        payload.pop(k, None)
    r = requests.put(
        f"{API}/events/{test_event['id']}",
        json=payload,
        headers=admin_headers,
        timeout=10,
    )
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_Supper_Updated"


def test_event_delete_cascades(admin_headers: dict[str, str]) -> None:
    # Create a one-shot event to delete
    future = (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat()
    r = requests.post(
        f"{API}/events",
        json={
            "title": "TEST_DEL",
            "date": future,
            "time": "19:30",
            "venue": "v",
            "description": "d",
            "seats_total": 2,
        },
        headers=admin_headers,
        timeout=10,
    )
    eid = r.json()["id"]
    # Add a registration
    requests.post(
        f"{API}/events/{eid}/register",
        json={
            "event_id": eid,
            "full_name": "Del Test",
            "email": f"del_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "9999999999",
            "menu_preference": "Vegetarian",
            "dietary_preferences": "None",
            "guests": 1,
        },
        timeout=10,
    )
    # Delete event
    r = requests.delete(f"{API}/events/{eid}", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    r = requests.get(f"{API}/events/{eid}", timeout=10)
    assert r.status_code == 404
    r = requests.get(
        f"{API}/registrations", params={"event_id": eid}, headers=admin_headers, timeout=10
    )
    assert r.json() == []


# ---------- Registrations ----------
def _register(event_id: str, email: str | None = None, guests: int = 1) -> requests.Response:
    return requests.post(
        f"{API}/events/{event_id}/register",
        json={
            "event_id": event_id,
            "full_name": "TEST User",
            "email": email or f"reg_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9999999999",
            "menu_preference": "Vegetarian",
            "dietary_preferences": "None",
            "guests": guests,
        },
        timeout=10,
    )


def test_registration_creates_pending(test_event: dict) -> None:
    r = _register(test_event["id"], guests=1)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["payment_status"] == "pending"
    assert body["total_amount"] == 2200  # Vegetarian × 1
    assert body.get("upi_id")


def test_registration_seats_increment(test_event: dict) -> None:
    _register(test_event["id"], guests=1)
    r = requests.get(f"{API}/events/{test_event['id']}", timeout=10)
    assert r.json()["seats_booked"] == 1


def test_registration_overbook_returns_400(test_event: dict) -> None:
    # event has 2 seats; request 5
    r = _register(test_event["id"], guests=5)
    assert r.status_code == 400


def test_registration_resubmit_updates_pending(test_event: dict) -> None:
    email = f"resub_{uuid.uuid4().hex[:8]}@example.com"
    r1 = _register(test_event["id"], email=email, guests=1)
    assert r1.status_code == 200
    reg_id_1 = r1.json()["id"]
    # Re-submit same email, change guests
    r2 = _register(test_event["id"], email=email, guests=2)
    assert r2.status_code == 200
    assert r2.json()["id"] == reg_id_1  # Same record updated
    assert r2.json()["guests"] == 2
    assert r2.json()["total_amount"] == 4400


def test_payment_screenshot_confirms(test_event: dict, admin_headers: dict[str, str]) -> None:
    r = _register(test_event["id"], guests=1)
    reg_id = r.json()["id"]

    files = {"file": ("receipt.png", io.BytesIO(_tiny_png_bytes()), "image/png")}
    r = requests.post(
        f"{API}/registrations/{reg_id}/payment-screenshot", files=files, timeout=30
    )
    assert r.status_code == 200, r.text
    assert r.json()["payment_status"] == "confirmed"

    # Admin can now retrieve screenshot
    r = requests.get(
        f"{API}/registrations/{reg_id}/screenshot",
        headers=admin_headers,
        timeout=30,
    )
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("image/")


def test_payment_screenshot_rejects_non_image(test_event: dict) -> None:
    reg_id = _register(test_event["id"], guests=1).json()["id"]
    files = {"file": ("note.txt", io.BytesIO(b"hello"), "text/plain")}
    r = requests.post(
        f"{API}/registrations/{reg_id}/payment-screenshot", files=files, timeout=15
    )
    assert r.status_code == 400


def test_registration_admin_list_and_filter(
    test_event: dict, admin_headers: dict[str, str]
) -> None:
    _register(test_event["id"], guests=1)
    r = requests.get(
        f"{API}/registrations",
        params={"event_id": test_event["id"]},
        headers=admin_headers,
        timeout=10,
    )
    assert r.status_code == 200
    assert len(r.json()) >= 1
    # Filter by payment_status
    r = requests.get(
        f"{API}/registrations",
        params={"event_id": test_event["id"], "payment_status": "pending"},
        headers=admin_headers,
        timeout=10,
    )
    assert r.status_code == 200
    for row in r.json():
        assert row["payment_status"] == "pending"


def test_registration_export_csv(
    test_event: dict, admin_headers: dict[str, str]
) -> None:
    _register(test_event["id"], guests=1)
    r = requests.get(f"{API}/registrations/export", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert "full_name" in r.text
    assert "payment_status" in r.text


def test_registration_admin_delete_releases_seats(
    test_event: dict, admin_headers: dict[str, str]
) -> None:
    reg_id = _register(test_event["id"], guests=2).json()["id"]
    r = requests.delete(
        f"{API}/registrations/{reg_id}", headers=admin_headers, timeout=10
    )
    assert r.status_code == 200
    ev = requests.get(f"{API}/events/{test_event['id']}", timeout=10).json()
    assert ev["seats_booked"] == 0


# ---------- Newsletter ----------
def test_newsletter_subscribe_and_duplicate(admin_headers: dict[str, str]) -> None:
    unique = uuid.uuid4().hex[:8]
    email = f"TEST_sub_{unique}@example.com"
    r = requests.post(
        f"{API}/newsletter", json={"email": email, "name": "TEST"}, timeout=10
    )
    assert r.status_code == 200
    assert r.json().get("ok") == True  # noqa: E712 (explicit bool comparison)

    r = requests.post(f"{API}/newsletter", json={"email": email}, timeout=10)
    assert r.status_code == 200
    assert "Already subscribed" in r.json().get("message", "")

    r = requests.get(f"{API}/newsletter", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    assert any(s["email"] == email.lower() for s in r.json())

    r = requests.get(f"{API}/newsletter/export", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")


# ---------- Contact ----------
def test_contact_create_and_list(admin_headers: dict[str, str]) -> None:
    payload = {
        "name": "TEST Person",
        "email": "test_contact@example.com",
        "phone": "1234",
        "message": "Hello test",
    }
    r = requests.post(f"{API}/contact", json=payload, timeout=10)
    assert r.status_code == 200
    assert r.json().get("ok") == True  # noqa: E712

    r = requests.get(f"{API}/contact", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    assert any(m["message"] == "Hello test" for m in r.json())


# ---------- Gallery & Menu admin ----------
def test_gallery_admin_crud(admin_headers: dict[str, str]) -> None:
    r = requests.post(
        f"{API}/gallery",
        json={"url": "https://example.com/test.jpg", "caption": "TEST", "order": 99},
        headers=admin_headers,
        timeout=10,
    )
    assert r.status_code == 200
    gid = r.json()["id"]
    r = requests.delete(f"{API}/gallery/{gid}", headers=admin_headers, timeout=10)
    assert r.status_code == 200


def test_menu_admin_crud(admin_headers: dict[str, str]) -> None:
    r = requests.post(
        f"{API}/menu",
        json={"title": "TEST_Section", "subtitle": "qa", "items": [], "order": 99},
        headers=admin_headers,
        timeout=10,
    )
    assert r.status_code == 200
    sid = r.json()["id"]
    r = requests.put(
        f"{API}/menu/{sid}",
        json={"title": "TEST_Section_Up", "items": [], "order": 99},
        headers=admin_headers,
        timeout=10,
    )
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_Section_Up"
    r = requests.delete(f"{API}/menu/{sid}", headers=admin_headers, timeout=10)
    assert r.status_code == 200


# ---------- Stats ----------
def test_stats(admin_headers: dict[str, str]) -> None:
    r = requests.get(f"{API}/stats", headers=admin_headers, timeout=10)
    assert r.status_code == 200
    data = r.json()
    for k in (
        "total_events",
        "upcoming_events",
        "total_registrations",
        "confirmed_registrations",
        "pending_registrations",
        "total_subscribers",
        "total_contacts",
        "revenue",
    ):
        assert k in data and isinstance(data[k], int)


def test_stats_unauthorized() -> None:
    r = requests.get(f"{API}/stats", timeout=10)
    assert r.status_code == 401
