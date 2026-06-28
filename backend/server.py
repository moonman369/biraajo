from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import csv
import uuid
import asyncio
import logging
import httpx
import bcrypt
import jwt
import requests
import resend
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, UploadFile, File, Header, Query
from fastapi.responses import StreamingResponse, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ---------- Pricing ----------
PRICE_VEG = 2200
PRICE_NONVEG = 2500
UPI_ID = os.environ.get("UPI_ID", "vidipshah14-1@oksbi")


# ---------- Object Storage (payment screenshots) ----------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = os.environ.get("APP_NAME", "biraajo")
_storage_key: Optional[str] = None


def init_storage() -> Optional[str]:
    global _storage_key
    if _storage_key:
        return _storage_key
    key = os.environ.get("EMERGENT_LLM_KEY", "").strip()
    if not key:
        return None
    try:
        r = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": key}, timeout=30)
        r.raise_for_status()
        _storage_key = r.json()["storage_key"]
        return _storage_key
    except Exception as e:
        logging.getLogger("biraajo").error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not configured")
    r = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    r.raise_for_status()
    return r.json()


def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not configured")
    r = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    r.raise_for_status()
    return r.content, r.headers.get("Content-Type", "application/octet-stream")


# ---------- Email (Resend) ----------
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM = os.environ.get("RESEND_FROM_EMAIL", "Biraajo <onboarding@resend.dev>")
RESEND_REPLY_TO = os.environ.get("RESEND_REPLY_TO", "")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def _email_shell(title: str, body_html: str) -> str:
    """Minimal, email-client-friendly HTML wrapper for transactional emails."""
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0A0504;font-family:Georgia,'Times New Roman',serif;color:#F3EFE7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0504;padding:48px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#140A09;border:1px solid #2D1D1A;">
<tr><td style="padding:36px 36px 0 36px;">
<p style="margin:0 0 14px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#D9772B;">Biraajo · by Vidip Shah</p>
<h1 style="margin:0;font-size:30px;line-height:1.15;color:#F3EFE7;font-weight:400;">{title}</h1>
</td></tr>
<tr><td style="padding:24px 36px 36px 36px;color:#B5A79E;font-size:16px;line-height:1.65;">
{body_html}
</td></tr>
<tr><td style="padding:0 36px 36px 36px;border-top:1px solid #2D1D1A;">
<p style="margin:24px 0 4px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#B5A79E;">Biraajo House</p>
<p style="margin:0;font-size:13px;color:#B5A79E;">South Calcutta · India</p>
<p style="margin:14px 0 0 0;font-size:12px;color:#5A4A41;">If you have questions, simply reply to this email.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>"""


async def _send_email(to_email: str, subject: str, html: str) -> None:
    if not RESEND_API_KEY:
        logging.getLogger("biraajo").warning(f"[EMAIL SKIPPED — no RESEND_API_KEY] to={to_email} subj={subject}")
        return
    params = {"from": RESEND_FROM, "to": [to_email], "subject": subject, "html": html}
    if RESEND_REPLY_TO:
        params["reply_to"] = [RESEND_REPLY_TO]
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logging.getLogger("biraajo").info(f"[EMAIL SENT] id={result.get('id')} to={to_email} subj={subject}")
    except Exception as e:
        # Resend dev-mode rejects non-verified recipients with 4xx — non-blocking, warn only
        logging.getLogger("biraajo").warning(f"[EMAIL FAIL] to={to_email} subj={subject} err={e}")


PUBLIC_SITE_URL = os.environ.get("PUBLIC_SITE_URL", "https://biraajo-chef.preview.emergentagent.com").rstrip("/")


async def send_welcome_email(to_email: str, name: str, event_title: str, total_amount: int, reg_id: str = "") -> None:
    first = name.split(" ")[0] if name else "there"
    link = f"{PUBLIC_SITE_URL}/booking/{reg_id}" if reg_id else PUBLIC_SITE_URL
    body = f"""
<p>Dear {first},</p>
<p>Thank you for reserving a seat at <strong style="color:#F3EFE7;">{event_title}</strong>. Your details are with us — your seat is being held while you complete the UPI payment of <strong style="color:#F3EFE7;">₹{total_amount:,}</strong>.</p>
<p style="margin:24px 0;">
  <a href="{link}" style="display:inline-block;padding:14px 22px;background:#5A1A1F;color:#F3EFE7;text-decoration:none;letter-spacing:0.18em;text-transform:uppercase;font-size:11px;">Complete your booking</a>
</p>
<p>The link above takes you back to your booking page, where you can pay via UPI and upload the payment screenshot. Once we receive it, you'll get a final confirmation.</p>
<p style="font-style:italic;color:#F3EFE7;">A table is being set — by someone who thinks the setting of it is as interesting as the meal itself.</p>
<p>Warmly,<br/>Vidip · Biraajo</p>
"""
    await _send_email(to_email, f"You're on the list · {event_title}", _email_shell("You're on the list.", body))


async def send_admin_notification(reg: dict, event: dict, kind: str = "pending") -> None:
    """Notify the site owner (admin) when a new booking comes in (pending) or gets paid (confirmed)."""
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip()
    if not admin_email:
        return
    status_word = "PAID" if kind == "confirmed" else "PENDING"
    color = "#9FD79F" if kind == "confirmed" else "#D9772B"
    body = f"""
<p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:{color};">{status_word} · New booking</p>
<h2 style="margin:8px 0 18px 0;color:#F3EFE7;font-size:24px;">{reg.get("full_name", "")} · {event.get("title", "")}</h2>
<table cellpadding="6" cellspacing="0" style="width:100%;color:#B5A79E;font-size:14px;">
<tr><td style="color:#B5A79E;">Guests</td><td style="color:#F3EFE7;">{reg.get("guests", 1)} · {reg.get("menu_preference", "")}</td></tr>
<tr><td style="color:#B5A79E;">Amount</td><td style="color:#F3EFE7;">₹{int(reg.get("total_amount", 0)):,}</td></tr>
<tr><td style="color:#B5A79E;">When</td><td style="color:#F3EFE7;">{event.get("date", "")} · {event.get("time", "")}</td></tr>
<tr><td style="color:#B5A79E;">Email</td><td style="color:#F3EFE7;">{reg.get("email", "")}</td></tr>
<tr><td style="color:#B5A79E;">Phone</td><td style="color:#F3EFE7;">{reg.get("phone", "")}</td></tr>
<tr><td style="color:#B5A79E;">Instagram</td><td style="color:#F3EFE7;">{reg.get("instagram_handle", "—")}</td></tr>
<tr><td style="color:#B5A79E;">Dietary</td><td style="color:#F3EFE7;">{reg.get("dietary_preferences", "—")}</td></tr>
</table>
<p style="margin-top:24px;"><a href="{PUBLIC_SITE_URL}/admin" style="display:inline-block;padding:12px 18px;background:#5A1A1F;color:#F3EFE7;text-decoration:none;letter-spacing:0.18em;text-transform:uppercase;font-size:11px;">Open admin dashboard</a></p>
"""
    subject = f"[{status_word}] {reg.get('full_name', '')} · {event.get('title', '')}"
    await _send_email(admin_email, subject, _email_shell(f"New booking · {status_word.lower()}", body))


async def send_confirmation_email(to_email: str, name: str, event: dict, total_amount: int, guests: int, menu: str) -> None:
    first = name.split(" ")[0] if name else "there"
    body = f"""
<p>Dear {first},</p>
<p>Your seat is <strong style="color:#F3EFE7;">confirmed</strong>. Thank you for the payment.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;border:1px solid #2D1D1A;">
<tr><td style="padding:14px 18px;border-bottom:1px solid #2D1D1A;"><span style="color:#B5A79E;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Event</span><br/><span style="color:#F3EFE7;font-size:16px;">{event.get('title','')}</span></td></tr>
<tr><td style="padding:14px 18px;border-bottom:1px solid #2D1D1A;"><span style="color:#B5A79E;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">When</span><br/><span style="color:#F3EFE7;font-size:16px;">{event.get('date','')} · {event.get('time','')}</span></td></tr>
<tr><td style="padding:14px 18px;border-bottom:1px solid #2D1D1A;"><span style="color:#B5A79E;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Where</span><br/><span style="color:#F3EFE7;font-size:16px;">{event.get('venue','')}</span></td></tr>
<tr><td style="padding:14px 18px;border-bottom:1px solid #2D1D1A;"><span style="color:#B5A79E;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Guests · Menu</span><br/><span style="color:#F3EFE7;font-size:16px;">{guests} · {menu}</span></td></tr>
<tr><td style="padding:14px 18px;"><span style="color:#B5A79E;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Amount paid</span><br/><span style="color:#F3EFE7;font-size:16px;">₹{total_amount:,}</span></td></tr>
</table>
<p>If anything changes between now and the evening, we'll reach you on WhatsApp.</p>
<p>Until then — pull up a chair.</p>
<p>Warmly,<br/>Vidip · Biraajo</p>
"""
    await _send_email(to_email, f"Confirmed · {event.get('title','')}", _email_shell("See you soon.", body))


# ---------- DB ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------- App ----------
app = FastAPI(title="Biraajo by Vidip Shah API")
api = APIRouter(prefix="/api")

# ---------- Logging ----------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("biraajo")

# ---------- Auth helpers ----------
JWT_ALGORITHM = "HS256"
JWT_EXP_HOURS = 24 * 7


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
        "type": "access",
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.admins.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("password_hash", None)
    return user


# ---------- Google Sheets webhook (fire-and-forget) ----------
async def _send_to_sheet(payload_type: str, data: dict) -> dict:
    url = os.environ.get("GOOGLE_SHEETS_WEBHOOK_URL", "").strip()
    if not url:
        return {"ok": False, "reason": "no_webhook_configured"}
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as c:
            r = await c.post(url, json={"type": payload_type, "data": data})
        ct = r.headers.get("content-type", "")
        # Apps Script returns HTML error pages with HTTP 200 — sniff content type
        if r.status_code >= 400 or ("html" in ct.lower() and "json" not in ct.lower()):
            snippet = r.text[:200].replace("\n", " ")
            logger.warning(f"Sheets webhook NOT OK for {payload_type}: status={r.status_code} ct={ct} body={snippet!r}")
            return {"ok": False, "status": r.status_code, "content_type": ct, "body": snippet}
        logger.info(f"Sheets webhook OK for {payload_type}: status={r.status_code}")
        return {"ok": True, "status": r.status_code}
    except Exception as e:
        logger.warning(f"Sheets webhook EXCEPTION for {payload_type}: {e}")
        return {"ok": False, "reason": str(e)}


def push_to_sheet(payload_type: str, data: dict) -> None:
    """Schedule a non-blocking send to Google Sheets. Booking never fails because of this."""
    try:
        asyncio.create_task(_send_to_sheet(payload_type, data))
    except RuntimeError:
        pass


# ---------- Models ----------
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class EventIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    date: str  # ISO date
    time: str
    venue: str
    description: str
    price: float = 0.0
    seats_total: int = 1
    image_url: str = ""
    tag: Optional[str] = "Supper Club"


class Event(EventIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seats_booked: int = 0
    is_published: bool = True
    created_at: str = Field(default_factory=_now_iso)


class RegistrationIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event_id: str
    full_name: str
    email: EmailStr
    phone: str
    instagram_handle: Optional[str] = ""
    menu_preference: Optional[str] = ""  # Vegetarian | Non-Vegetarian
    dietary_preferences: Optional[str] = ""
    guests: int = 1
    notes: Optional[str] = ""


class Registration(RegistrationIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    total_amount: int = 0
    payment_status: str = "pending"  # pending | confirmed
    payment_screenshot_path: str = ""
    payment_confirmed_at: Optional[str] = None
    welcome_email_sent: bool = False
    created_at: str = Field(default_factory=_now_iso)


class SubscriberIn(BaseModel):
    email: EmailStr
    name: Optional[str] = ""


class Subscriber(SubscriberIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=_now_iso)


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    message: str


class ContactMessage(ContactIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=_now_iso)


class MenuSectionIn(BaseModel):
    title: str
    subtitle: Optional[str] = ""
    items: List[dict] = []  # [{name, description, price}]
    order: int = 0


class MenuSection(MenuSectionIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=_now_iso)


class GalleryImageIn(BaseModel):
    url: str
    caption: Optional[str] = ""
    order: int = 0


class GalleryImage(GalleryImageIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=_now_iso)


# ---------- Startup helpers ----------
_STARTER_GALLERY = [
    "https://images.unsplash.com/photo-1728910156510-77488f19b152",
    "https://images.unsplash.com/photo-1606471191009-63994c53433b",
    "https://images.unsplash.com/photo-1625668931397-b9c35f63186b",
    "https://images.unsplash.com/photo-1562050344-f7ad946cee35",
    "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92",
    "https://images.unsplash.com/photo-1588644525273-f37b60d78512",
    "https://images.unsplash.com/photo-1697659602792-31dcb2a5a4ec",
    "https://images.unsplash.com/photo-1517870662726-c1d98ee36250",
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe",
    "https://images.unsplash.com/photo-1606660023296-81d67734170a",
]

_STARTER_MENU = [
    {"title": "Amuse", "subtitle": "A whisper to begin", "order": 0, "items": [
        {"name": "Bel-Phuljhadi", "description": "Wood-apple sphere, kala namak air, mustard oil pearls", "price": ""},
        {"name": "Smoked Kokum Shot", "description": "Cold-pressed kokum, curry leaf oil, jaggery foam", "price": ""},
    ]},
    {"title": "Small Plates", "subtitle": "Stories from home, retold", "order": 1, "items": [
        {"name": "Bombil Croquette", "description": "Konkan bombay duck, gunpowder, lime aioli", "price": ""},
        {"name": "Chana Chaat 2.0", "description": "Black chickpea, tomato confit, mint emulsion, papdi shards", "price": ""},
        {"name": "Bharli Vangi Bao", "description": "Maharashtrian stuffed aubergine, peanut goda, milk bun", "price": ""},
    ]},
    {"title": "The Main", "subtitle": "A long, slow conversation", "order": 2, "items": [
        {"name": "Dak Bungalow Lamb", "description": "Slow-braised lamb shank, raj masala, burnt onion jus", "price": ""},
        {"name": "Malvani Pomfret", "description": "Whole roasted pomfret, kokum-coconut curry, red rice", "price": ""},
        {"name": "Saoji Mushroom", "description": "Nagpuri saoji, forest mushrooms, smoked ghee rice", "price": ""},
    ]},
    {"title": "Sweet Endings", "subtitle": "The last word", "order": 3, "items": [
        {"name": "Mishti Doi Cheesecake", "description": "Bengali jaggery yoghurt, nolen gur, palm sugar tuile", "price": ""},
        {"name": "Phirni de la Maison", "description": "Saffron rice pudding, rose, pistachio brittle", "price": ""},
    ]},
]


async def _setup_indexes() -> None:
    try:
        await db.registrations.drop_index("event_id_1_email_1")
    except Exception:
        pass
    await db.admins.create_index("email", unique=True)
    await db.subscribers.create_index("email", unique=True)


async def _seed_admin() -> None:
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.admins.find_one({"email": admin_email})
    if not existing:
        await db.admins.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Vidip Shah",
            "role": "admin",
            "created_at": _now_iso(),
        })
        logger.info(f"Seeded admin: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.admins.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info("Updated admin password from .env")


async def _seed_gallery() -> None:
    if await db.gallery.count_documents({}) > 0:
        return
    for i, url in enumerate(_STARTER_GALLERY):
        await db.gallery.insert_one(GalleryImage(url=url, order=i).model_dump())


async def _seed_menu() -> None:
    if await db.menus.count_documents({}) > 0:
        return
    for s in _STARTER_MENU:
        await db.menus.insert_one(MenuSection(**s).model_dump())


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup() -> None:
    await _setup_indexes()
    if init_storage():
        logger.info("Object storage initialized")
    else:
        logger.warning("Object storage NOT initialized — screenshot uploads will fail")
    await _seed_admin()
    await _seed_gallery()
    await _seed_menu()


# ---------- Auth Routes ----------
@api.post("/auth/login")
async def auth_login(body: LoginIn):
    email = body.email.lower()
    user = await db.admins.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "email": email, "name": user.get("name", "")},
    }


@api.get("/auth/me")
async def auth_me(user=Depends(get_current_admin)):
    return user


# ---------- Events ----------
@api.get("/events")
async def list_events(upcoming: bool = False):
    q = {}
    docs = await db.events.find(q, {"_id": 0}).sort("date", 1).to_list(500)
    if upcoming:
        today = datetime.now(timezone.utc).date().isoformat()
        docs = [d for d in docs if d.get("date", "") >= today]
    return docs


@api.get("/events/{event_id}")
async def get_event(event_id: str):
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    return doc


@api.post("/events")
async def create_event(body: EventIn, user=Depends(get_current_admin)):
    ev = Event(**body.model_dump())
    await db.events.insert_one(ev.model_dump())
    return ev.model_dump()


@api.put("/events/{event_id}")
async def update_event(event_id: str, body: EventIn, user=Depends(get_current_admin)):
    res = await db.events.update_one({"id": event_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    return doc


@api.delete("/events/{event_id}")
async def delete_event(event_id: str, user=Depends(get_current_admin)):
    await db.events.delete_one({"id": event_id})
    await db.registrations.delete_many({"event_id": event_id})
    return {"ok": True}


# ---------- Registrations ----------
def _calc_total(menu_preference: str, guests: int) -> int:
    per_seat = PRICE_VEG if menu_preference == "Vegetarian" else PRICE_NONVEG
    return per_seat * max(1, int(guests))


def _check_seats(event: dict, requested: int, baseline_guests: int = 0) -> int:
    """Return available seats after baseline; raise if requested exceeds available."""
    available = event["seats_total"] - event.get("seats_booked", 0) + baseline_guests
    if requested > available:
        raise HTTPException(status_code=400, detail=f"Only {available} seat(s) available")
    return available


async def _update_pending_registration(existing: dict, payload: dict, total: int, event_id: str) -> dict:
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    requested = int(payload.get("guests", 1))
    _check_seats(event, requested, baseline_guests=int(existing.get("guests", 1)))
    await db.registrations.update_one(
        {"id": existing["id"]},
        {"$set": {**payload, "total_amount": total}},
    )
    delta_guests = requested - int(existing.get("guests", 1))
    if delta_guests != 0:
        await db.events.update_one({"id": event_id}, {"$inc": {"seats_booked": delta_guests}})
    return await db.registrations.find_one({"id": existing["id"]}, {"_id": 0})


async def _create_pending_registration(payload: dict, total: int, event: dict) -> Registration:
    reg = Registration(**payload, total_amount=total)
    await db.registrations.insert_one(reg.model_dump())
    await db.events.update_one(
        {"id": event["id"]}, {"$inc": {"seats_booked": reg.guests}}
    )
    asyncio.create_task(send_welcome_email(reg.email, reg.full_name, event["title"], total, reg_id=reg.id))
    asyncio.create_task(send_admin_notification(reg.model_dump(), event, kind="pending"))
    await db.registrations.update_one({"id": reg.id}, {"$set": {"welcome_email_sent": True}})
    push_to_sheet("registration_pending", {
        "created_at": reg.created_at,
        "event": event["title"],
        "name": reg.full_name,
        "email": reg.email,
        "phone": reg.phone,
        "instagram": reg.instagram_handle or "",
        "menu": reg.menu_preference or "",
        "guests": reg.guests,
        "dietary": reg.dietary_preferences or "",
        "notes": reg.notes or "",
        "total_amount": total,
        "payment_status": "pending",
    })
    return reg


@api.post("/events/{event_id}/register")
async def register_event(event_id: str, body: RegistrationIn):
    settings = await _get_settings()
    if not settings.get("registrations_open", True):
        raise HTTPException(status_code=403, detail="Reservations are currently closed. Please check back soon.")
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    payload = body.model_dump()
    payload["event_id"] = event_id
    payload["email"] = payload["email"].lower()
    total = _calc_total(payload.get("menu_preference", ""), payload.get("guests", 1))

    existing = await db.registrations.find_one({"event_id": event_id, "email": payload["email"]})
    if existing and existing.get("payment_status") == "confirmed":
        raise HTTPException(status_code=409, detail="You're already confirmed for this event")
    if existing:
        doc = await _update_pending_registration(existing, payload, total, event_id)
        return {**doc, "upi_id": UPI_ID}

    _check_seats(event, body.guests)
    reg = await _create_pending_registration(payload, total, event)
    return {**reg.model_dump(), "upi_id": UPI_ID}


@api.get("/registrations/{reg_id}/status")
async def public_registration_status(reg_id: str):
    """Public endpoint — returns lightweight booking info so a guest can self-check or re-upload screenshot."""
    reg = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Booking not found")
    event = await db.events.find_one({"id": reg.get("event_id")}, {"_id": 0}) or {}
    return {
        "id": reg["id"],
        "full_name": reg.get("full_name", ""),
        "email": reg.get("email", ""),
        "guests": reg.get("guests", 1),
        "menu_preference": reg.get("menu_preference", ""),
        "total_amount": reg.get("total_amount", 0),
        "payment_status": reg.get("payment_status", "pending"),
        "payment_confirmed_at": reg.get("payment_confirmed_at"),
        "has_screenshot": bool(reg.get("payment_screenshot_path")),
        "upi_id": UPI_ID,
        "event": {
            "id": event.get("id", ""),
            "title": event.get("title", ""),
            "date": event.get("date", ""),
            "time": event.get("time", ""),
            "venue": event.get("venue", ""),
        },
    }


@api.post("/registrations/{reg_id}/payment-screenshot")
async def upload_payment_screenshot(reg_id: str, file: UploadFile = File(...)):
    reg = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    ct = (file.content_type or "").lower()
    if not ct.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image (JPG/PNG)")

    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "jpg").lower()
    path = f"{APP_NAME}/payments/{reg_id}/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, ct or "image/jpeg")

    now = _now_iso()
    await db.registrations.update_one(
        {"id": reg_id},
        {"$set": {
            "payment_screenshot_path": result["path"],
            "payment_status": "confirmed",
            "payment_confirmed_at": now,
        }},
    )

    event = await db.events.find_one({"id": reg.get("event_id")}, {"_id": 0}) or {}
    asyncio.create_task(send_confirmation_email(
        to_email=reg.get("email", ""),
        name=reg.get("full_name", ""),
        event=event,
        total_amount=int(reg.get("total_amount", 0)),
        guests=int(reg.get("guests", 1)),
        menu=reg.get("menu_preference", ""),
    ))
    asyncio.create_task(send_admin_notification({**reg, "payment_status": "confirmed"}, event, kind="confirmed"))
    push_to_sheet("registration_confirmed", {
        "created_at": reg.get("created_at"),
        "confirmed_at": now,
        "event": event.get("title", ""),
        "name": reg.get("full_name", ""),
        "email": reg.get("email", ""),
        "phone": reg.get("phone", ""),
        "instagram": reg.get("instagram_handle", ""),
        "menu": reg.get("menu_preference", ""),
        "guests": reg.get("guests", 1),
        "total_amount": reg.get("total_amount", 0),
        "payment_status": "confirmed",
    })

    return {"ok": True, "payment_status": "confirmed"}


@api.get("/registrations/{reg_id}/screenshot")
async def get_payment_screenshot(reg_id: str, user=Depends(get_current_admin)):
    reg = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    if not reg or not reg.get("payment_screenshot_path"):
        raise HTTPException(status_code=404, detail="Screenshot not found")
    data, ct = get_object(reg["payment_screenshot_path"])
    return Response(content=data, media_type=ct)


@api.get("/registrations")
async def list_registrations(
    event_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    user=Depends(get_current_admin),
):
    q: dict = {}
    if event_id:
        q["event_id"] = event_id
    if payment_status in ("pending", "confirmed"):
        q["payment_status"] = payment_status
    docs = await db.registrations.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api.delete("/registrations/{reg_id}")
async def delete_registration(reg_id: str, user=Depends(get_current_admin)):
    reg = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    await db.registrations.delete_one({"id": reg_id})
    # Release seats
    await db.events.update_one(
        {"id": reg.get("event_id")},
        {"$inc": {"seats_booked": -int(reg.get("guests", 1))}},
    )
    return {"ok": True}


@api.get("/registrations/export")
async def export_registrations(
    event_id: Optional[str] = None,
    payment_status: Optional[str] = None,
    user=Depends(get_current_admin),
):
    q: dict = {}
    if event_id:
        q["event_id"] = event_id
    if payment_status in ("pending", "confirmed"):
        q["payment_status"] = payment_status
    docs = await db.registrations.find(q, {"_id": 0}).sort("created_at", -1).to_list(5000)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "event_id", "full_name", "email", "phone", "instagram_handle",
        "menu_preference", "dietary_preferences", "guests", "notes",
        "total_amount", "payment_status", "payment_confirmed_at", "created_at",
    ])
    for d in docs:
        writer.writerow([
            d.get("id", ""), d.get("event_id", ""), d.get("full_name", ""),
            d.get("email", ""), d.get("phone", ""), d.get("instagram_handle", ""),
            d.get("menu_preference", ""), d.get("dietary_preferences", ""),
            d.get("guests", 1), d.get("notes", ""),
            d.get("total_amount", 0), d.get("payment_status", ""),
            d.get("payment_confirmed_at", "") or "", d.get("created_at", ""),
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=registrations.csv"},
    )


# ---------- Newsletter ----------
@api.post("/newsletter")
async def newsletter_subscribe(body: SubscriberIn):
    email = body.email.lower()
    existing = await db.subscribers.find_one({"email": email})
    if existing:
        return {"ok": True, "message": "Already subscribed"}
    sub = Subscriber(email=email, name=body.name or "")
    await db.subscribers.insert_one(sub.model_dump())
    push_to_sheet("newsletter", {
        "created_at": sub.created_at,
        "email": sub.email,
        "name": sub.name or "",
    })
    return {"ok": True, "id": sub.id}


@api.get("/newsletter")
async def list_subscribers(user=Depends(get_current_admin)):
    docs = await db.subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    return docs


@api.get("/newsletter/export")
async def export_subscribers(user=Depends(get_current_admin)):
    docs = await db.subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "email", "name", "created_at"])
    for d in docs:
        writer.writerow([d.get("id", ""), d.get("email", ""), d.get("name", ""), d.get("created_at", "")])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=subscribers.csv"},
    )


# ---------- Contact ----------
@api.post("/contact")
async def contact_create(body: ContactIn):
    msg = ContactMessage(**body.model_dump())
    await db.contacts.insert_one(msg.model_dump())
    push_to_sheet("contact", {
        "created_at": msg.created_at,
        "name": msg.name,
        "email": msg.email,
        "phone": msg.phone or "",
        "message": msg.message,
    })
    return {"ok": True, "id": msg.id}


@api.get("/contact")
async def contact_list(user=Depends(get_current_admin)):
    docs = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


# ---------- Menu ----------
@api.get("/menu")
async def list_menu():
    docs = await db.menus.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return docs


@api.post("/menu")
async def create_menu_section(body: MenuSectionIn, user=Depends(get_current_admin)):
    section = MenuSection(**body.model_dump())
    await db.menus.insert_one(section.model_dump())
    return section.model_dump()


@api.put("/menu/{section_id}")
async def update_menu_section(section_id: str, body: MenuSectionIn, user=Depends(get_current_admin)):
    res = await db.menus.update_one({"id": section_id}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return await db.menus.find_one({"id": section_id}, {"_id": 0})


@api.delete("/menu/{section_id}")
async def delete_menu_section(section_id: str, user=Depends(get_current_admin)):
    await db.menus.delete_one({"id": section_id})
    return {"ok": True}


# ---------- Gallery ----------
@api.get("/gallery")
async def list_gallery():
    docs = await db.gallery.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    return docs


@api.post("/gallery")
async def create_gallery(body: GalleryImageIn, user=Depends(get_current_admin)):
    img = GalleryImage(**body.model_dump())
    await db.gallery.insert_one(img.model_dump())
    return img.model_dump()


@api.delete("/gallery/{image_id}")
async def delete_gallery(image_id: str, user=Depends(get_current_admin)):
    await db.gallery.delete_one({"id": image_id})
    return {"ok": True}


# ---------- Sheets webhook diagnostics ----------
@api.post("/sheets/test")
async def test_sheets_webhook(user=Depends(get_current_admin)):
    """Synchronously POST a ping to the configured Sheets webhook so admin can verify it."""
    url = os.environ.get("GOOGLE_SHEETS_WEBHOOK_URL", "").strip()
    if not url:
        return {"ok": False, "reason": "no_webhook_configured"}
    result = await _send_to_sheet("ping", {"source": "admin_test", "ts": _now_iso()})
    return {"webhook_url": url, **result}


# ---------- Site Content CMS ----------
from site_defaults import get_default_content  # noqa: E402


def _deep_merge(base: dict, overrides: dict) -> dict:
    """Merge overrides into base. Lists are replaced wholesale; dicts are deep-merged."""
    out = dict(base)
    for k, v in overrides.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


async def _get_site_doc(mode: str) -> dict:
    """Return the site_content doc for mode ('published' or 'draft'), seeding from defaults if missing."""
    doc = await db.site_content.find_one({"id": mode}, {"_id": 0})
    if doc:
        # Always merge with defaults so newly-added fields are present
        return _deep_merge(get_default_content(), doc.get("data", {}))
    defaults = get_default_content()
    await db.site_content.insert_one({"id": mode, "data": defaults, "updated_at": _now_iso()})
    return defaults


@api.get("/site-content")
async def get_site_content(mode: str = "published"):
    """Public endpoint. mode=published (default) or mode=draft (requires no auth so the preview iframe works)."""
    if mode not in ("published", "draft"):
        mode = "published"
    return await _get_site_doc(mode)


@api.put("/admin/site-content/draft")
async def update_site_content_draft(body: dict, user=Depends(get_current_admin)):
    """Replace draft content with the provided body. Validates required top-level keys."""
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Body must be a JSON object")
    required_top = {"landing", "about_the_chef", "naani_ghar", "barsaat"}
    missing = required_top - set(body.keys())
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required top-level keys: {sorted(missing)}")
    if not isinstance(body.get("landing"), dict):
        raise HTTPException(status_code=400, detail="'landing' must be a dict")
    await db.site_content.update_one(
        {"id": "draft"},
        {"$set": {"data": body, "updated_at": _now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api.post("/admin/site-content/publish")
async def publish_site_content(user=Depends(get_current_admin)):
    """Copy current draft → published."""
    draft = await _get_site_doc("draft")
    await db.site_content.update_one(
        {"id": "published"},
        {"$set": {"data": draft, "updated_at": _now_iso()}},
        upsert=True,
    )
    return {"ok": True, "published_at": _now_iso()}


@api.post("/admin/site-content/discard")
async def discard_site_content_draft(user=Depends(get_current_admin)):
    """Revert draft to the currently published content."""
    published = await _get_site_doc("published")
    await db.site_content.update_one(
        {"id": "draft"},
        {"$set": {"data": published, "updated_at": _now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api.post("/admin/site-content/reset")
async def reset_site_content(user=Depends(get_current_admin)):
    """Reset both draft and published to the hardcoded defaults (use carefully)."""
    defaults = get_default_content()
    now = _now_iso()
    for m in ("draft", "published"):
        await db.site_content.update_one(
            {"id": m},
            {"$set": {"data": defaults, "updated_at": now}},
            upsert=True,
        )
    return {"ok": True}


# ---------- Global settings (registrations toggle, etc.) ----------
DEFAULT_SETTINGS = {
    "registrations_open": True,
}


async def _get_settings() -> dict:
    doc = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not doc:
        await db.settings.insert_one({"id": "global", "data": DEFAULT_SETTINGS, "updated_at": _now_iso()})
        return dict(DEFAULT_SETTINGS)
    return {**DEFAULT_SETTINGS, **(doc.get("data") or {})}


@api.get("/settings")
async def public_settings():
    """Public-readable settings — only safe fields."""
    s = await _get_settings()
    return {"registrations_open": bool(s.get("registrations_open", True))}


@api.put("/admin/settings")
async def update_settings(body: dict, user=Depends(get_current_admin)):
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Body must be a JSON object")
    current = await _get_settings()
    merged = {**current, **{k: v for k, v in body.items() if k in DEFAULT_SETTINGS}}
    await db.settings.update_one(
        {"id": "global"},
        {"$set": {"data": merged, "updated_at": _now_iso()}},
        upsert=True,
    )
    return merged


# ---------- Stats ----------
@api.get("/stats")
async def stats(user=Depends(get_current_admin)):
    today = datetime.now(timezone.utc).date().isoformat()
    total_events = await db.events.count_documents({})
    upcoming_events = await db.events.count_documents({"date": {"$gte": today}})
    total_regs = await db.registrations.count_documents({})
    confirmed_regs = await db.registrations.count_documents({"payment_status": "confirmed"})
    pending_regs = await db.registrations.count_documents({"payment_status": "pending"})
    total_subs = await db.subscribers.count_documents({})
    total_contacts = await db.contacts.count_documents({})

    # Revenue from confirmed registrations
    pipeline = [
        {"$match": {"payment_status": "confirmed"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
    ]
    rev_cursor = db.registrations.aggregate(pipeline)
    rev_doc = await rev_cursor.to_list(1)
    revenue = int(rev_doc[0]["total"]) if rev_doc else 0

    return {
        "total_events": total_events,
        "upcoming_events": upcoming_events,
        "total_registrations": total_regs,
        "confirmed_registrations": confirmed_regs,
        "pending_registrations": pending_regs,
        "total_subscribers": total_subs,
        "total_contacts": total_contacts,
        "revenue": revenue,
    }


@api.get("/")
async def health():
    return {"status": "ok", "name": "Biraajo API"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
