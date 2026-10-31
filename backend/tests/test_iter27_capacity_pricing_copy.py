"""Iteration 27 tests: event capacity=8, off-site cap enforcement, pricing, and site copy."""
import os
import json
import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _make_event_payload(title, price=2500):
    return {
        "title": title,
        "date": "2099-12-31",
        "time": "20:00",
        "venue": "Test Venue",
        "description": "Temp event for testing",
        "price": price,
        "seats_total": 8,
        "tag": "Supper Club",
    }


# ---------- capacity & settings ----------
class TestCapacity:
    def test_events_all_have_capacity_8(self):
        r = requests.get(f"{API}/events")
        assert r.status_code == 200
        events = r.json()
        assert len(events) >= 1
        bad = [(e.get("title"), e.get("seats_total")) for e in events if e.get("seats_total") != 8]
        assert not bad, f"Events with wrong seats_total: {bad}"

    def test_settings_pricing(self):
        r = requests.get(f"{API}/settings")
        assert r.status_code == 200
        s = r.json()
        assert int(s.get("price_veg")) == 2500
        assert int(s.get("price_nonveg")) == 2800


# ---------- off-site cap ----------
class TestOffsiteCap:
    @pytest.fixture(scope="class")
    def temp_event(self, admin_headers):
        r = requests.post(f"{API}/events", json=_make_event_payload("TEST_ITER27 Offsite Event"),
                          headers=admin_headers)
        assert r.status_code in (200, 201), f"Create event failed: {r.status_code} {r.text}"
        ev = r.json()
        assert ev["seats_total"] == 8
        assert ev.get("seats_booked", 0) == 0
        yield ev
        requests.delete(f"{API}/events/{ev['id']}", headers=admin_headers)

    def test_offsite_flow(self, admin_headers, temp_event):
        eid = temp_event["id"]

        # Book 3 seats
        r = requests.post(f"{API}/admin/offsite-bookings",
                          json={"event_id": eid, "full_name": "TEST_ITER27 Guest A",
                                "guests": 3, "source": "Zomato"},
                          headers=admin_headers)
        assert r.status_code == 200, r.text
        booking_a = r.json()
        assert booking_a["guests"] == 3

        # Check event seats_booked increased
        events = requests.get(f"{API}/events").json()
        ev = next(e for e in events if e["id"] == eid)
        assert ev["seats_booked"] == 3

        # Try to over-book (need 6 more, only 5 left) -> 400
        r2 = requests.post(f"{API}/admin/offsite-bookings",
                           json={"event_id": eid, "full_name": "TEST_ITER27 Overbook",
                                 "guests": 6, "source": "Zomato"},
                           headers=admin_headers)
        assert r2.status_code == 400
        assert "seat" in r2.text.lower()

        # Book remaining 5 -> ok, fills to 8
        r3 = requests.post(f"{API}/admin/offsite-bookings",
                           json={"event_id": eid, "full_name": "TEST_ITER27 Guest B",
                                 "guests": 5, "source": "Swiggy"},
                           headers=admin_headers)
        assert r3.status_code == 200, r3.text
        booking_b = r3.json()

        # 1 more must fail (cap reached)
        r4 = requests.post(f"{API}/admin/offsite-bookings",
                           json={"event_id": eid, "full_name": "X", "guests": 1, "source": "s"},
                           headers=admin_headers)
        assert r4.status_code == 400

        # Delete booking B releases 5 seats
        rd = requests.delete(f"{API}/admin/offsite-bookings/{booking_b['id']}", headers=admin_headers)
        assert rd.status_code == 200
        events = requests.get(f"{API}/events").json()
        ev = next(e for e in events if e["id"] == eid)
        assert ev["seats_booked"] == 3, f"After delete seats_booked={ev['seats_booked']}"

        # Cleanup A
        requests.delete(f"{API}/admin/offsite-bookings/{booking_a['id']}", headers=admin_headers)
        events = requests.get(f"{API}/events").json()
        ev = next(e for e in events if e["id"] == eid)
        assert ev["seats_booked"] == 0


# ---------- pricing on register ----------
class TestPricingOnRegister:
    def test_register_veg_computes_2500(self, admin_headers):
        r = requests.post(f"{API}/events",
                          json=_make_event_payload("TEST_ITER27 Veg Pricing"),
                          headers=admin_headers)
        assert r.status_code in (200, 201)
        ev = r.json()
        try:
            reg = {"event_id": ev["id"], "full_name": "TEST_ITER27 VegGuest",
                   "email": "test_iter27_veg@example.com", "phone": "9999999999",
                   "guests": 2, "menu_preference": "Vegetarian"}
            rr = requests.post(f"{API}/events/{ev['id']}/register", json=reg)
            assert rr.status_code == 200, rr.text
            data = rr.json()
            assert data.get("total_amount") == 2500 * 2, f"total_amount={data.get('total_amount')}"
            rid = data.get("id")
            if rid:
                requests.delete(f"{API}/registrations/{rid}", headers=admin_headers)
        finally:
            requests.delete(f"{API}/events/{ev['id']}", headers=admin_headers)

    def test_register_nonveg_computes_2800(self, admin_headers):
        r = requests.post(f"{API}/events",
                          json=_make_event_payload("TEST_ITER27 NV Pricing"),
                          headers=admin_headers)
        assert r.status_code in (200, 201)
        ev = r.json()
        try:
            reg = {"event_id": ev["id"], "full_name": "TEST_ITER27 NVGuest",
                   "email": "test_iter27_nv@example.com", "phone": "9999999999",
                   "guests": 3, "menu_preference": "Non-Vegetarian"}
            rr = requests.post(f"{API}/events/{ev['id']}/register", json=reg)
            assert rr.status_code == 200, rr.text
            data = rr.json()
            assert data.get("total_amount") == 2800 * 3, f"total_amount={data.get('total_amount')}"
            rid = data.get("id")
            if rid:
                requests.delete(f"{API}/registrations/{rid}", headers=admin_headers)
        finally:
            requests.delete(f"{API}/events/{ev['id']}", headers=admin_headers)


# ---------- site copy ----------
class TestSiteCopy:
    @pytest.fixture(scope="class")
    def content(self):
        r = requests.get(f"{API}/site-content")
        assert r.status_code == 200
        return json.dumps(r.json())

    REQUIRED = [
        "the eight people in it.",
        "Eight seats, one long table.",
        "a newfound curiosity about my own cuisine",
        "a not-so-traditional Srikhand",
    ]
    FORBIDDEN = [
        "ten people",
        "Twelve seats",
        "a a not so",
        "Going to back",
        "through  actions",  # double space
        "European Menus.",
    ]

    def test_required_strings_present(self, content):
        missing = [s for s in self.REQUIRED if s not in content]
        assert not missing, f"Missing required strings: {missing}"

    def test_forbidden_strings_absent(self, content):
        found = [s for s in self.FORBIDDEN if s in content]
        assert not found, f"Forbidden strings still present: {found}"


# ---------- regression: archive/restore + analytics ----------
class TestRegressionArchiveAnalytics:
    def test_archive_and_restore_registration(self, admin_headers):
        # Create a temp event + registration to archive
        rev = requests.post(f"{API}/events",
                            json=_make_event_payload("TEST_ITER27 Archive Event"),
                            headers=admin_headers)
        assert rev.status_code in (200, 201)
        ev = rev.json()
        try:
            reg_payload = {"event_id": ev["id"], "full_name": "TEST_ITER27 ArchiveGuest",
                           "email": "test_iter27_archive@example.com", "phone": "9999999999",
                           "guests": 1, "menu_preference": "Vegetarian"}
            rr = requests.post(f"{API}/events/{ev['id']}/register", json=reg_payload)
            assert rr.status_code == 200, rr.text
            rid = rr.json()["id"]

            # Archive via DELETE (server archives before delete)
            rd = requests.delete(f"{API}/registrations/{rid}", headers=admin_headers)
            assert rd.status_code == 200, rd.text

            # Confirm it appears in archived list
            ra = requests.get(f"{API}/registrations/archived", headers=admin_headers)
            assert ra.status_code == 200
            archived = ra.json()
            assert any(x.get("id") == rid for x in archived), "Archived reg not present"

            # Restore
            rs = requests.post(f"{API}/registrations/{rid}/restore", headers=admin_headers)
            assert rs.status_code == 200, rs.text

            # Cleanup
            requests.delete(f"{API}/registrations/{rid}", headers=admin_headers)
        finally:
            requests.delete(f"{API}/events/{ev['id']}", headers=admin_headers)

    def test_analytics_summary(self, admin_headers):
        r = requests.get(f"{API}/analytics/summary", headers=admin_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict)
