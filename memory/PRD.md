# Biraajo by Vidip Shah — PRD

## Original Problem Statement
Premium personal chef landing page for "Biraajo by Vidip Shah" — dark, luxury hospitality aesthetic, mobile-first, immersive. Hero, About, Experiences, Menu, Gallery, Events with internal Registration System, Newsletter, Contact. Admin Dashboard. Dynamic events CRUD, event booking with UPI payment, Google Sheets integration, confirmation emails. V2 Spec added dedicated About the Chef, Naani Ghar, Barsaat pages. V3 added a full CMS so the owner can edit any content on any section from the admin dashboard.

## Architecture
- **Frontend**: React + Tailwind + Framer Motion + Shadcn UI + React Router
- **Backend**: FastAPI + Motor (async MongoDB)
- **DB**: MongoDB
- **Auth**: Custom JWT (admin)
- **Object Storage**: Emergent Object Storage (payment screenshots)
- **Emails**: Resend (live, dev-mode — only delivers to `reachbiraajo@gmail.com` until domain verified at resend.com/domains)
- **Google Sheets**: webhook configured; user is fixing the Apps Script "Who has access" setting on their side. Backend gracefully tolerates failures.

## What's Been Implemented

### 2026-06-28 — Site CMS (Edit Website)
- New page `/admin/edit` — side-panel form editor + live iframe preview
- Backend `site_content` collection with **draft** and **published** docs
- Endpoints: `GET /api/site-content?mode=published|draft` (public), `PUT /api/admin/site-content/draft`, `POST /api/admin/site-content/publish`, `POST /api/admin/site-content/discard`, `POST /api/admin/site-content/reset`
- Auto-save draft (600ms debounce). Publish copies draft → published. Discard reverts draft to published.
- Per-section visibility toggle (eye icon) — hides the entire section on the live site
- iframe loads pages with `?preview=draft` so admin sees the draft live
- **Wired to live data**: Hero, Newsletter, Contact, Footer
- **Editable in CMS but not yet wired to render**: About, Experiences, About the Chef, Naani Ghar, Barsaat (data is stored — components still render hardcoded copy until wired in a follow-up)
- Defaults seeded from `/app/backend/site_defaults.py`
- 41/41 pytest pass (+5 new CMS tests)

### 2026-06-28 — Booking Status, Nudge button, font polish, Resend live, V2 pages, Multi-step UPI flow
(Carried over — see CHANGELOG.md if it grows.)

## Pending / Backlog

### P1 — Wire remaining components to siteContent (next short follow-up)
- About.jsx, Experiences.jsx — read landing.about / landing.experiences
- AboutTheChef.jsx, NaaniGhar.jsx, Barsaat.jsx — read the respective top-level keys
- Once done, every CMS field actually shows on the public site

### P0 — User actions (still blocked on user)
- Google Sheets — redeploy Apps Script with "Who has access: Anyone" then send updated URL
- Verify a domain at resend.com/domains so emails can deliver to non-`reachbiraajo@gmail.com` recipients

### P2 — Future polish
- Add 1-character or shape validation on `PUT /admin/site-content/draft` payload (prevent corrupt drafts)
- Hero giant wordmark is currently hardcoded — expose it as `landing.hero.brand` in CMS if user wants
- ARIA-modal role on EventRegistrationModal
- WhatsApp/Telegram admin notification on new booking
- Split EditWebsite.jsx into smaller files if it grows further

## Test Credentials
See `/app/memory/test_credentials.md`.
