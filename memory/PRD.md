# Biraajo by Vidip Shah — PRD

## Original Problem Statement
Premium personal chef landing page for "Biraajo by Vidip Shah" — dark, luxury hospitality aesthetic, mobile-first, visually immersive. Sections: Hero, About, Experiences, Menu, Gallery, Events with internal Registration System, Newsletter, Contact. Admin Dashboard. Dynamic events CRUD, event booking with UPI payment, Google Sheets integration, confirmation emails. V2 Spec added dedicated pages for About the Chef, Naani Ghar (past supper), Barsaat (upcoming supper).

## Architecture
- **Frontend**: React + Tailwind + Framer Motion + Shadcn UI + React Router
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: Custom JWT (admin only)
- **Object Storage**: Emergent Object Storage (payment screenshots)
- **Emails**: Resend (live, dev-mode — verified senders only deliver to `reachbiraajo@gmail.com` until a domain is verified at resend.com/domains)
- **Google Sheets sync**: webhook URL set; Apps Script needs `doPost(e)` (see snippet at end)

## What's Been Implemented

### 2026-06-28 — V2 Spec + Real Email Sending
- Real Resend integration replacing previous stub. `send_welcome_email` fires on registration; `send_confirmation_email` fires on payment screenshot upload. Both use a branded dark HTML email template (`_email_shell`). Non-delivery logs warn-level only (non-blocking).
- New page: **About the Chef** (`/about-the-chef`) — chef portrait hero, two chapter blocks (early years + Switzerland), philosophy quote, "Today" section with CTAs to Barsaat & Naani Ghar.
- New page: **Naani Ghar** (`/supper-club/naani-ghar`) — past supper showcase, 6-course menu listing, 4-photo gallery, closer with CTA to Barsaat.
- New page: **Barsaat** (`/supper-club/barsaat`) — upcoming supper page that auto-fetches the next event, embeds the user's reel video, 3-note feature grid, Reserve CTA opens the multi-step EventRegistrationModal.
- Navbar restructured: STORY · ABOUT THE CHEF · EXPERIENCES · EVENTS (dropdown with All upcoming · Barsaat · Naani Ghar) · MENU · GALLERY · REACH OUT. Mobile menu has the same dropdown.
- Hash links (`#about`, `#menu`, etc.) auto-prefix with `/` when not on the landing route so deep-linking from subpages works.
- Gallery cleaned: deleted 10 stock unsplash images; kept 7 real customer-asset photos and videos.

### 2026-06-27 — Multi-step Reservation + UPI Payment + Admin Filter
- Multi-step EventRegistrationModal (Details → UPI Payment → Confirmed)
- Calculates total = guests × menu price (₹2,200 veg / ₹2,500 non-veg)
- UPI ID **vidipshah14-1@oksbi**, deep-link `upi://pay?…` opens UPI app on mobile
- Mandatory payment screenshot upload to Emergent Object Storage
- Registration model: `total_amount`, `payment_status`, `payment_screenshot_path`, `payment_confirmed_at`, `welcome_email_sent`
- Re-submission of same email/event updates the pending record
- Admin dashboard: Status badge column + filter (Confirmed / Pending / All), Total column, View Receipt, WhatsApp Nudge, Delete (releases seats), CSV export honours filters, Overview shows Confirmed/Pending/Revenue stats

### Earlier work (carried over)
- Hero, About, Experiences, Menu, Gallery, Events, Newsletter, Contact, Footer
- Admin login + Events/Newsletter/Contacts/Gallery CRUD
- Burgundy CTA colour, V1 copy revisions

## Pending / Backlog

### P0 — User actions to unlock full email delivery
- **Verify your domain at resend.com/domains** (e.g., biraajo.com) → update `RESEND_FROM_EMAIL` in `/app/backend/.env` to `Biraajo <hello@yourdomain.com>`. Until then, Resend dev mode only delivers to your verified address.

### P0 — Google Sheets `doPost` snippet (paste this into your Apps Script)
```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const body = JSON.parse(e.postData.contents);
  const row = [new Date(), body.type, JSON.stringify(body.data)];
  sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}
```
Then redeploy ("Manage deployments" → edit → New version).

### P1 — Content cleanup / authoring
- Create real upcoming Barsaat event via Admin (title="Barsaat", tag="Barsaat" or "Monsoon" so the page picks it up specifically)
- Add real photos + copy for About the Chef / Naani Ghar via Admin if desired

### P2 — Future
- Admin notification on new booking (WhatsApp via Twilio or Telegram Bot)
- "Nudge all pending" one-click button in admin
- ARIA-modal role on EventRegistrationModal for accessibility

## Key API Endpoints
- `POST /api/auth/login`
- `GET /api/events` · `POST /api/events/{id}/register`
- `POST /api/registrations/{id}/payment-screenshot`
- `GET /api/registrations?payment_status=…&event_id=…` · `DELETE /api/registrations/{id}` · `GET /api/registrations/export`
- `GET /api/registrations/{id}/screenshot` (admin)
- `GET /api/stats` (includes confirmed/pending/revenue)

## Test Credentials
See `/app/memory/test_credentials.md`.
