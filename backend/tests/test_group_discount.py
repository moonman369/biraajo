"""Group discount feature (iteration_31): backend verification.

Covers:
- GET /api/settings exposes group_discount_pct + group_discount_min_guests
- Booking with guests<4 => full total_amount (no discount)
- Booking with guests>=4 => 20% off total_amount persisted
- PUT /api/admin/settings updates group_discount_pct; new booking uses new pct
- Cleans up test bookings and restores discount pct to 20
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://premium-chef-demo.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "reachbiraajo@gmail.com"
ADMIN_PASS = "Biraajo@2026"

created_reg_ids = []


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def bookable_event(api):
    """Pick any bookable event (not concluded, not coming_soon)."""
    r = api.get(f"{BASE_URL}/api/events")
    assert r.status_code == 200
    events = r.json()
    for ev in events:
        if not ev.get("coming_soon") and not ev.get("concluded") and ev.get("seats_booked", 0) < 8:
            return ev
    pytest.skip("No bookable event available")


def _reg_payload(email_suffix, event_id):
    return {
        "event_id": event_id,
        "full_name": "TEST DiscountUser",
        "email": f"TEST_disc_{email_suffix}@example.com",
        "phone": "9999999999",
        "instagram_handle": "",
        "menu_preference": "Non-vegetarian",
        "dietary_preferences": "",
        "notes": "",
    }


def test_public_settings_has_discount_fields(api):
    r = api.get(f"{BASE_URL}/api/settings")
    assert r.status_code == 200
    d = r.json()
    assert "group_discount_pct" in d
    assert "group_discount_min_guests" in d
    assert d["group_discount_min_guests"] == 4
    assert 0 <= int(d["group_discount_pct"]) <= 100
    # Default expected 20
    assert int(d["group_discount_pct"]) == 20


def test_booking_no_discount_below_threshold(api, bookable_event, admin_headers):
    ev = bookable_event
    nonveg = int(ev.get("price_nonveg") or 2800)
    guests = 2
    payload = {**_reg_payload(uuid.uuid4().hex[:6], ev["id"]), "guests": guests}
    r = api.post(f"{BASE_URL}/api/events/{ev['id']}/register", json=payload)
    assert r.status_code == 200, r.text
    reg = r.json()
    created_reg_ids.append(reg["id"])
    expected = nonveg * guests
    assert reg["total_amount"] == expected, f"expected {expected}, got {reg['total_amount']}"
    # cleanup immediately to free seats
    requests.delete(f"{BASE_URL}/api/registrations/{reg['id']}", headers=admin_headers)


def test_booking_with_discount_at_threshold(api, bookable_event, admin_headers):
    ev = bookable_event
    # Refresh event to check seat availability
    r_ev = requests.get(f"{BASE_URL}/api/events/{ev['id']}")
    ev = r_ev.json()
    available = 8 - int(ev.get("seats_booked", 0))
    if available < 4:
        pytest.skip(f"Only {available} seats available, need 4 for discount test")
    nonveg = int(ev.get("price_nonveg") or 2800)
    guests = 4
    payload = {**_reg_payload(uuid.uuid4().hex[:6], ev["id"]), "guests": guests}
    r = api.post(f"{BASE_URL}/api/events/{ev['id']}/register", json=payload)
    assert r.status_code == 200, r.text
    reg = r.json()
    created_reg_ids.append(reg["id"])
    expected = round(nonveg * guests * 0.80)
    assert reg["total_amount"] == expected, f"expected discounted {expected}, got {reg['total_amount']}"
    requests.delete(f"{BASE_URL}/api/registrations/{reg['id']}", headers=admin_headers)


def test_admin_can_update_group_discount(api, admin_headers, bookable_event):
    # Change to 25
    r = api.put(f"{BASE_URL}/api/admin/settings", json={"group_discount_pct": 25}, headers=admin_headers)
    assert r.status_code == 200, r.text
    assert int(r.json()["group_discount_pct"]) == 25
    # Verify public reflects
    r2 = api.get(f"{BASE_URL}/api/settings")
    assert int(r2.json()["group_discount_pct"]) == 25

    # Make a new booking with 4 guests => 25% off
    ev = bookable_event
    r_ev = requests.get(f"{BASE_URL}/api/events/{ev['id']}")
    ev = r_ev.json()
    available = 8 - int(ev.get("seats_booked", 0))
    if available < 4:
        # revert and skip
        api.put(f"{BASE_URL}/api/admin/settings", json={"group_discount_pct": 20}, headers=admin_headers)
        pytest.skip("Not enough seats for 25% discount test")

    nonveg = int(ev.get("price_nonveg") or 2800)
    guests = 4
    payload = {**_reg_payload(uuid.uuid4().hex[:6], ev["id"]), "guests": guests}
    rr = api.post(f"{BASE_URL}/api/events/{ev['id']}/register", json=payload)
    assert rr.status_code == 200, rr.text
    reg = rr.json()
    created_reg_ids.append(reg["id"])
    expected = round(nonveg * guests * 0.75)
    assert reg["total_amount"] == expected, f"expected {expected} (25% off), got {reg['total_amount']}"

    # Restore to 20
    rr2 = api.put(f"{BASE_URL}/api/admin/settings", json={"group_discount_pct": 20}, headers=admin_headers)
    assert rr2.status_code == 200
    assert int(rr2.json()["group_discount_pct"]) == 20


def test_admin_settings_validation(api, admin_headers):
    # Values >100 clamp to 100
    r = api.put(f"{BASE_URL}/api/admin/settings", json={"group_discount_pct": 150}, headers=admin_headers)
    assert r.status_code == 200
    assert int(r.json()["group_discount_pct"]) == 100
    # Restore
    api.put(f"{BASE_URL}/api/admin/settings", json={"group_discount_pct": 20}, headers=admin_headers)


def test_zzz_cleanup(api, admin_headers):
    """Delete all TEST registrations created above and revert seats."""
    for rid in created_reg_ids:
        try:
            api.delete(f"{BASE_URL}/api/registrations/{rid}", headers=admin_headers)
        except Exception:
            pass
    # Final restore
    api.put(f"{BASE_URL}/api/admin/settings", json={"group_discount_pct": 20}, headers=admin_headers)
    r = api.get(f"{BASE_URL}/api/settings")
    assert int(r.json()["group_discount_pct"]) == 20
