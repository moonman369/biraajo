"""Iteration 28: PUT /api/admin/settings pricing persistence + POST /api/admin/media upload."""
import io
import os
import struct
import zlib
import pytest
import requests
from pathlib import Path

def _load_env():
    envp = Path("/app/frontend/.env")
    if envp.exists():
        for line in envp.read_text().splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
_load_env()

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not set"
ADMIN_EMAIL = "reachbiraajo@gmail.com"
ADMIN_PASSWORD = "Biraajo@2026"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _make_png(w=4, h=4):
    """Minimal PNG bytes."""
    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data +
                struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = b"".join(b"\x00" + b"\xff\x00\x00" * w for _ in range(h))
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def _make_fake_mp4():
    # Minimal ftyp box that starts with a video-ish header. content-type is what actually matters
    # for the API check since it inspects the multipart content-type.
    ftyp = b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2mp41" + b"\x00" * 32
    return ftyp


class TestPricing:
    def test_get_settings_initial(self):
        r = requests.get(f"{BASE_URL}/api/settings", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "price_veg" in d and "price_nonveg" in d
        assert isinstance(d["price_veg"], int)

    def test_put_pricing_persists(self, auth_headers):
        # set custom
        r = requests.put(f"{BASE_URL}/api/admin/settings",
                         json={"price_veg": 2777, "price_nonveg": 3111},
                         headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        # public reflects
        r2 = requests.get(f"{BASE_URL}/api/settings", timeout=15)
        d = r2.json()
        assert d["price_veg"] == 2777
        assert d["price_nonveg"] == 3111
        # restore
        r3 = requests.put(f"{BASE_URL}/api/admin/settings",
                          json={"price_veg": 2500, "price_nonveg": 2800},
                          headers=auth_headers, timeout=15)
        assert r3.status_code == 200
        d3 = requests.get(f"{BASE_URL}/api/settings", timeout=15).json()
        assert d3["price_veg"] == 2500
        assert d3["price_nonveg"] == 2800

    def test_put_settings_requires_auth(self):
        r = requests.put(f"{BASE_URL}/api/admin/settings",
                         json={"price_veg": 9999}, timeout=15)
        assert r.status_code in (401, 403)


class TestMediaUpload:
    uploaded_urls = []

    def test_upload_image(self, auth_headers):
        png = _make_png()
        files = {"file": ("test.png", png, "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/media",
                          files=files, headers=auth_headers, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["kind"] == "image"
        assert d["url"].startswith("/api/media/")
        TestMediaUpload.uploaded_urls.append(d["url"])
        # serve check
        r2 = requests.get(f"{BASE_URL}{d['url']}", timeout=30)
        assert r2.status_code in (200, 206), f"served status {r2.status_code}"

    def test_upload_video(self, auth_headers):
        mp4 = _make_fake_mp4()
        files = {"file": ("test.mp4", mp4, "video/mp4")}
        r = requests.post(f"{BASE_URL}/api/admin/media",
                          files=files, headers=auth_headers, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["kind"] == "video"
        assert d["url"].startswith("/api/media/")
        TestMediaUpload.uploaded_urls.append(d["url"])
        r2 = requests.get(f"{BASE_URL}{d['url']}", timeout=30)
        assert r2.status_code in (200, 206)

    def test_reject_non_media(self, auth_headers):
        files = {"file": ("test.txt", b"hello world", "text/plain")}
        r = requests.post(f"{BASE_URL}/api/admin/media",
                          files=files, headers=auth_headers, timeout=30)
        assert r.status_code == 400

    def test_reject_large_file(self, auth_headers):
        # 51MB of zeros with image content type
        big = b"\x00" * (51 * 1024 * 1024)
        files = {"file": ("big.jpg", big, "image/jpeg")}
        r = requests.post(f"{BASE_URL}/api/admin/media",
                          files=files, headers=auth_headers, timeout=120)
        assert r.status_code == 400

    def test_upload_requires_auth(self):
        files = {"file": ("test.png", _make_png(), "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/media", files=files, timeout=30)
        assert r.status_code in (401, 403)


class TestGalleryFlow:
    def test_add_and_delete_gallery_item(self, auth_headers):
        # Upload
        files = {"file": ("gal.png", _make_png(), "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/media",
                          files=files, headers=auth_headers, timeout=60)
        assert r.status_code == 200
        url = r.json()["url"]
        # Add to gallery
        payload = {"url": url, "caption": "TEST_ITER28", "order": 999}
        r2 = requests.post(f"{BASE_URL}/api/gallery", json=payload,
                           headers=auth_headers, timeout=15)
        assert r2.status_code == 200, r2.text
        gid = r2.json()["id"]
        # List has it
        r3 = requests.get(f"{BASE_URL}/api/gallery", timeout=15)
        assert any(x["id"] == gid for x in r3.json())
        # Delete
        r4 = requests.delete(f"{BASE_URL}/api/gallery/{gid}",
                             headers=auth_headers, timeout=15)
        assert r4.status_code == 200
        r5 = requests.get(f"{BASE_URL}/api/gallery", timeout=15)
        assert not any(x["id"] == gid for x in r5.json())


class TestRegressions:
    def test_registrations_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/registrations",
                         headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_archived_endpoint(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/registrations/archived",
                         headers=auth_headers, timeout=15)
        assert r.status_code == 200

    def test_analytics_summary(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/analytics/summary",
                         headers=auth_headers, timeout=15)
        assert r.status_code == 200

    def test_reservations_toggle(self, auth_headers):
        cur = requests.get(f"{BASE_URL}/api/settings", timeout=15).json()
        orig = bool(cur.get("registrations_open", True))
        r = requests.put(f"{BASE_URL}/api/admin/settings",
                         json={"registrations_open": not orig},
                         headers=auth_headers, timeout=15)
        assert r.status_code == 200
        d = requests.get(f"{BASE_URL}/api/settings", timeout=15).json()
        assert bool(d["registrations_open"]) == (not orig)
        # restore
        requests.put(f"{BASE_URL}/api/admin/settings",
                     json={"registrations_open": orig},
                     headers=auth_headers, timeout=15)
