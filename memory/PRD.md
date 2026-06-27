# Biraajo by Vidip Shah — PRD

## Original Problem Statement
Premium personal chef landing page for "Biraajo by Vidip Shah" — dark, luxury hospitality aesthetic, mobile-first, visually immersive. Sections: Hero, About, Experiences, Menu, Gallery, upcoming Events with internal Registration System, Newsletter, Contact. Admin Dashboard to manage everything. Dynamic events CRUD, event booking workflow stored in DB, Google Sheets integration, confirmation emails.

## Architecture
- **Frontend**: React + Tailwind + Framer Motion + Shadcn UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: Custom JWT (admin only)
- **Object Storage**: Emergent Object Storage (for payment screenshots)
- **3rd party**: Google Sheets webhook (Apps Script), Resend (pending)

## What's Been Implemented

### 2026-06-27 — Multi-step Reservation + UPI Payment + Admin Filter
- Multi-step `EventRegistrationModal` (Details → UPI Payment → Confirmed)
- Calculates total = guests × menu price (₹2,200 veg / ₹2,500 non-veg)
- UPI ID **vidipshah14-1@oksbi**, deep-link `upi://pay?…` opens UPI app on mobile
- Mandatory payment screenshot upload to Emergent Object Storage
- Registration model adds: `total_amount`, `payment_status` (pending/confirmed), `payment_screenshot_path`, `payment_confirmed_at`, `welcome_email_sent`
- Welcome email **STUBBED** (logged only) — awaiting Resend API key from user
- Re-submission of same email/event updates the pending record instead of erroring
- New endpoints:
  - `POST /api/registrations/{id}/payment-screenshot` (multipart upload, marks confirmed)
  - `GET /api/registrations/{id}/screenshot` (admin only)
  - `DELETE /api/registrations/{id}` (admin only — releases seats)
- Admin dashboard:
  - New columns: Status badge, Total, plus Actions (View Receipt / Nudge via WhatsApp / Delete)
  - Filter by payment status (Confirmed / Pending / All) + by event
  - Overview shows Confirmed / Pending / Revenue stats
  - CSV export honours both filters
- Google Sheets push events: `registration_pending` & `registration_confirmed`

### Earlier work (carried over)
- Hero, About, Experiences, Menu, Gallery, Events, Newsletter, Contact, Footer
- Admin login + Events/Newsletter/Contacts/Gallery CRUD
- Burgundy CTA colour, V1 copy revisions, custom modal replacing Google Form

## Pending / Backlog

### P0 — Blocked on user
- **Resend API key** — to send actual welcome / confirmation emails (currently STUBBED to logs)
- **Google Sheets URL fix** — current Apps Script returns 405. User must redeploy with "Anyone" access

### P0 — V2 Spec (no blockers, can start now)
- Build dedicated pages: **About the Chef**, **Naani Ghar** (past supper), **Barsaat** (upcoming supper)
- Restructure Navbar: STORY / ABOUT THE CHEF / EXPERIENCES / EVENTS / MENU / GALLERY / REACH OUT
- "Supper Club" / "Events" routes to Naani Ghar + Barsaat
- Clean up Gallery — remove all AI/stock images, keep only real uploads
- Fix serif font inconsistency in "Meaning of Biraajo" paragraph

### P2 — Future
- Admin notification on new booking (WhatsApp via Twilio or Telegram Bot)
- Move email templating + send from stub to Resend once key supplied

## Key API Endpoints
- `POST /api/auth/login`
- `GET /api/events` · `POST /api/events/{id}/register`
- `POST /api/registrations/{id}/payment-screenshot`
- `GET /api/registrations?payment_status=confirmed|pending&event_id=…`
- `GET /api/registrations/{id}/screenshot` (admin)
- `DELETE /api/registrations/{id}` (admin)
- `GET /api/stats`

## Test Credentials
See `/app/memory/test_credentials.md`
