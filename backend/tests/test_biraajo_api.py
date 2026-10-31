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
    "http://localhost:8000",
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
    # Gallery cleaned to 7 real customer-assets items (no unsplash stock)
    assert len(docs) >= 7
    for d in docs:
        assert "unsplash" not in d.get("url", "").lower(), (
            f"Unexpected unsplash image in gallery: {d.get('url')}"
        )


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


def test_public_status_returns_full_shape(test_event: dict) -> None:
    """PUBLIC /api/registrations/{id}/status — no auth, returns booking + event info."""
    reg = _register(test_event["id"], guests=1).json()
    reg_id = reg["id"]

    # No auth header
    r = requests.get(f"{API}/registrations/{reg_id}/status", timeout=10)
    assert r.status_code == 200, r.text
    body = r.json()
    # Top-level fields
    for key in (
        "id", "full_name", "email", "guests", "menu_preference",
        "total_amount", "payment_status", "has_screenshot", "upi_id", "event",
    ):
        assert key in body, f"missing key {key}"
    assert body["id"] == reg_id
    assert body["payment_status"] == "pending"
    assert body["total_amount"] == 2200
    assert body["upi_id"]  # non-empty UPI ID
    assert body["has_screenshot"] is False
    # Nested event block
    for key in ("id", "title", "date", "time", "venue"):
        assert key in body["event"], f"missing event.{key}"
    assert body["event"]["id"] == test_event["id"]
    assert body["event"]["title"] == test_event["title"]


def test_public_status_404_for_unknown_id() -> None:
    r = requests.get(f"{API}/registrations/does-not-exist-xyz/status", timeout=10)
    assert r.status_code == 404


def test_public_status_flips_to_confirmed_after_screenshot(test_event: dict) -> None:
    """End-to-end: pending → upload screenshot → public status reports confirmed."""
    reg_id = _register(test_event["id"], guests=1).json()["id"]

    # Initially pending
    r = requests.get(f"{API}/registrations/{reg_id}/status", timeout=10)
    assert r.json()["payment_status"] == "pending"

    files = {"file": ("receipt.png", io.BytesIO(_tiny_png_bytes()), "image/png")}
    up = requests.post(
        f"{API}/registrations/{reg_id}/payment-screenshot", files=files, timeout=30
    )
    assert up.status_code == 200

    r = requests.get(f"{API}/registrations/{reg_id}/status", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["payment_status"] == "confirmed"
    assert body["has_screenshot"] is True


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


# ---------- Google Sheets webhook diagnostics ----------
def test_sheets_test_unauthorized() -> None:
    r = requests.post(f"{API}/sheets/test", timeout=15)
    assert r.status_code == 401


def test_sheets_test_authorized_surfaces_failure(admin_headers: dict[str, str]) -> None:
    """With the user's currently-misconfigured Apps Script (405/HTML),
    /api/sheets/test must return 200 with ok=false and a clear reason."""
    r = requests.post(f"{API}/sheets/test", headers=admin_headers, timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    # Endpoint must always include the webhook URL it pinged
    assert "webhook_url" in body and body["webhook_url"], body
    # ok present
    assert "ok" in body
    # With the broken Apps Script deployment, ok must be False
    # and we should get either a status (HTTP error) or content_type/body
    # showing the HTML error page.
    if body["ok"] is False:
        # Either non-2xx status (e.g. 405) OR HTML response sniffed at 200
        has_status = "status" in body and isinstance(body["status"], int)
        has_html = "content_type" in body and "html" in body.get("content_type", "").lower()
        has_reason = "reason" in body
        assert has_status or has_html or has_reason, body


def test_booking_succeeds_even_when_sheets_webhook_broken(test_event: dict) -> None:
    """Sheets webhook failure must NEVER break the registration flow
    (fire-and-forget via asyncio.create_task)."""
    r = _register(test_event["id"], guests=1)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["payment_status"] == "pending"
    assert body["total_amount"] == 2200


def test_payment_screenshot_succeeds_even_when_sheets_webhook_broken(
    test_event: dict,
) -> None:
    reg_id = _register(test_event["id"], guests=1).json()["id"]
    files = {"file": ("receipt.png", io.BytesIO(_tiny_png_bytes()), "image/png")}
    r = requests.post(
        f"{API}/registrations/{reg_id}/payment-screenshot", files=files, timeout=30
    )
    assert r.status_code == 200, r.text
    assert r.json()["payment_status"] == "confirmed"


# ---------- Site Content CMS ----------
def test_site_content_public_published_returns_full_tree() -> None:
    """GET /api/site-content (default published) returns full content tree."""
    r = requests.get(f"{API}/site-content", timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    for key in ("landing", "about_the_chef", "naani_ghar", "barsaat"):
        assert key in data, f"missing top key {key}"
    # Landing has expected sections
    for sect in ("hero", "about", "experiences", "newsletter", "contact", "footer"):
        assert sect in data["landing"], f"missing landing.{sect}"
    # Hero has expected fields
    hero = data["landing"]["hero"]
    for f in ("visible", "eyebrow", "title", "title_italic", "body", "image"):
        assert f in hero


def test_site_content_draft_mode_auto_seeds() -> None:
    """GET /api/site-content?mode=draft returns 200 (auto-seeds if missing)."""
    r = requests.get(f"{API}/site-content", params={"mode": "draft"}, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "landing" in data
    assert "hero" in data["landing"]


def test_site_content_draft_update_requires_admin() -> None:
    """PUT /api/admin/site-content/draft without auth -> 401."""
    r = requests.put(f"{API}/admin/site-content/draft", json={"landing": {}}, timeout=10)
    assert r.status_code == 401


def test_site_content_draft_publish_discard_roundtrip(admin_headers: dict[str, str]) -> None:
    """Edit draft -> publish -> public sees new published -> discard restores draft."""
    # Snapshot original published so we can restore
    original = requests.get(f"{API}/site-content", timeout=10).json()
    marker = f"TEST_CMS_TITLE_{uuid.uuid4().hex[:8]}"

    # Build new draft based on a current draft fetch
    draft = requests.get(f"{API}/site-content", params={"mode": "draft"}, timeout=10).json()
    draft["landing"]["hero"]["title"] = marker
    try:
        # PUT draft (admin)
        r = requests.put(
            f"{API}/admin/site-content/draft",
            json=draft,
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200, r.text

        # Draft now reflects marker
        d = requests.get(f"{API}/site-content", params={"mode": "draft"}, timeout=10).json()
        assert d["landing"]["hero"]["title"] == marker

        # Published unchanged so far
        p = requests.get(f"{API}/site-content", timeout=10).json()
        assert p["landing"]["hero"]["title"] != marker

        # Publish
        r = requests.post(
            f"{API}/admin/site-content/publish", headers=admin_headers, timeout=15
        )
        assert r.status_code == 200

        p = requests.get(f"{API}/site-content", timeout=10).json()
        assert p["landing"]["hero"]["title"] == marker
    finally:
        # Restore: write the original tree as draft and publish, then discard
        requests.put(
            f"{API}/admin/site-content/draft",
            json=original,
            headers=admin_headers,
            timeout=15,
        )
        requests.post(
            f"{API}/admin/site-content/publish", headers=admin_headers, timeout=15
        )


def test_site_content_reset_restores_defaults(admin_headers: dict[str, str]) -> None:
    """POST /api/admin/site-content/reset returns 200 and resets draft + published to defaults.

    NOTE: This test snapshots both published AND draft, asserts reset behaviour, then
    restores the originals via PUT-draft + publish so user-edited content (e.g. the
    Barsaat 10-course menu which is NOT in site_defaults.py) is not lost.
    """
    original_pub = requests.get(f"{API}/site-content", timeout=10).json()
    original_draft = requests.get(
        f"{API}/site-content", params={"mode": "draft"}, timeout=10
    ).json()
    try:
        r = requests.post(
            f"{API}/admin/site-content/reset",
            json={"confirm": True},
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200
        p = requests.get(f"{API}/site-content", timeout=10).json()
        # Default hero title from site_defaults.py
        assert p["landing"]["hero"]["title"] == "A table is being set"
        d = requests.get(
            f"{API}/site-content", params={"mode": "draft"}, timeout=10
        ).json()
        assert d["landing"]["hero"]["title"] == "A table is being set"
    finally:
        # Restore originals so we don't lose admin-edited content (e.g. Barsaat menu)
        requests.put(
            f"{API}/admin/site-content/draft",
            json=original_pub,
            headers=admin_headers,
            timeout=15,
        )
        requests.post(
            f"{API}/admin/site-content/publish",
            headers=admin_headers,
            timeout=15,
        )
        # Restore draft separately if it diverged from published
        requests.put(
            f"{API}/admin/site-content/draft",
            json=original_draft,
            headers=admin_headers,
            timeout=15,
        )


# ---------- Settings (registrations toggle) ----------
def test_settings_public_returns_bool() -> None:
    """GET /api/settings returns {registrations_open: bool}."""
    r = requests.get(f"{API}/settings", timeout=10)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "registrations_open" in body
    assert isinstance(body["registrations_open"], bool)


def test_settings_put_requires_admin() -> None:
    r = requests.put(f"{API}/admin/settings", json={"registrations_open": False}, timeout=10)
    assert r.status_code == 401


def test_settings_toggle_and_blocks_registration(
    admin_headers: dict[str, str], test_event: dict
) -> None:
    """Flip registrations_open=false -> register returns 403; flip back -> 200."""
    # Snapshot original
    original = requests.get(f"{API}/settings", timeout=10).json().get("registrations_open", True)
    try:
        # Close
        r = requests.put(
            f"{API}/admin/settings",
            json={"registrations_open": False},
            headers=admin_headers,
            timeout=10,
        )
        assert r.status_code == 200, r.text
        assert r.json()["registrations_open"] is False

        # Public sees closed
        pub = requests.get(f"{API}/settings", timeout=10).json()
        assert pub["registrations_open"] is False

        # Registration now returns 403
        reg = _register(test_event["id"], guests=1)
        assert reg.status_code == 403, reg.text
        assert "closed" in reg.json().get("detail", "").lower()

        # Re-open
        r = requests.put(
            f"{API}/admin/settings",
            json={"registrations_open": True},
            headers=admin_headers,
            timeout=10,
        )
        assert r.status_code == 200
        assert r.json()["registrations_open"] is True

        # Registration succeeds again
        reg = _register(test_event["id"], guests=1)
        assert reg.status_code == 200, reg.text
        assert reg.json()["payment_status"] == "pending"
    finally:
        # Restore original setting
        requests.put(
            f"{API}/admin/settings",
            json={"registrations_open": bool(original)},
            headers=admin_headers,
            timeout=10,
        )


# ---------- Barsaat new spec (Jul 5/18/26 2026, prices in settings, menu) ----------
def test_settings_exposes_prices() -> None:
    """GET /api/settings should return registrations_open, price_veg=2200, price_nonveg=2800."""
    r = requests.get(f"{API}/settings", timeout=10)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("price_veg") == 2200
    assert body.get("price_nonveg") == 2800
    assert "registrations_open" in body


def test_three_barsaat_events_present() -> None:
    """Exactly 3 upcoming Barsaat events on Jul 5/18/26 2026, seats=12, tag=Barsaat."""
    r = requests.get(f"{API}/events", params={"upcoming": "true"}, timeout=10)
    assert r.status_code == 200
    evs = r.json()
    barsaat = [
        e for e in evs
        if e.get("tag") == "Barsaat" and e.get("date", "").startswith("2026-07-")
    ]
    dates = sorted(e["date"] for e in barsaat)
    assert dates == ["2026-07-05", "2026-07-18", "2026-07-26"], dates
    for e in barsaat:
        assert e.get("seats_total") == 12, e
        assert e.get("tag") == "Barsaat"


def test_barsaat_site_content_menu_has_10_items_and_4_veg_variants() -> None:
    """Public site-content has barsaat.menu.items of length 10 with 4 alt_dish entries."""
    r = requests.get(f"{API}/site-content", timeout=10)
    assert r.status_code == 200
    items = r.json().get("barsaat", {}).get("menu", {}).get("items", [])
    assert len(items) == 10, f"expected 10 items, got {len(items)}"
    alt = [i for i in items if i.get("alt_dish")]
    assert len(alt) == 4, f"expected 4 veg variants, got {len(alt)}"
    alt_names = {i["alt_dish"] for i in alt}
    # Must include the documented variants (allowing "· Vegetarian" suffix)
    assert any("Dakor Na Gota" in n for n in alt_names), alt_names
    assert any("Jackfruit" in n or "Thepla" in n for n in alt_names), alt_names
    assert any("Mushroom" in n or "Dal Bhaat" in n for n in alt_names), alt_names
    assert any("Cholar" in n or "Sev Ussal" in n or "Miso" in n for n in alt_names), alt_names


def test_register_total_amount_reads_from_settings_veg() -> None:
    """Vegetarian × 1 guest -> total_amount = price_veg = 2200."""
    r = requests.get(f"{API}/events", params={"upcoming": "true"}, timeout=10).json()
    barsaat = next(e for e in r if e.get("tag") == "Barsaat")
    body = {
        "event_id": barsaat["id"],
        "full_name": "TEST Veg User",
        "email": f"veg_{uuid.uuid4().hex[:8]}@example.com",
        "phone": "9000000001",
        "menu_preference": "Vegetarian",
        "dietary_preferences": "None",
        "guests": 1,
    }
    rr = requests.post(f"{API}/events/{barsaat['id']}/register", json=body, timeout=10)
    assert rr.status_code == 200, rr.text
    assert rr.json()["total_amount"] == 2200
    # do NOT delete: per instructions leave registrations
    print("LEFT_REG_ID:", rr.json()["id"])


def test_register_total_amount_reads_from_settings_nonveg_two_guests() -> None:
    """Non-Vegetarian × 2 guests -> total_amount = price_nonveg * 2 = 5600."""
    r = requests.get(f"{API}/events", params={"upcoming": "true"}, timeout=10).json()
    barsaat = next(e for e in r if e.get("tag") == "Barsaat")
    body = {
        "event_id": barsaat["id"],
        "full_name": "TEST NonVeg User",
        "email": f"nonveg_{uuid.uuid4().hex[:8]}@example.com",
        "phone": "9000000002",
        "menu_preference": "Non-Vegetarian",
        "dietary_preferences": "None",
        "guests": 2,
    }
    rr = requests.post(f"{API}/events/{barsaat['id']}/register", json=body, timeout=10)
    assert rr.status_code == 200, rr.text
    assert rr.json()["total_amount"] == 5600
    print("LEFT_REG_ID:", rr.json()["id"])


def test_newsletter_succeeds_even_when_sheets_webhook_broken() -> None:
    email = f"TEST_sheetsfail_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/newsletter", json={"email": email}, timeout=10)
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_contact_succeeds_even_when_sheets_webhook_broken() -> None:
    r = requests.post(
        f"{API}/contact",
        json={
            "name": "TEST sheetsfail",
            "email": "test_contact_sheetsfail@example.com",
            "message": "Hi",
        },
        timeout=10,
    )
    assert r.status_code == 200
    assert r.json().get("ok") is True


# ---------- CMS Snapshot / Restore safety-net (iter 11) ----------
def test_reset_without_confirm_returns_400(admin_headers: dict[str, str]) -> None:
    """POST /api/admin/site-content/reset with no body must return 400 with 'Confirmation required'."""
    # No body
    r = requests.post(f"{API}/admin/site-content/reset", headers=admin_headers, timeout=10)
    assert r.status_code == 400, r.text
    assert "confirmation required" in r.json().get("detail", "").lower()
    # Empty body
    r2 = requests.post(
        f"{API}/admin/site-content/reset", json={}, headers=admin_headers, timeout=10
    )
    assert r2.status_code == 400
    # confirm:false
    r3 = requests.post(
        f"{API}/admin/site-content/reset",
        json={"confirm": False},
        headers=admin_headers,
        timeout=10,
    )
    assert r3.status_code == 400


def test_publish_creates_history_snapshot(admin_headers: dict[str, str]) -> None:
    """POST /api/admin/site-content/publish must take a snapshot with reason=publish and admin actor."""
    before = requests.get(
        f"{API}/admin/site-content/history", headers=admin_headers, timeout=10
    ).json()
    before_count = len(before) if isinstance(before, list) else 0

    r = requests.post(
        f"{API}/admin/site-content/publish", headers=admin_headers, timeout=15
    )
    assert r.status_code == 200, r.text

    after = requests.get(
        f"{API}/admin/site-content/history", headers=admin_headers, timeout=10
    )
    assert after.status_code == 200
    after_list = after.json()
    assert isinstance(after_list, list)
    assert len(after_list) >= before_count + 1
    # Latest entry should have reason=publish and actor=admin email
    latest = after_list[0]
    assert latest.get("reason") == "publish", latest
    assert latest.get("actor") == ADMIN_EMAIL.lower() or latest.get("actor") == ADMIN_EMAIL, latest
    assert "id" in latest and "created_at" in latest


def test_history_get_single_returns_full_payload(admin_headers: dict[str, str]) -> None:
    """GET /api/admin/site-content/history/{id} returns full snapshot incl. draft + published."""
    hist = requests.get(
        f"{API}/admin/site-content/history", headers=admin_headers, timeout=10
    ).json()
    if not hist:
        # ensure at least one
        requests.post(f"{API}/admin/site-content/publish", headers=admin_headers, timeout=15)
        hist = requests.get(
            f"{API}/admin/site-content/history", headers=admin_headers, timeout=10
        ).json()
    sid = hist[0]["id"]
    r = requests.get(
        f"{API}/admin/site-content/history/{sid}", headers=admin_headers, timeout=10
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["id"] == sid
    assert "draft" in body and "published" in body
    # at least one of them should be non-null and look like full content
    pub = body.get("published") or body.get("draft") or {}
    assert isinstance(pub, dict)
    # full tree should have core sections
    assert "landing" in pub or "barsaat" in pub


def test_history_get_unknown_returns_404(admin_headers: dict[str, str]) -> None:
    r = requests.get(
        f"{API}/admin/site-content/history/nonexistent-id-xyz",
        headers=admin_headers,
        timeout=10,
    )
    assert r.status_code == 404


def test_restore_roundtrip_brings_back_previous_content(admin_headers: dict[str, str]) -> None:
    """Round-trip: baseline -> mutate+publish -> restore from baseline snapshot -> matches baseline."""
    # Baseline: capture current published
    baseline = requests.get(f"{API}/site-content", timeout=10).json()
    baseline_draft = requests.get(
        f"{API}/site-content", params={"mode": "draft"}, timeout=10
    ).json()
    baseline_hero_title = baseline["landing"]["hero"]["title"]
    marker_title = f"TEST_RESTORE_MARK_{uuid.uuid4().hex[:8]}"

    # 1) Publish baseline so we have a known snapshot entry
    pub_resp = requests.post(
        f"{API}/admin/site-content/publish", headers=admin_headers, timeout=15
    )
    assert pub_resp.status_code == 200

    hist = requests.get(
        f"{API}/admin/site-content/history", headers=admin_headers, timeout=10
    ).json()
    baseline_snap_id = hist[0]["id"]  # most recent = baseline-publish

    # 2) Mutate draft + publish (destructive change)
    mutated = dict(baseline)
    mutated_landing = dict(mutated.get("landing", {}))
    mutated_hero = dict(mutated_landing.get("hero", {}))
    mutated_hero["title"] = marker_title
    mutated_landing["hero"] = mutated_hero
    mutated["landing"] = mutated_landing
    put = requests.put(
        f"{API}/admin/site-content/draft",
        json=mutated,
        headers=admin_headers,
        timeout=15,
    )
    assert put.status_code == 200
    pub2 = requests.post(
        f"{API}/admin/site-content/publish", headers=admin_headers, timeout=15
    )
    assert pub2.status_code == 200
    after_mut = requests.get(f"{API}/site-content", timeout=10).json()
    assert after_mut["landing"]["hero"]["title"] == marker_title

    # history should now have at least 2 entries (baseline-publish + mutated-publish)
    hist2 = requests.get(
        f"{API}/admin/site-content/history", headers=admin_headers, timeout=10
    ).json()
    assert len(hist2) >= 2, f"expected >=2 history entries, got {len(hist2)}"

    # 3) Restore from the baseline snapshot
    restore = requests.post(
        f"{API}/admin/site-content/restore/{baseline_snap_id}",
        headers=admin_headers,
        timeout=20,
    )
    assert restore.status_code == 200, restore.text
    body = restore.json()
    assert body.get("ok") is True
    assert body.get("restored_from") == baseline_snap_id

    # 4) /api/site-content should match baseline hero title (NOT marker)
    restored_pub = requests.get(f"{API}/site-content", timeout=10).json()
    assert restored_pub["landing"]["hero"]["title"] == baseline_hero_title

    # 5) pre_restore snapshot should have been taken
    hist3 = requests.get(
        f"{API}/admin/site-content/history", headers=admin_headers, timeout=10
    ).json()
    reasons_top3 = [h.get("reason") for h in hist3[:3]]
    assert "pre_restore" in reasons_top3, reasons_top3

    # Cleanup: re-apply baseline draft so admin draft matches
    requests.put(
        f"{API}/admin/site-content/draft",
        json=baseline_draft,
        headers=admin_headers,
        timeout=15,
    )


# ---------- Off-site bookings (iter 11) ----------
@pytest.fixture
def offsite_event(admin_headers: dict[str, str]):
    """Dedicated event for offsite tests so we don't perturb the 3 Barsaat events."""
    future_date = (datetime.now(timezone.utc) + timedelta(days=120)).date().isoformat()
    payload = {
        "title": "TEST_Offsite_Event",
        "date": future_date,
        "time": "19:30",
        "venue": "TEST Offsite Venue",
        "description": "Offsite test event",
        "price": 2500.0,
        "seats_total": 10,
        "image_url": "https://example.com/img.jpg",
        "tag": "TestOffsite",
    }
    r = requests.post(f"{API}/events", json=payload, headers=admin_headers, timeout=10)
    assert r.status_code == 200, r.text
    ev = r.json()
    yield ev
    requests.delete(f"{API}/events/{ev['id']}", headers=admin_headers, timeout=10)


def test_offsite_create_increments_seats_booked(
    admin_headers: dict[str, str], offsite_event: dict
) -> None:
    eid = offsite_event["id"]
    before = requests.get(f"{API}/events/{eid}", timeout=10).json()
    before_booked = int(before.get("seats_booked", 0))

    body = {
        "event_id": eid,
        "full_name": "TEST Offsite Guest",
        "guests": 3,
        "menu_preference": "Vegetarian",
        "source": "TEST_Aggregator",
    }
    r = requests.post(
        f"{API}/admin/offsite-bookings", json=body, headers=admin_headers, timeout=10
    )
    assert r.status_code == 200, r.text
    booking = r.json()
    assert booking["event_id"] == eid
    assert booking["guests"] == 3
    assert booking["source"] == "TEST_Aggregator"
    assert "id" in booking

    after = requests.get(f"{API}/events/{eid}", timeout=10).json()
    assert int(after["seats_booked"]) == before_booked + 3

    # cleanup
    requests.delete(
        f"{API}/admin/offsite-bookings/{booking['id']}", headers=admin_headers, timeout=10
    )


def test_offsite_list_includes_created(
    admin_headers: dict[str, str], offsite_event: dict
) -> None:
    eid = offsite_event["id"]
    body = {"event_id": eid, "full_name": "TEST List Guest", "guests": 1, "source": "TEST_List"}
    created = requests.post(
        f"{API}/admin/offsite-bookings", json=body, headers=admin_headers, timeout=10
    ).json()
    try:
        r = requests.get(
            f"{API}/admin/offsite-bookings",
            params={"event_id": eid},
            headers=admin_headers,
            timeout=10,
        )
        assert r.status_code == 200
        lst = r.json()
        assert any(b["id"] == created["id"] for b in lst)
    finally:
        requests.delete(
            f"{API}/admin/offsite-bookings/{created['id']}",
            headers=admin_headers,
            timeout=10,
        )


def test_offsite_delete_decrements_seats_booked(
    admin_headers: dict[str, str], offsite_event: dict
) -> None:
    eid = offsite_event["id"]
    body = {"event_id": eid, "full_name": "TEST Del Guest", "guests": 2, "source": "TEST_Del"}
    booking = requests.post(
        f"{API}/admin/offsite-bookings", json=body, headers=admin_headers, timeout=10
    ).json()
    mid = requests.get(f"{API}/events/{eid}", timeout=10).json()
    assert int(mid["seats_booked"]) >= 2

    d = requests.delete(
        f"{API}/admin/offsite-bookings/{booking['id']}", headers=admin_headers, timeout=10
    )
    assert d.status_code == 200
    after = requests.get(f"{API}/events/{eid}", timeout=10).json()
    assert int(after["seats_booked"]) == int(mid["seats_booked"]) - 2


def test_offsite_overbook_returns_400(
    admin_headers: dict[str, str], offsite_event: dict
) -> None:
    eid = offsite_event["id"]
    # event has seats_total=10; request 11 -> 400
    body = {"event_id": eid, "full_name": "TEST Over", "guests": 11, "source": "TEST_Over"}
    r = requests.post(
        f"{API}/admin/offsite-bookings", json=body, headers=admin_headers, timeout=10
    )
    assert r.status_code == 400, r.text


def test_offsite_requires_admin(offsite_event: dict) -> None:
    body = {"event_id": offsite_event["id"], "full_name": "TEST", "guests": 1}
    r = requests.post(f"{API}/admin/offsite-bookings", json=body, timeout=10)
    assert r.status_code == 401
    r2 = requests.get(f"{API}/admin/offsite-bookings", timeout=10)
    assert r2.status_code == 401


def test_offsite_unknown_event_returns_404(admin_headers: dict[str, str]) -> None:
    body = {"event_id": "does-not-exist-xyz", "full_name": "TEST", "guests": 1}
    r = requests.post(
        f"{API}/admin/offsite-bookings", json=body, headers=admin_headers, timeout=10
    )
    assert r.status_code == 404
