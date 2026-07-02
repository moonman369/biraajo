"""Backend tests for iteration 14 — Barsaat reorg, 5 new videos, gallery, hero image."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://event-booking-test-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

NEW_KEYS = ["i2tx6jvh", "a7qweymb", "ana7ash1", "xe0xmfhh", "u3sgtdb0"]


@pytest.fixture(scope="module")
def site_content():
    r = requests.get(f"{API}/site-content", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def gallery():
    r = requests.get(f"{API}/gallery", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


# ── Barsaat hero image
def test_barsaat_hero_image_is_ctn50bz1(site_content):
    hero = site_content.get("barsaat", {}).get("hero", {}).get("image", "")
    assert hero.endswith("ctn50bz1__DSC4913-2%20%281%29%20%281%29.jpg"), f"got: {hero}"
    assert "kpwk8ol3" not in hero


# ── Reels: 7 items, 5 new keys present
def test_barsaat_reels_count_is_7(site_content):
    items = site_content.get("barsaat", {}).get("reels", {}).get("items", [])
    assert len(items) == 7, f"expected 7, got {len(items)}"


def test_barsaat_reels_include_5_new_videos(site_content):
    items = site_content.get("barsaat", {}).get("reels", {}).get("items", [])
    urls = " ".join(i.get("url", "") for i in items)
    for k in NEW_KEYS:
        assert k in urls, f"missing key {k}"


# ── HEAD-200 + content-type video/mp4 for every reel URL
def test_all_reel_urls_head_200_mp4(site_content):
    items = site_content.get("barsaat", {}).get("reels", {}).get("items", [])
    problems = []
    for it in items:
        url = it.get("url", "")
        try:
            r = requests.head(url, allow_redirects=True, timeout=30)
            ct = r.headers.get("content-type", "")
            if r.status_code not in (200, 206) or "video/mp4" not in ct.lower():
                problems.append(f"{url} → {r.status_code} / {ct}")
        except Exception as e:
            problems.append(f"{url} → EXC {e}")
    assert not problems, "\n".join(problems)


# ── Gallery: all 5 new videos + total ≥ 12
def test_gallery_contains_5_new_videos(gallery):
    urls = " ".join((g.get("url") or g.get("src") or g.get("media_url") or "") for g in gallery)
    missing = [k for k in NEW_KEYS if k not in urls]
    assert not missing, f"missing keys in gallery: {missing}; sample={gallery[:2]}"


def test_gallery_total_at_least_12(gallery):
    assert len(gallery) >= 12, f"got {len(gallery)}"


# ── Regression: Barsaat events
def test_barsaat_events_three_upcoming():
    r = requests.get(f"{API}/events", params={"upcoming": "true"}, timeout=30)
    assert r.status_code == 200
    barsaats = [e for e in r.json() if re.search(r"barsaat|monsoon", f"{e.get('title','')} {e.get('tag','')}", re.I)]
    assert len(barsaats) >= 3, f"got {len(barsaats)}"
    for e in barsaats[:3]:
        assert e.get("seats_total", 0) > 0


# ── Settings prices
def test_settings_prices_2200_2800():
    r = requests.get(f"{API}/settings", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert int(d.get("price_veg", 0)) == 2200
    assert int(d.get("price_nonveg", 0)) == 2800


# ── Menu regression: 10 courses + 4 veg variants
def test_barsaat_menu_10_courses_4_veg_variants(site_content):
    menu = site_content.get("barsaat", {}).get("menu", {})
    courses = menu.get("items", [])
    assert len(courses) == 10, f"expected 10 courses, got {len(courses)}"
    veg_variants = sum(1 for c in courses if c.get("alt_dish"))
    assert veg_variants == 4, f"expected 4 veg variants (alt_dish), got {veg_variants}"


# ── Admin login regression
def test_admin_login_works():
    r = requests.post(
        f"{API}/auth/login",
        json={"email": "reachbiraajo@gmail.com", "password": "Biraajo@2026"},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    tok = r.json().get("access_token")
    assert tok
    me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
    assert me.status_code == 200
