from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import csv
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


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
    dietary_preferences: Optional[str] = ""
    guests: int = 1
    notes: Optional[str] = ""


class Registration(RegistrationIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    # Indexes
    await db.admins.create_index("email", unique=True)
    await db.subscribers.create_index("email", unique=True)
    await db.registrations.create_index([("event_id", 1), ("email", 1)], unique=True)

    # Seed admin
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
    else:
        if not verify_password(admin_password, existing["password_hash"]):
            await db.admins.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_password)}},
            )
            logger.info("Updated admin password from .env")

    # Seed initial gallery & menu if empty (optional starter content)
    if await db.gallery.count_documents({}) == 0:
        starter_gallery = [
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
        for i, url in enumerate(starter_gallery):
            await db.gallery.insert_one(GalleryImage(url=url, order=i).model_dump())

    if await db.menus.count_documents({}) == 0:
        starter_menu = [
            MenuSection(
                title="Amuse",
                subtitle="A whisper to begin",
                order=0,
                items=[
                    {"name": "Bel-Phuljhadi", "description": "Wood-apple sphere, kala namak air, mustard oil pearls", "price": ""},
                    {"name": "Smoked Kokum Shot", "description": "Cold-pressed kokum, curry leaf oil, jaggery foam", "price": ""},
                ],
            ),
            MenuSection(
                title="Small Plates",
                subtitle="Stories from home, retold",
                order=1,
                items=[
                    {"name": "Bombil Croquette", "description": "Konkan bombay duck, gunpowder, lime aioli", "price": ""},
                    {"name": "Chana Chaat 2.0", "description": "Black chickpea, tomato confit, mint emulsion, papdi shards", "price": ""},
                    {"name": "Bharli Vangi Bao", "description": "Maharashtrian stuffed aubergine, peanut goda, milk bun", "price": ""},
                ],
            ),
            MenuSection(
                title="The Main",
                subtitle="A long, slow conversation",
                order=2,
                items=[
                    {"name": "Dak Bungalow Lamb", "description": "Slow-braised lamb shank, raj masala, burnt onion jus", "price": ""},
                    {"name": "Malvani Pomfret", "description": "Whole roasted pomfret, kokum-coconut curry, red rice", "price": ""},
                    {"name": "Saoji Mushroom", "description": "Nagpuri saoji, forest mushrooms, smoked ghee rice", "price": ""},
                ],
            ),
            MenuSection(
                title="Sweet Endings",
                subtitle="The last word",
                order=3,
                items=[
                    {"name": "Mishti Doi Cheesecake", "description": "Bengali jaggery yoghurt, nolen gur, palm sugar tuile", "price": ""},
                    {"name": "Phirni de la Maison", "description": "Saffron rice pudding, rose, pistachio brittle", "price": ""},
                ],
            ),
        ]
        for s in starter_menu:
            await db.menus.insert_one(s.model_dump())


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
@api.post("/events/{event_id}/register")
async def register_event(event_id: str, body: RegistrationIn):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    available = event["seats_total"] - event.get("seats_booked", 0)
    if body.guests > available:
        raise HTTPException(status_code=400, detail=f"Only {available} seat(s) available")

    # Force event_id from path
    payload = body.model_dump()
    payload["event_id"] = event_id
    payload["email"] = payload["email"].lower()
    reg = Registration(**payload)

    existing = await db.registrations.find_one({"event_id": event_id, "email": reg.email})
    if existing:
        raise HTTPException(status_code=409, detail="You have already registered for this event")

    await db.registrations.insert_one(reg.model_dump())
    await db.events.update_one(
        {"id": event_id}, {"$inc": {"seats_booked": reg.guests}}
    )
    return reg.model_dump()


@api.get("/registrations")
async def list_registrations(event_id: Optional[str] = None, user=Depends(get_current_admin)):
    q = {"event_id": event_id} if event_id else {}
    docs = await db.registrations.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api.get("/registrations/export")
async def export_registrations(event_id: Optional[str] = None, user=Depends(get_current_admin)):
    q = {"event_id": event_id} if event_id else {}
    docs = await db.registrations.find(q, {"_id": 0}).sort("created_at", -1).to_list(5000)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "event_id", "full_name", "email", "phone", "instagram_handle",
        "dietary_preferences", "guests", "notes", "created_at",
    ])
    for d in docs:
        writer.writerow([
            d.get("id", ""), d.get("event_id", ""), d.get("full_name", ""),
            d.get("email", ""), d.get("phone", ""), d.get("instagram_handle", ""),
            d.get("dietary_preferences", ""), d.get("guests", 1),
            d.get("notes", ""), d.get("created_at", ""),
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


# ---------- Stats ----------
@api.get("/stats")
async def stats(user=Depends(get_current_admin)):
    today = datetime.now(timezone.utc).date().isoformat()
    total_events = await db.events.count_documents({})
    upcoming_events = await db.events.count_documents({"date": {"$gte": today}})
    total_regs = await db.registrations.count_documents({})
    total_subs = await db.subscribers.count_documents({})
    total_contacts = await db.contacts.count_documents({})
    return {
        "total_events": total_events,
        "upcoming_events": upcoming_events,
        "total_registrations": total_regs,
        "total_subscribers": total_subs,
        "total_contacts": total_contacts,
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
