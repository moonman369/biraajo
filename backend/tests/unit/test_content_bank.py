"""Unit tests for content_bank.py and its /api/media/content-bank route. No network."""
import asyncio
import sys
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import content_bank as cb  # noqa: E402

CFG = cb.Config(cloud="democloud", api_key="k", api_secret="s", folder="biraajo/Biraajo Content Bank")
VIDEO = cb.Asset(public_id="IMG_0274", resource_type="video", format="mov", version=1761918000)
IMAGE = cb.Asset(public_id="menu card 1", resource_type="image", format="jpg", version=42)


def test_config_disabled_without_real_url(monkeypatch):
    monkeypatch.delenv("CLOUDINARY_URL", raising=False)
    assert cb.load_config() is None
    monkeypatch.setenv("CLOUDINARY_URL", "cloudinary://dummy:dummy@dummy-cloud")
    assert cb.load_config() is None


def test_config_parses_url_and_default_folder(monkeypatch):
    monkeypatch.setenv("CLOUDINARY_URL", "cloudinary://123:abc@mycloud")
    monkeypatch.delenv("CONTENT_BANK_FOLDER", raising=False)
    assert cb.load_config() == cb.Config("mycloud", "123", "abc", cb.DEFAULT_FOLDER)
    monkeypatch.setenv("CONTENT_BANK_FOLDER", "/other/folder/")
    assert cb.load_config().folder == "other/folder"


@pytest.mark.parametrize("path,expected", [
    ("Naani Ghar/Testimonials/IMG_0274.mp4", ("Naani Ghar/Testimonials/IMG_0274", "mp4")),
    ("logo.png", ("logo", "png")),
    ("no-extension", None),
    ("", None),
    ("a/../b.jpg", None),
    ("dir.v2/file", None),
])
def test_split_request_path(path, expected):
    assert cb.split_request_path(path) == expected


def test_build_index_uses_relative_folder_and_display_name():
    found = {
        "biraajo/Biraajo Content Bank": [
            {"public_id": "abc123", "display_name": "cover", "resource_type": "image", "format": "jpg", "version": 7},
        ],
        "biraajo/Biraajo Content Bank/Naani Ghar/Testimonials": [
            {"public_id": "IMG_0274", "display_name": "IMG_0274", "resource_type": "video", "format": "mov", "version": 9},
        ],
        "somewhere/else": [
            {"public_id": "x", "resource_type": "image", "format": "jpg", "version": 1},
        ],
    }
    index = cb.build_index(CFG.folder, found)
    assert set(index) == {"cover", "Naani Ghar/Testimonials/IMG_0274"}
    assert index["cover"] == cb.Asset("abc123", "image", "jpg", 7)


def test_extension_rules():
    assert cb._ext_ok(VIDEO, "mp4") and cb._ext_ok(VIDEO, "MOV")
    assert not cb._ext_ok(VIDEO, "webm")
    assert cb._ext_ok(IMAGE, "jpg") and cb._ext_ok(IMAGE, "jpeg")
    assert not cb._ext_ok(IMAGE, "png")


def test_delivery_urls():
    assert cb.delivery_url(CFG, VIDEO) == \
        "https://res.cloudinary.com/democloud/video/upload/vc_h264/v1761918000/IMG_0274.mp4"
    assert cb.delivery_url(CFG, IMAGE) == \
        "https://res.cloudinary.com/democloud/image/upload/v42/menu%20card%201.jpg"


def test_signature_matches_cloudinary_example():
    # Example from Cloudinary's "Generating authentication signatures" documentation.
    params = {"eager": "w_400,h_300,c_pad|w_260,h_200,c_crop", "public_id": "sample_image", "timestamp": "1315060510"}
    assert cb.sign(params, "abcd") == "bfd09f95f331f558cbd1320e67aa8d488770583e"


def _bank_with(index):
    bank = cb.ContentBank(CFG)
    bank._index = index
    bank._loaded_at = time.monotonic()  # fresh: no network refresh
    return bank


def test_resolve_from_index():
    bank = _bank_with({"Naani Ghar/Testimonials/IMG_0274": VIDEO})
    run = asyncio.run
    assert run(bank.resolve("Naani Ghar/Testimonials/IMG_0274.mp4")).endswith("/vc_h264/v1761918000/IMG_0274.mp4")
    assert run(bank.resolve("Naani Ghar/Testimonials/IMG_0274.mov")).endswith(".mp4")
    assert run(bank.resolve("Naani Ghar/Testimonials/IMG_0274.webm")) is None
    assert run(bank.resolve("Naani Ghar/IMG_0274.mp4")) is None


def test_resolve_disabled_bank():
    assert asyncio.run(cb.ContentBank(None).resolve("anything.jpg")) is None


def test_route_redirects_and_404s(monkeypatch):
    from fastapi.testclient import TestClient
    import server

    monkeypatch.setattr(server, "content_bank", _bank_with({"Naani Ghar/Testimonials/IMG_0274": VIDEO}))
    client = TestClient(server.app)  # no `with`: startup (database) does not run
    r = client.get("/api/media/content-bank/Naani%20Ghar/Testimonials/IMG_0274.mp4", follow_redirects=False)
    assert r.status_code == 302
    assert r.headers["location"].endswith("/video/upload/vc_h264/v1761918000/IMG_0274.mp4")
    assert r.headers["cache-control"] == "public, max-age=300"
    assert client.get("/api/media/content-bank/Naani%20Ghar/missing.mp4", follow_redirects=False).status_code == 404
