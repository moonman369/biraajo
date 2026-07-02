"""Regression tests after in-place media compression (iter 24).
Verifies /api/media still serves 206 Range for video and 200 image/jpeg for images,
AND that the served bytes are now small (compression took effect, no stale cache).
"""
import os
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://event-booking-test-1.preview.emergentagent.com",
).rstrip("/")

# Explicit sample paths from the review request
HERO_VIDEO_PATH = "/api/media/biraajo/media/3057f27be4caad94.mp4"
SAMPLE_IMAGE_PATH = "/api/media/biraajo/media/4d82c167b3dc090f.jpg"


class TestCompressedMedia:
    def test_hero_video_no_range_200_video_mp4(self):
        r = requests.get(f"{BASE_URL}{HERO_VIDEO_PATH}", timeout=120)
        assert r.status_code == 200, f"Expected 200 got {r.status_code}"
        assert r.headers.get("Accept-Ranges") == "bytes"
        ct = r.headers.get("Content-Type", "")
        assert ct.startswith("video/"), f"Bad Content-Type: {ct}"
        cl = int(r.headers.get("Content-Length", "0"))
        assert cl > 0
        assert len(r.content) == cl
        # Compression sanity: hero video should now be < 1.5MB (was 22MB)
        assert cl < 1_500_000, f"Hero video too large: {cl} bytes (expected <1.5MB after compression)"

    def test_hero_video_range_206(self):
        headers = {"Range": "bytes=0-1023"}
        r = requests.get(f"{BASE_URL}{HERO_VIDEO_PATH}", headers=headers, timeout=60)
        assert r.status_code == 206, f"Expected 206 got {r.status_code}"
        cr = r.headers.get("Content-Range", "")
        assert cr.startswith("bytes 0-1023/"), f"Bad Content-Range: {cr}"
        total = int(cr.split("/")[-1])
        assert total > 1024
        assert total < 1_500_000, f"Hero video size {total} > 1.5MB; compression didn't take effect"
        assert r.headers.get("Accept-Ranges") == "bytes"
        assert int(r.headers.get("Content-Length", "0")) == 1024
        assert len(r.content) == 1024

    def test_hero_video_starts_with_ftyp_moov_faststart(self):
        # First few KB should contain ftyp and moov box (faststart moves moov to front)
        r = requests.get(
            f"{BASE_URL}{HERO_VIDEO_PATH}",
            headers={"Range": "bytes=0-16383"},
            timeout=60,
        )
        assert r.status_code == 206
        blob = r.content
        assert b"ftyp" in blob[:64], "ftyp box not near start"
        assert b"moov" in blob, "moov not in first 16KB — faststart likely NOT applied"

    def test_sample_image_200_jpeg_small(self):
        r = requests.get(f"{BASE_URL}{SAMPLE_IMAGE_PATH}", timeout=60)
        assert r.status_code == 200
        assert r.headers.get("Content-Type", "").startswith("image/jpeg")
        cl = int(r.headers.get("Content-Length", "0"))
        assert cl > 0
        assert len(r.content) == cl
        # After compression this image should be well under 1MB
        assert cl < 1_000_000, f"Sample image too large: {cl} bytes"
        # JPEG SOI magic
        assert r.content[:2] == b"\xff\xd8", "Not a JPEG (missing SOI)"


class TestAllMediaSmallAndReachable:
    """Iterate every url referenced by /api/gallery and /api/site-content and
    confirm each is reachable, correct type, and reasonably small."""

    @staticmethod
    def _collect_media_urls():
        urls = set()
        g = requests.get(f"{BASE_URL}/api/gallery", timeout=30)
        assert g.status_code == 200
        for it in g.json():
            u = it.get("url") or it.get("src") or ""
            if u.startswith("/api/media/"):
                urls.add(u)
        try:
            s = requests.get(f"{BASE_URL}/api/site-content", timeout=30)
            if s.status_code == 200:
                import re
                for m in re.findall(r"/api/media/[A-Za-z0-9/_.-]+", s.text):
                    urls.add(m)
        except Exception:
            pass
        return sorted(urls)

    def test_all_media_reachable_and_small(self):
        urls = self._collect_media_urls()
        assert len(urls) >= 1, "No /api/media urls discovered"
        oversized = []
        broken = []
        for u in urls:
            r = requests.get(f"{BASE_URL}{u}", timeout=120)
            if r.status_code != 200:
                broken.append((u, r.status_code))
                continue
            cl = int(r.headers.get("Content-Length", "0"))
            ct = r.headers.get("Content-Type", "")
            # threshold: videos 3MB, images 1MB
            limit = 3_000_000 if ct.startswith("video/") else 1_000_000
            if cl > limit:
                oversized.append((u, ct, cl))
        assert not broken, f"Broken media: {broken}"
        assert not oversized, f"Oversized media (compression not applied): {oversized}"
