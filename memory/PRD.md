# Biraajo by Vidip Shah — PRD

## Original Problem Statement
Premium personal chef landing page for "Biraajo by Vidip Shah". Dark, luxury hospitality aesthetic. Includes Hero, About, Experiences, Menu, Gallery, Events with internal Registration System, Newsletter, Contact, and a full Admin Dashboard with CMS to manage every section + a Suppers chooser page surfacing past + upcoming series.

## Architecture
- **Frontend**: React + Tailwind + Framer Motion + Shadcn UI + React Router
- **Backend**: FastAPI + Motor (async MongoDB)
- **DB**: MongoDB
- **Auth**: Custom JWT (admin only)
- **Object Storage**: Emergent Object Storage (payment screenshots)
- **Emails**: Resend (live, dev-mode — verified domain pending)
- **Google Sheets**: webhook configured but failing 405 (user fixing on their side; bookings safe in DB regardless)

## What's Been Implemented (latest first)

### 2026-06-28 — Direct reservation flow + Suppers chooser + Admin reservations toggle
- **Hero "Reserve a seat"** now opens the EventRegistrationModal directly for the next upcoming event (Barsaat — Monsoon Edition seeded)
- **Hero "See the menu"** now navigates to a new **`/suppers`** chooser page with two cards: Naani Ghar (View menu) and Barsaat (Read about it + Pre-book seats anyway)
- **Pre-book flow** opens EventRegistrationModal with a prominent **disclaimer banner** explaining the date isn't final yet
- **Admin Overview Reservations toggle** (`registrations_open` setting) — flips the entire site between OPEN/CLOSED instantly; closed state changes hero CTA + dims pre-book button + returns 403 on backend register endpoint
- New backend endpoints: `GET /api/settings` (public), `PUT /api/admin/settings` (admin)
- 44/44 pytest pass (+3 new tests for settings)

### Earlier in this PRD (consolidated)
- Multi-step EventRegistrationModal with UPI payment + screenshot upload
- Full admin dashboard: Events CRUD, Registrations w/ payment-status filter + WhatsApp nudge + "Nudge all pending", Menu sections CRUD, Newsletter, Messages, Gallery
- CMS at `/admin/edit` — side-panel editor + live iframe preview, draft/publish, visibility toggle per section, covers Hero/About/Experiences/Newsletter/Contact/Footer + About the Chef/Naani Ghar/Barsaat
- Resend emails — welcome on submit, confirmation on payment, admin notification on both
- Public Booking Status at `/booking/{id}` — re-upload screenshot if missed
- V2 pages: About the Chef, Naani Ghar (with real Biraajo Suppers menu + "officially ended"), Barsaat (with reel)
- Navbar restructured: STORY / ABOUT THE CHEF / EXPERIENCES / EVENTS dropdown / MENU / GALLERY / REACH OUT
- Gallery cleaned — only real customer-asset photos/videos

## Pending / Backlog

### 🟡 User-blocked
- **Verify a Resend domain** at resend.com/domains → real guests can receive emails
- **Fix Google Apps Script** with `Who has access: Anyone` and `doPost` snippet (user will get someone else to do this)

### 🟢 P2 nice-to-haves
- Split server.py into route modules (it's at ~1065 lines)
- Revision history for CMS publishes (last 10 versions)
- Twilio WhatsApp admin notifications (currently email-based via Resend)
- ARIA-modal role on EventRegistrationModal

## Key API Endpoints
- `POST /api/auth/login`
- `GET /api/events` · `POST /api/events/{id}/register` (gated by registrations_open)
- `POST /api/registrations/{id}/payment-screenshot`
- `GET /api/registrations/{id}/status` (public)
- `GET /api/settings` (public) · `PUT /api/admin/settings`
- `GET /api/site-content` · `PUT /api/admin/site-content/draft` · `POST /api/admin/site-content/publish`
- `GET /api/stats`

## Test Credentials
See `/app/memory/test_credentials.md`.
