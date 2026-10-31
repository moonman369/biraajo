"""Content Bank: serve files from a Cloudinary Media Library folder under /api/media/content-bank/.

URL scheme (mirrors the folder in the Media Library):
    /api/media/content-bank/<subfolders>/<name>.<ext>
    e.g. /api/media/content-bank/Naani%20Ghar/Testimonials/IMG_0274.mp4

<name> is the asset's display name in the Media Library (the account uses dynamic folders, so the
folder path is not part of the public_id). Images redirect to the original file on Cloudinary's CDN.
Videos always redirect to an H.264 MP4 rendition, so iPhone HEVC uploads play in every browser;
the request may use .mp4 or the original extension.

Config: CLOUDINARY_URL (cloudinary://key:secret@cloud), CONTENT_BANK_FOLDER (default below).
Without a real CLOUDINARY_URL the content bank is disabled and every lookup misses.
"""
import asyncio
import hashlib
import logging
import os
import re
import time
from dataclasses import dataclass
from typing import Optional
from urllib.parse import quote

import httpx

logger = logging.getLogger("biraajo.content_bank")

DEFAULT_FOLDER = "biraajo/Biraajo Content Bank"
VIDEO_TRANSFORMATION = "vc_h264"  # H.264 video; the .mp4 extension sets the container
INDEX_TTL_SECONDS = 300           # normal refresh interval
MISS_REFRESH_SECONDS = 30         # on an unknown path, refresh at most this often
API_TIMEOUT_SECONDS = 20


@dataclass(frozen=True)
class Asset:
    public_id: str
    resource_type: str  # image | video | raw
    format: str
    version: int


@dataclass(frozen=True)
class Config:
    cloud: str
    api_key: str
    api_secret: str
    folder: str


def load_config() -> Optional[Config]:
    url = os.environ.get("CLOUDINARY_URL", "").strip()
    m = re.fullmatch(r"cloudinary://([^:]+):([^@]+)@(.+)", url)
    if not m or m.group(3) == "dummy-cloud":
        return None
    folder = os.environ.get("CONTENT_BANK_FOLDER", "").strip().strip("/") or DEFAULT_FOLDER
    return Config(cloud=m.group(3), api_key=m.group(1), api_secret=m.group(2), folder=folder)


def _ext_ok(asset: Asset, ext: str) -> bool:
    ext = ext.lower()
    if asset.resource_type == "video":
        return ext in ("mp4", asset.format.lower())
    same = {"jpg": "jpeg", "jpeg": "jpg"}
    return ext == asset.format.lower() or same.get(ext) == asset.format.lower()


def delivery_url(cfg: Config, asset: Asset) -> str:
    pid = quote(asset.public_id, safe="/")
    base = f"https://res.cloudinary.com/{cfg.cloud}/{asset.resource_type}/upload"
    if asset.resource_type == "video":
        return f"{base}/{VIDEO_TRANSFORMATION}/v{asset.version}/{pid}.mp4"
    return f"{base}/v{asset.version}/{pid}.{asset.format}"


def sign(params: dict, api_secret: str) -> str:
    """Cloudinary API request signature: sha1 of the sorted params plus the secret."""
    to_sign = "&".join(f"{k}={params[k]}" for k in sorted(params) if params[k] not in (None, ""))
    return hashlib.sha1((to_sign + api_secret).encode()).hexdigest()


def build_index(folder: str, assets_by_folder: dict) -> dict:
    """Map 'Sub/Folder/name' (relative to the bank folder, no extension) -> Asset.
    assets_by_folder: {asset_folder: [Admin API resource dicts]}."""
    index: dict = {}
    for af, resources in assets_by_folder.items():
        rel = af[len(folder):].strip("/") if af.startswith(folder) else None
        if rel is None:
            continue
        for r in resources:
            name = r.get("display_name") or r["public_id"].rsplit("/", 1)[-1]
            key = f"{rel}/{name}" if rel else name
            if key in index:
                logger.warning("Content bank: duplicate name %r, keeping the first", key)
                continue
            index[key] = Asset(
                public_id=r["public_id"],
                resource_type=r["resource_type"],
                format=r.get("format") or "",
                version=int(r.get("version") or 1),
            )
    return index


def split_request_path(path: str) -> Optional[tuple[str, str]]:
    """'Naani Ghar/Testimonials/IMG_0274.mp4' -> ('Naani Ghar/Testimonials/IMG_0274', 'mp4')."""
    path = path.strip("/")
    if not path or ".." in path.split("/"):
        return None
    head, dot, ext = path.rpartition(".")
    if not dot or not head or "/" in ext:
        return None
    return head, ext


class ContentBank:
    def __init__(self, cfg: Optional[Config]):
        self.cfg = cfg
        self._index: dict = {}
        self._loaded_at = 0.0
        self._lock = asyncio.Lock()
        self._eager_requested: set = set()

    @property
    def enabled(self) -> bool:
        return self.cfg is not None

    async def _admin_get(self, client: httpx.AsyncClient, path: str, params: dict) -> dict:
        r = await client.get(
            f"https://api.cloudinary.com/v1_1/{self.cfg.cloud}/{path}",
            params=params,
            auth=(self.cfg.api_key, self.cfg.api_secret),
        )
        r.raise_for_status()
        return r.json()

    async def _walk(self, client: httpx.AsyncClient, folder: str, out: dict) -> None:
        resources, cursor = [], None
        while True:
            params = {"asset_folder": folder, "max_results": 500}
            if cursor:
                params["next_cursor"] = cursor
            page = await self._admin_get(client, "resources/by_asset_folder", params)
            resources += page.get("resources", [])
            cursor = page.get("next_cursor")
            if not cursor:
                break
        out[folder] = resources
        sub = await self._admin_get(client, "folders/" + quote(folder, safe="/"), {"max_results": 500})
        for f in sub.get("folders", []):
            await self._walk(client, f["path"], out)

    async def _request_mp4(self, client: httpx.AsyncClient, asset: Asset) -> None:
        """Ask Cloudinary to pre-generate the H.264 MP4 in the background (once per version)."""
        key = (asset.public_id, asset.version)
        if key in self._eager_requested:
            return
        params = {
            "public_id": asset.public_id,
            "type": "upload",
            "eager": f"{VIDEO_TRANSFORMATION}/mp4",
            "eager_async": "true",
            "timestamp": str(int(time.time())),
        }
        params["signature"] = sign(params, self.cfg.api_secret)
        params["api_key"] = self.cfg.api_key
        try:
            r = await client.post(f"https://api.cloudinary.com/v1_1/{self.cfg.cloud}/video/explicit", data=params)
            r.raise_for_status()
            self._eager_requested.add(key)
        except httpx.HTTPError as e:
            logger.warning("Content bank: could not request MP4 for %s: %s", asset.public_id, e)

    async def refresh(self, min_age: float) -> None:
        if not self.enabled or time.monotonic() - self._loaded_at < min_age:
            return
        async with self._lock:
            if time.monotonic() - self._loaded_at < min_age:
                return
            try:
                async with httpx.AsyncClient(timeout=API_TIMEOUT_SECONDS) as client:
                    found: dict = {}
                    await self._walk(client, self.cfg.folder, found)
                    index = build_index(self.cfg.folder, found)
                    for asset in index.values():
                        if asset.resource_type == "video":
                            await self._request_mp4(client, asset)
                self._index = index
                logger.info("Content bank: %d assets indexed from %r", len(index), self.cfg.folder)
            except httpx.HTTPError as e:
                # Keep serving the last good index; try again after the miss interval.
                logger.warning("Content bank: index refresh failed: %s", e)
            self._loaded_at = time.monotonic()

    async def resolve(self, path: str) -> Optional[str]:
        """Cloudinary URL for a request path, or None if there is no such file."""
        if not self.enabled:
            return None
        parts = split_request_path(path)
        if not parts:
            return None
        key, ext = parts
        await self.refresh(INDEX_TTL_SECONDS)
        asset = self._index.get(key)
        if asset is None:
            await self.refresh(MISS_REFRESH_SECONDS)
            asset = self._index.get(key)
        if asset is None or not _ext_ok(asset, ext):
            return None
        return delivery_url(self.cfg, asset)
