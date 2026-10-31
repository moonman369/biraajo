"""Tests for the /api/media endpoint - Range/206 support (iOS Safari fix)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8000").rstrip("/")

VIDEO_PATH = "/api/media/biraajo/media/61fb00fd9c77f388.mp4"
IMAGE_PATH = "/api/media/biraajo/media/7b3c136adf5f5431.jpg"


class TestMediaRange:
    """Range-request support required for iOS Safari <video> playback."""

    def test_video_range_returns_206_with_content_range(self):
        headers = {"Range": "bytes=0-1023"}
        r = requests.get(f"{BASE_URL}{VIDEO_PATH}", headers=headers, timeout=60)
        assert r.status_code == 206, f"Expected 206 got {r.status_code}"
        cr = r.headers.get("Content-Range", "")
        assert cr.startswith("bytes 0-1023/"), f"Bad Content-Range: {cr}"
        # total must be an integer > 1024
        total = int(cr.split("/")[-1])
        assert total > 1024
        assert r.headers.get("Accept-Ranges") == "bytes"
        assert int(r.headers.get("Content-Length", "0")) == 1024
        assert len(r.content) == 1024

    def test_video_no_range_returns_200_with_accept_ranges(self):
        r = requests.get(f"{BASE_URL}{VIDEO_PATH}", timeout=120)
        assert r.status_code == 200
        assert r.headers.get("Accept-Ranges") == "bytes"
        cl = int(r.headers.get("Content-Length", "0"))
        assert cl > 0
        assert len(r.content) == cl
        assert r.headers.get("Content-Type", "").startswith("video/")

    def test_video_mid_range_returns_206(self):
        headers = {"Range": "bytes=1024-2047"}
        r = requests.get(f"{BASE_URL}{VIDEO_PATH}", headers=headers, timeout=60)
        assert r.status_code == 206
        cr = r.headers.get("Content-Range", "")
        assert cr.startswith("bytes 1024-2047/")
        assert len(r.content) == 1024

    def test_video_open_ended_range(self):
        # bytes=0- should return from 0 to end
        headers = {"Range": "bytes=0-"}
        r = requests.get(f"{BASE_URL}{VIDEO_PATH}", headers=headers, timeout=120)
        assert r.status_code == 206
        cr = r.headers.get("Content-Range", "")
        assert cr.startswith("bytes 0-")

    def test_image_returns_200_jpeg(self):
        r = requests.get(f"{BASE_URL}{IMAGE_PATH}", timeout=60)
        assert r.status_code == 200
        assert r.headers.get("Content-Type", "").startswith("image/jpeg")
        assert int(r.headers.get("Content-Length", "0")) > 0

    def test_image_head_or_range(self):
        # image with a range also works and returns 206
        r = requests.get(f"{BASE_URL}{IMAGE_PATH}", headers={"Range": "bytes=0-99"}, timeout=60)
        assert r.status_code == 206
        assert len(r.content) == 100

    def test_media_not_found_returns_404(self):
        r = requests.get(f"{BASE_URL}/api/media/biraajo/media/does_not_exist_xyz.mp4", timeout=30)
        assert r.status_code == 404


class TestGalleryUsesRelativeMedia:
    """Gallery endpoint must return relative /api/media/... urls, not customer-assets."""

    def test_gallery_urls_are_relative_api_media(self):
        r = requests.get(f"{BASE_URL}/api/gallery", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 1
        for it in items:
            url = it.get("url") or it.get("src") or ""
            assert "customer-assets.emergentagent.com" not in url, f"customer-assets leak: {url}"
            assert url.startswith("/api/media/") or url.startswith("http") is False, f"Non-relative url: {url}"
            assert "/api/media/" in url, f"Not served via /api/media: {url}"
