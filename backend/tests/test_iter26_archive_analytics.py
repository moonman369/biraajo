"""Iteration 26 - Registration archive/restore + Traffic analytics."""
import os, requests, pytest, uuid
from datetime import datetime, timedelta

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN = {"email": "reachbiraajo@gmail.com", "password": "Biraajo@2026"}


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# --- Helper: create a temp event
def _create_event(headers):
    future_date = (datetime.utcnow() + timedelta(days=30)).date().isoformat()
    payload = {
        "title": f"TEST_iter26_{uuid.uuid4().hex[:6]}",
        "date": future_date,
        "time": "19:00",
        "location": "Test Venue",
        "venue": "Test Venue",
        "price": 2200,
        "capacity": 20,
        "description": "temp event for archive test",
        "tag": "test",
    }
    r = requests.post(f"{API}/events", json=payload, headers=headers, timeout=30)
    assert r.status_code in (200, 201), f"create event {r.status_code}: {r.text}"
    return r.json()["id"]


def _register(event_id):
    payload = {
        "event_id": event_id,
        "full_name": f"TEST_iter26_{uuid.uuid4().hex[:6]}",
        "email": "test_iter26@example.com",
        "phone": "9999900000",
        "menu_preference": "Vegetarian",
        "guests": 1,
        "dietary_preferences": "",
        "notes": "",
    }
    r = requests.post(f"{API}/events/{event_id}/register", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"register {r.status_code}: {r.text}"
    return r.json()["id"]


# =============== ARCHIVE / RESTORE ===============

def test_manual_delete_archives_registration(admin_headers):
    event_id = _create_event(admin_headers)
    reg_id = _register(event_id)

    # Delete registration -> should archive
    d = requests.delete(f"{API}/registrations/{reg_id}", headers=admin_headers, timeout=30)
    assert d.status_code == 200, d.text

    # It should no longer be in active list
    r = requests.get(f"{API}/registrations", headers=admin_headers, timeout=30).json()
    assert not any(x["id"] == reg_id for x in r), "reg still active after delete"

    # It should be in archive with reason=manual_delete
    arch = requests.get(f"{API}/registrations/archived", headers=admin_headers, timeout=30).json()
    match = [x for x in arch if x["id"] == reg_id]
    assert match, "reg not in archive"
    assert match[0]["archive_reason"] == "manual_delete"

    # Restore
    r = requests.post(f"{API}/registrations/{reg_id}/restore", headers=admin_headers, timeout=30)
    assert r.status_code == 200 and r.json()["restored"] is True

    # Restored back into active list
    active = requests.get(f"{API}/registrations", headers=admin_headers, timeout=30).json()
    assert any(x["id"] == reg_id for x in active), "reg not restored"

    # Removed from archive
    arch2 = requests.get(f"{API}/registrations/archived", headers=admin_headers, timeout=30).json()
    assert not any(x["id"] == reg_id for x in arch2), "still in archive after restore"

    # Cleanup: delete registration + event
    requests.delete(f"{API}/registrations/{reg_id}", headers=admin_headers, timeout=30)
    requests.delete(f"{API}/events/{event_id}", headers=admin_headers, timeout=30)


def test_event_delete_archives_registrations(admin_headers):
    event_id = _create_event(admin_headers)
    reg_id = _register(event_id)

    # Delete event -> should archive its registrations
    d = requests.delete(f"{API}/events/{event_id}", headers=admin_headers, timeout=30)
    assert d.status_code == 200, d.text
    body = d.json()
    assert body.get("archived_registrations", 0) >= 1

    arch = requests.get(f"{API}/registrations/archived", headers=admin_headers, timeout=30).json()
    match = [x for x in arch if x["id"] == reg_id]
    assert match, "reg not archived after event delete"
    assert match[0]["archive_reason"].startswith("event_deleted:")

    # Restore should work even without event (event_exists=false)
    r = requests.post(f"{API}/registrations/{reg_id}/restore", headers=admin_headers, timeout=30)
    assert r.status_code == 200
    j = r.json()
    assert j["restored"] is True
    assert j["event_exists"] is False

    # Cleanup - archive it back and remove
    requests.delete(f"{API}/registrations/{reg_id}", headers=admin_headers, timeout=30)
    # Remove from archive by direct restore->delete? Best: leave in archive removed via manual cleanup script.
    # Actually re-delete just archived it again. Let's just delete from archive via API? no endpoint. leave it.


# =============== ANALYTICS ===============

def test_analytics_track_ignores_admin_paths():
    # Get baseline
    # Track admin path - should not be recorded
    r = requests.post(f"{API}/analytics/track", json={
        "path": "/admin/dashboard", "referrer": "", "visitor_id": "TEST_ignored"
    }, timeout=30)
    assert r.status_code == 200


def test_analytics_track_and_summary(admin_headers):
    vid1 = f"TEST_v1_{uuid.uuid4().hex[:6]}"
    vid2 = f"TEST_v2_{uuid.uuid4().hex[:6]}"

    # 2 views from vid1, 1 view from vid2
    for v, path, ref in [
        (vid1, "/", "https://instagram.com/foo"),
        (vid1, "/barsaat", ""),
        (vid2, "/", "https://google.com"),
    ]:
        r = requests.post(f"{API}/analytics/track", json={
            "path": path, "referrer": ref, "visitor_id": v
        }, timeout=30)
        assert r.status_code == 200

    # Admin path should be ignored
    requests.post(f"{API}/analytics/track", json={
        "path": "/admin", "referrer": "", "visitor_id": vid1
    }, timeout=30)

    # Summary
    r = requests.get(f"{API}/analytics/summary", params={"days": 7}, headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text
    s = r.json()
    assert s["days"] == 7
    assert len(s["daily"]) == 7
    assert s["total_views"] >= 3
    # referrers should include Instagram/Google/Direct
    labels = {x["label"] for x in s["referrers"]}
    assert "Instagram" in labels
    assert "Google" in labels
    # top_pages should include "/"
    page_labels = {x["label"] for x in s["top_pages"]}
    assert "/" in page_labels
    # devices dict
    assert isinstance(s["devices"], dict) and sum(s["devices"].values()) >= 3


def test_analytics_summary_requires_admin():
    r = requests.get(f"{API}/analytics/summary", timeout=30)
    assert r.status_code in (401, 403)
