"""Iteration 15 tests — Experiences removed, nav hash routing, Barsaat CMS, payment flow, images."""
import os, re, io, base64, requests, pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN = {"email": "reachbiraajo@gmail.com", "password": "Biraajo@2026"}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def site_content():
    r = requests.get(f"{API}/site-content", timeout=30)
    assert r.status_code == 200
    return r.json()


# ── Settings sanity for payment flow
def test_settings_prices_and_open():
    r = requests.get(f"{API}/settings", timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert int(d["price_veg"]) == 2200
    assert int(d["price_nonveg"]) == 2800
    assert d.get("registrations_open") is True


# ── Barsaat CMS schema keys — reels + closer must be present; chef_note/sensory/rajneesh/dates_block
# are read with defaults in Barsaat.jsx so missing in DB is acceptable (frontend defaults apply).
def test_barsaat_cms_core_sections_exist(site_content):
    b = site_content.get("barsaat", {})
    for k in ["hero", "reels", "closer", "menu"]:
        assert k in b, f"missing barsaat.{k}; keys={list(b.keys())}"


# ── UPI QR image (hardcoded in frontend modal) reachable
def test_upi_qr_image_url_reachable():
    url = "https://customer-assets.emergentagent.com/job_8232982a-2ce1-4d83-a683-c7727cd57ba6/artifacts/g9bzx5zc_image.png"
    r = requests.get(url, timeout=30)
    assert r.status_code == 200, f"UPI QR fetch {r.status_code}"
    assert r.headers.get("content-type", "").startswith("image/"), r.headers.get("content-type")


# ── End-to-end booking (payment flow): create → get → screenshot upload → confirmed → delete
def test_booking_flow_end_to_end(admin_token):
    # Get an upcoming barsaat event
    ev = requests.get(f"{API}/events", params={"upcoming": "true"}, timeout=30).json()
    b = [e for e in ev if re.search(r"barsaat|monsoon", f"{e.get('title','')} {e.get('tag','')}", re.I)]
    assert b, "no upcoming barsaat events"
    event_id = b[0]["id"]

    payload = {
        "event_id": event_id,
        "full_name": "TEST_iter15 User",
        "email": "test_iter15@example.com",
        "phone": "9999900000",
        "instagram_handle": "",
        "menu_preference": "Vegetarian",
        "guests": 1,
        "dietary_preferences": "test",
        "notes": "auto test",
    }
    r = requests.post(f"{API}/events/{event_id}/register", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"register {r.status_code}: {r.text}"
    reg = r.json()
    booking_id = reg.get("id")
    assert booking_id, reg
    total = reg.get("total_amount")
    assert int(total) == 2200, f"total={total} (expected 2200 for 1 veg)"
    assert reg.get("payment_status") == "pending"
    assert reg.get("upi_id")

    # Get booking status (public)
    r = requests.get(f"{API}/registrations/{booking_id}/status", timeout=30)
    assert r.status_code == 200
    assert r.json()["payment_status"] == "pending"

    # Upload tiny screenshot (1x1 PNG)
    png = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
    )
    files = {"file": ("test.png", io.BytesIO(png), "image/png")}
    up = requests.post(f"{API}/registrations/{booking_id}/payment-screenshot", files=files, timeout=60)
    assert up.status_code in (200, 201), f"screenshot upload {up.status_code}: {up.text}"

    # Confirm status flipped to confirmed
    r = requests.get(f"{API}/registrations/{booking_id}/status", timeout=30)
    assert r.status_code == 200
    assert r.json()["payment_status"] == "confirmed", r.json()

    # Cleanup — delete via admin
    hdr = {"Authorization": f"Bearer {admin_token}"}
    d = requests.delete(f"{API}/registrations/{booking_id}", headers=hdr, timeout=30)
    assert d.status_code in (200, 204), f"delete {d.status_code}: {d.text}"


# ── Admin login sanity
def test_admin_login():
    r = requests.post(f"{API}/auth/login", json=ADMIN, timeout=30)
    assert r.status_code == 200
    assert r.json().get("access_token")
