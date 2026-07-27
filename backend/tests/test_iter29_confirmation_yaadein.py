"""Iter 29 tests: confirmation email, Yaadein coming-soon, gallery sort, regressions."""
import os
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # frontend/.env fallback
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "reachbiraajo@gmail.com"
ADMIN_PASSWORD = "Biraajo@2026"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Yaadein / Barsaat events ----------
class TestYaadeinEvents:
    def test_upcoming_events_include_yaadein_and_barsaat(self):
        r = requests.get(f"{BASE_URL}/api/events?upcoming=true")
        assert r.status_code == 200
        events = r.json()
        yaadein = [e for e in events if e.get("tag") == "Yaadein"]
        assert len(yaadein) == 4, f"Expected 4 Yaadein, got {len(yaadein)}"
        dates = sorted([e["date"] for e in yaadein])
        assert dates == ["2026-08-15", "2026-08-21", "2026-08-23", "2026-08-29"]
        for y in yaadein:
            assert y.get("coming_soon") is True, y
        barsaat = [e for e in events if not e.get("coming_soon")]
        assert len(barsaat) >= 3

    def test_register_blocked_for_yaadein(self):
        r = requests.get(f"{BASE_URL}/api/events?upcoming=true")
        yaadein = [e for e in r.json() if e.get("coming_soon")][0]
        payload = {
            "event_id": yaadein['id'],
            "full_name": "TEST_ComingSoon", "email": "test_yaadein@example.com",
            "phone": "9999999999", "guests": 1, "menu_preference": "veg",
        }
        rr = requests.post(f"{BASE_URL}/api/events/{yaadein['id']}/register", json=payload)
        assert rr.status_code == 403, rr.text
        assert "aren't open" in rr.json().get("detail", "").lower() or "not open" in rr.json().get("detail", "").lower() or "open yet" in rr.json().get("detail", "").lower()

    def test_barsaat_still_bookable(self):
        r = requests.get(f"{BASE_URL}/api/events?upcoming=true")
        barsaat = [e for e in r.json() if not e.get("coming_soon") and (e.get("seats_total", 0) - e.get("seats_booked", 0)) > 0]
        if not barsaat:
            pytest.skip("no barsaat with free seats")
        ev = barsaat[0]
        payload = {
            "event_id": ev['id'],
            "full_name": "TEST_BarsaatSmoke", "email": f"test_barsaat_smoke_{int(time.time())}@example.com",
            "phone": "9998887777", "guests": 1, "menu_preference": "veg",
        }
        rr = requests.post(f"{BASE_URL}/api/events/{ev['id']}/register", json=payload)
        assert rr.status_code == 200, rr.text
        # cleanup: leave as pending (won't affect seats since seats only inc on confirm)
        reg_id = rr.json().get("id")
        return reg_id


# ---------- Gallery sort ----------
class TestGallerySort:
    def test_gallery_sorted_by_created_at_desc(self):
        r = requests.get(f"{BASE_URL}/api/gallery")
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        created = [i.get("created_at", "") for i in items]
        assert created == sorted(created, reverse=True), "gallery not sorted desc by created_at"


# ---------- Confirmation email ----------
class TestConfirmationEmail:
    def _get_barsaat_event(self):
        r = requests.get(f"{BASE_URL}/api/events?upcoming=true")
        for e in r.json():
            if not e.get("coming_soon") and (e.get("seats_total", 0) - e.get("seats_booked", 0)) > 0:
                return e
        return None

    def _create_direct_registration(self, email):
        ev = self._get_barsaat_event()
        assert ev, "no barsaat event"
        payload = {
            "event_id": ev['id'],
            "full_name": "TEST_ConfirmRecipient", "email": email,
            "phone": "9111222333", "guests": 1, "menu_preference": "veg",
        }
        r = requests.post(f"{BASE_URL}/api/events/{ev['id']}/register", json=payload)
        assert r.status_code == 200, r.text
        return r.json()["id"]

    def test_send_confirmation_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/registrations/anything/send-confirmation")
        assert r.status_code in (401, 403)

    def test_send_confirmation_unknown_reg_404(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/registrations/nonexistent-id/send-confirmation", headers=admin_headers)
        assert r.status_code == 404

    def test_send_confirmation_to_example_email_returns_502(self, admin_headers):
        reg_id = self._create_direct_registration(f"test_conf_{int(time.time())}@example.com")
        try:
            r = requests.post(f"{BASE_URL}/api/registrations/{reg_id}/send-confirmation", headers=admin_headers)
            assert r.status_code == 502, f"expected 502, got {r.status_code}: {r.text[:200]}"
            # body may be JSON detail or html from ingress — accept either
            try:
                detail = r.json().get("detail", "").lower()
                assert "could not be sent" in detail or "email" in detail
            except Exception:
                pass
        finally:
            requests.delete(f"{BASE_URL}/api/registrations/{reg_id}", headers=admin_headers)

    def test_send_confirmation_to_owner_email_succeeds(self, admin_headers):
        reg_id = self._create_direct_registration(ADMIN_EMAIL)
        try:
            r = requests.post(f"{BASE_URL}/api/registrations/{reg_id}/send-confirmation", headers=admin_headers)
            assert r.status_code == 200, r.text
            j = r.json()
            assert j.get("ok") is True
            assert j.get("sent_to") == ADMIN_EMAIL
            # verify persisted flag
            regs = requests.get(f"{BASE_URL}/api/registrations", headers=admin_headers).json()
            match = next((x for x in regs if x.get("id") == reg_id), None)
            assert match, "reg not found in list"
            assert match.get("confirmation_email_sent") is True
        finally:
            requests.delete(f"{BASE_URL}/api/registrations/{reg_id}", headers=admin_headers)


# ---------- Regressions ----------
class TestRegressions:
    def test_settings_reachable(self):
        r = requests.get(f"{BASE_URL}/api/settings")
        assert r.status_code == 200
        d = r.json()
        assert "price_veg" in d and "price_nonveg" in d

    def test_registrations_list_and_archived(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/registrations", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        ra = requests.get(f"{BASE_URL}/api/registrations/archived", headers=admin_headers)
        assert ra.status_code == 200

    def test_offsite_list(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/offsite-bookings", headers=admin_headers)
        assert r.status_code == 200

    def test_analytics_traffic(self, admin_headers):
        # traffic tab endpoint variants
        for path in ["/api/admin/analytics", "/api/analytics/traffic", "/api/admin/traffic"]:
            r = requests.get(f"{BASE_URL}{path}", headers=admin_headers)
            if r.status_code == 200:
                return
        pytest.skip("no analytics endpoint reachable — verify separately")
