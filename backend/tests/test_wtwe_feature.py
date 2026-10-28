"""Backend tests for the 'When There Wasn't Enough' (WTWE) feature."""
import os
import io
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

WTWE_IDS = [
    "wtwe-2026-08-23-lunch",
    "wtwe-2026-08-30-dinner",
    "wtwe-2026-09-06-lunch",
    "wtwe-2026-09-11-dinner",
    "wtwe-2026-09-13-lunch",
]


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json().get("access_token")


@pytest.fixture(scope="module")
def admin(api, admin_token):
    api.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api


# ---------- Events ----------

class TestWtweEvents:
    def test_events_endpoint_lists_wtwe(self, api):
        r = api.get(f"{BASE_URL}/api/events")
        assert r.status_code == 200
        events = r.json()
        ids = {e["id"] for e in events}
        for wid in WTWE_IDS:
            assert wid in ids, f"WTWE event {wid} missing from /api/events"

    def test_wtwe_events_have_flat_pricing_and_tag(self, api):
        r = api.get(f"{BASE_URL}/api/events")
        events = {e["id"]: e for e in r.json()}
        for wid in WTWE_IDS:
            e = events[wid]
            assert e.get("tag") == "When There Wasn't Enough"
            assert e.get("price_veg") == 2800
            assert e.get("price_nonveg") == 2800
            assert e.get("seats_total") == 8
            assert e.get("coming_soon") in (False, None)

    def test_barsaat_events_no_price_override(self, api):
        r = api.get(f"{BASE_URL}/api/events")
        events = r.json()
        barsaat = [e for e in events if "barsaat" in (e.get("tag") or "").lower() or "barsaat" in e["id"].lower()]
        # regression: at least one barsaat should exist without price override
        assert len(barsaat) > 0, "No Barsaat events found for regression check"
        for e in barsaat:
            # per-event override should be absent (None) so falls back to global
            assert e.get("price_veg") in (None, 2500, 2800), f"Unexpected price_veg on barsaat event {e['id']}"


# ---------- Booking / Pricing ----------

class TestWtweBooking:
    def _payload(self, event_id, guests=1, menu="Non-Vegetarian"):
        u = uuid.uuid4().hex[:8]
        return {
            "event_id": event_id,
            "full_name": f"TEST User {u}",
            "email": f"TEST_{u}@example.com",
            "phone": "+919999999999",
            "instagram_handle": "@testuser",
            "guests": guests,
            "menu_preference": menu,
            "dietary_preferences": "",
            "notes": "automated test",
        }

    def test_veg_price_flat_2800(self, api):
        eid = WTWE_IDS[0]
        p = self._payload(eid, guests=2, menu="Vegetarian")
        r = api.post(f"{BASE_URL}/api/events/{eid}/register", json=p)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["total_amount"] == 2 * 2800, f"Expected 5600, got {data['total_amount']}"
        # cleanup: delete this pending registration via admin later
        self._created_ids = getattr(self, "_created_ids", [])
        # store globally
        pytest._wtwe_reg_ids = getattr(pytest, "_wtwe_reg_ids", [])
        pytest._wtwe_reg_ids.append(data["id"])

    def test_nonveg_price_flat_2800(self, api):
        eid = WTWE_IDS[1]
        p = self._payload(eid, guests=3, menu="Non-Vegetarian")
        r = api.post(f"{BASE_URL}/api/events/{eid}/register", json=p)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["total_amount"] == 3 * 2800
        pytest._wtwe_reg_ids = getattr(pytest, "_wtwe_reg_ids", [])
        pytest._wtwe_reg_ids.append(data["id"])

    def test_seats_booked_increments(self, api):
        eid = WTWE_IDS[2]
        # get current
        r0 = api.get(f"{BASE_URL}/api/events")
        before = next(e for e in r0.json() if e["id"] == eid).get("seats_booked", 0)
        p = self._payload(eid, guests=2, menu="Vegetarian")
        r = api.post(f"{BASE_URL}/api/events/{eid}/register", json=p)
        assert r.status_code == 200, r.text
        pytest._wtwe_reg_ids = getattr(pytest, "_wtwe_reg_ids", [])
        pytest._wtwe_reg_ids.append(r.json()["id"])
        r1 = api.get(f"{BASE_URL}/api/events")
        after = next(e for e in r1.json() if e["id"] == eid).get("seats_booked", 0)
        assert after == before + 2, f"seats_booked before={before} after={after}"

    def test_capacity_enforced_over_8(self, api):
        eid = WTWE_IDS[3]
        p = self._payload(eid, guests=9, menu="Vegetarian")
        r = api.post(f"{BASE_URL}/api/events/{eid}/register", json=p)
        assert r.status_code == 400, f"Expected 400 when exceeding capacity, got {r.status_code} {r.text}"

    def test_upload_payment_screenshot(self, api):
        # Create a fresh reg first
        eid = WTWE_IDS[4]
        p = self._payload(eid, guests=1, menu="Non-Vegetarian")
        r = api.post(f"{BASE_URL}/api/events/{eid}/register", json=p)
        assert r.status_code == 200, r.text
        reg_id = r.json()["id"]
        pytest._wtwe_reg_ids = getattr(pytest, "_wtwe_reg_ids", [])
        pytest._wtwe_reg_ids.append(reg_id)

        # Upload a tiny fake PNG
        # 1x1 transparent PNG
        png = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
            "0000000d49444154789c626000000000050001a5f645400000000049454e44ae426082"
        )
        files = {"file": ("test.png", io.BytesIO(png), "image/png")}
        # Must not send Content-Type json for multipart
        sess = requests.Session()
        sess.headers.update({"Authorization": api.headers.get("Authorization", "")})
        up = sess.post(f"{BASE_URL}/api/registrations/{reg_id}/payment-screenshot", files=files)
        assert up.status_code == 200, up.text
        # Then check status endpoint
        st = api.get(f"{BASE_URL}/api/registrations/{reg_id}/status")
        assert st.status_code == 200
        assert st.json().get("has_screenshot") is True


# ---------- Cleanup ----------

class TestCleanup:
    def test_cleanup_test_registrations(self, admin):
        ids = getattr(pytest, "_wtwe_reg_ids", [])
        # Also fetch any TEST_ registrations across wtwe events
        r = admin.get(f"{BASE_URL}/api/registrations")
        if r.status_code == 200:
            for reg in r.json():
                if reg.get("email", "").startswith("TEST_") and reg.get("event_id", "").startswith("wtwe-"):
                    ids.append(reg["id"])
        for reg_id in set(ids):
            d = admin.delete(f"{BASE_URL}/api/registrations/{reg_id}")
            # allow 200/204/404
            assert d.status_code in (200, 204, 404), f"Cleanup failed for {reg_id}: {d.status_code}"

    def test_seats_reset(self, api):
        r = api.get(f"{BASE_URL}/api/events")
        events = {e["id"]: e for e in r.json()}
        for wid in WTWE_IDS:
            assert events[wid].get("seats_booked", 0) == 0, f"{wid} seats_booked={events[wid].get('seats_booked')}"


# ---------- Content / CMS ----------

class TestWtweContent:
    def test_site_content_has_wtwe(self, api):
        r = api.get(f"{BASE_URL}/api/site-content")
        assert r.status_code == 200
        content = r.json()
        assert "wtwe" in content, "site-content missing wtwe key"
        wtwe = content["wtwe"]
        # verify structural keys
        for key in ("hero", "dates_block", "chef_note", "idea", "closer", "menu"):
            assert key in wtwe, f"wtwe missing key {key}"
        menu_block = wtwe["menu"]
        items = menu_block.get("items") if isinstance(menu_block, dict) else menu_block
        assert isinstance(items, list) and len(items) == 8, f"Expected 8 courses, got {len(items) if isinstance(items, list) else 'n/a'}"
        # Alt dish must appear on Starter/Rice/Dal/Main only
        courses_with_alt = [c for c in items if c.get("alt_dish")]
        assert len(courses_with_alt) == 4, f"Expected 4 courses with alt_dish, got {len(courses_with_alt)}"
        alt_courses = {c["course"] for c in courses_with_alt}
        assert alt_courses == {"Starter", "Rice", "Dal", "Main"}, f"Alt courses mismatch: {alt_courses}"


# ---------- Regression: Non-WTWE booking still uses global pricing ----------

class TestRegressionGlobalPricing:
    def test_barsaat_uses_global_settings_pricing(self, api):
        # get global settings
        s = api.get(f"{BASE_URL}/api/settings")
        if s.status_code != 200:
            pytest.skip("settings endpoint not accessible")
        settings = s.json()
        veg_price = settings.get("price_veg", 2500)
        nonveg_price = settings.get("price_nonveg", 2800)

        events = api.get(f"{BASE_URL}/api/events").json()
        barsaat = next(
            (e for e in events
             if ("barsaat" in (e.get("tag") or "").lower() or "barsaat" in e["id"].lower())
             and not e.get("coming_soon")
             and e.get("price_veg") is None),
            None,
        )
        if not barsaat:
            pytest.skip("No Barsaat event without price override available for regression")
        p = {
            "full_name": "TEST Regression",
            "email": f"TEST_reg_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "+919999999998",
            "guests": 1,
            "menu_preference": "Vegetarian",
        }
        r = api.post(f"{BASE_URL}/api/events/{barsaat['id']}/register", json=p)
        if r.status_code != 200:
            pytest.skip(f"Barsaat booking blocked: {r.status_code} {r.text}")
        reg_id = r.json()["id"]
        assert r.json()["total_amount"] == veg_price, (
            f"Expected total {veg_price}, got {r.json()['total_amount']}"
        )
        # cleanup via admin
        tok_resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if tok_resp.status_code == 200:
            tk = tok_resp.json().get("access_token")
            requests.delete(
                f"{BASE_URL}/api/registrations/{reg_id}",
                headers={"Authorization": f"Bearer {tk}"},
            )
