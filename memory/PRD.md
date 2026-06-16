# Biraajo by Vidip Shah — PRD

## Problem Statement (verbatim)
Build a premium personal chef landing page for a contemporary chef, culinary consultant, supper club host, and food entrepreneur (Biraajo by Vidip Shah). Mobile-first, premium luxury hospitality aesthetic, dark theme anchored to a candle-lit Indian supper-club reference image. Sections: Hero, About, Featured Experiences, Menu, Gallery (masonry + lightbox), Social/Instagram, Upcoming Events, Event Registration, Newsletter, Contact + Admin Dashboard. Instagram reference: https://www.instagram.com/biraajo_/.

## User Choices (from clarification)
- Display name: "Biraajo by Vidip Shah"
- Admin email: reachbiraajo@gmail.com
- Confirmation emails: SKIPPED for now (DB-only storage)
- Instagram: Styled grid linking to @biraajo_ (no API for v1)
- Contact: reachbiraajo@gmail.com · WhatsApp +91 93313 08405 · Instagram @biraajo_

## Personas
1. **Site visitor / future guest** — discovers Biraajo, reads story, reserves a seat at an upcoming supper.
2. **Brand / collaborator** — reaches out via contact form or WhatsApp for consulting/pop-up briefs.
3. **Vidip (admin)** — manages events, sees registrations, exports lists, curates gallery.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), JWT (bcrypt) admin auth seeded on startup.
- **Frontend**: React 19 + Tailwind + Framer Motion + Shadcn UI + Sonner toasts.
- **Routing**: `/` (landing), `/admin/login`, `/admin` (protected).
- **Storage**: MongoDB collections — `admins`, `events`, `registrations`, `subscribers`, `contacts`, `menus`, `gallery`.
- **Design system**: Cormorant Garamond display + Manrope body, dark garnet/crimson/terracotta palette with cream foreground, film-grain overlay, cinematic editorial layout (per `/app/design_guidelines.json`).

## Implemented (Feb 2026)
- Cinematic full-screen hero using the user-uploaded reference image with gradient/vignette overlays and editorial typography.
- About section with chef story + stats strip.
- Featured Experiences (6-card bento grid: Supper Clubs, Private Dining, Consulting, Pop-Ups, Brand Collaborations, Menu Development).
- Upcoming Events list with dynamic data, "Reserve my seat" modal form, seat counter, sold-out state, duplicate/overbook prevention server-side.
- Menu Section: 4 seeded courses (Amuse, Small Plates, The Main, Sweet Endings) with tab switcher and elegant card.
- Masonry Gallery with full lightbox (prev/next/close).
- Instagram styled grid linking to @biraajo_.
- Newsletter signup (deduped).
- Contact form + WhatsApp/Instagram/Email CTAs.
- Admin Dashboard: overview stats, events CRUD, registrations table + CSV export, newsletter list + CSV export, contact messages, gallery curator.
- Single admin seeded on startup from `.env`; JWT in Authorization header (localStorage `biraajo_admin_token`).

## Backlog
### P0 (deferred or polish)
- Confirmation emails for event registrations (Resend/SendGrid) — currently DB only.
- PDF menu upload + downloadable PDF on Menu section.

### P1
- Object storage upload for gallery & event images (currently URL-based add via admin).
- Real Instagram embed once Meta Business approval is granted.
- Rich text / Markdown for event descriptions.
- Per-event registration cap warning in admin dashboard.

### P2
- Payments for paid suppers (Razorpay / Stripe) — currently informational price only.
- Multi-language (English + Hindi/Marathi).
- Public testimonials section.
- SEO/OG metadata + sitemap.

## Test Credentials
See `/app/memory/test_credentials.md`.
