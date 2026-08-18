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
- **2026-08-18 (menu corrections + Abhav Ke Bhav story)** Corrected 4 Barsaat menu discrepancies against the user's real printed menu poster (Khicchu note, Corn Chaat pairing, Sev Ussal "pork belly", and the final course is "Chini Ka Parantha" not "Caramelised Malai Toast") via migration `barsaat_menu_correction_v1`. Confirmed via video that the existing Naani Ghar menu is already 100% accurate — no changes made. Built out the full "Abhav Ke Bhav" concept story on `/supper-club/when-there-wasnt-enough`: new Concept Statement, Story & Inspiration, and "The Questions" (4 guiding questions) sections added between the poster hero and the existing dates/chef-note/idea/closer sections, via migration `wtwe_concept_story_v1`. Verified by testing_agent iteration_33 — 100% pass, no regressions.
- **2026-08-18 (events archive)** Restructured Events navigation into a concept archive: Navbar "Events" now routes to new `/events` page listing all 3 chapters in reverse-chronological order (Abhav Ke Bhav → Barsaat → Naani Ghar), each linking to its dedicated story page. Homepage's upcoming-dates section preserved intact, with a new "See past chapters" link added. Enriched Barsaat page (Gujarat/Rajasthan heritage + Bengali influence copy, richer Rajneesh soundscape section — tin roof rain, train announcement→house music, tempo shifts, spice-driven energy) and Naani Ghar page (new chef's-note + 3-pillar "concept" section: homecoming, memory, transformation) — menus on both pages left untouched (already correct in DB). Synced via migration `concept_pages_restore_v1`. Verified by testing_agent iteration_32 — 100% frontend pass.
- **2026-08-18 (final)** Hero section rebuilt as a dedicated "poster reveal" — the exact cover composition (nail, hanging bag, baked-in title text) is now shown centered and uncropped (object-contain, no crop), with a short CMS-editable "concept" teaser line above it and the longer body copy below. No title duplication since the poster already carries the name/tagline. New CMS field `wtwe.hero.concept`, synced via migration `wtwe_hero_concept_v1`.- **2026-08-18 (brand fix)** Corrected series branding to match the user's actual cover asset: name is "Abhav Ke Bhav" (Roman script, not Devanagari — earlier guess was wrong), tagline "When there wasn't enough" rendered as tracked uppercase caps (not italic script) to mirror the real poster typography. Real cover photo (plastic bag on a wall, `when.jpg` from user upload) now used as the hero image and on the `/menus`/`/suppers` cards, replacing the Unsplash placeholder — removed the redundant HTML title overlay on those cards since the photo already has the name baked in. Synced via migration `wtwe_brand_fix_v1`.
- **2026-08-18 (latest)** Hindi rename extended to event data: `wtwe-*` event titles/tags now show "अभाव के भाव — Lunch/Dinner (date)" and tag "अभाव के भाव" (via idempotent migration `wtwe_rename_events_v1`). Event IDs/routes still unchanged. Frontend event-matching on the story/menu pages switched from an English-text regex to `event.id.startsWith("wtwe-")` — now language-independent and won't break if the display name changes again.
- **2026-08-18 (later still)** Series renamed to "Abhaav ke bhaav" (अभाव के भाव, Hindi) with "When there wasn't enough." demoted to the hero/menu tagline — updated on hero, menu page, and the /menus + /suppers cards, via idempotent migration `wtwe_rename_v1`. Backend event ids/tags/routes kept unchanged (`wtwe-*`, `/menus/when-there-wasnt-enough`) to avoid breaking booking regex matches.
- **2026-08-18 (later)** WTWE menu course stories added (each dish now has a short backstory: fermented ragi drink, snail cromesquis, potato-gnocchi rebellion, Ladakhi-inspired rice gruel, missi roti, hilsa-head/banana-stem umami mains, grape ceviche, sweet potato payasam) via new idempotent migration `wtwe_menu_notes_v1`. **Bug fix**: `BarsaatMenu.jsx`/`Suppers.jsx` "Reserve" buttons had a `match || list[0]` fallback that — now that all Barsaat dates have lapsed — was silently booking guests into a "When There Wasn't Enough" event instead. Fixed to `match || null` (shows "no seats open" instead of misrouting to the wrong series).
- **2026-08-18** Automatic group discount: 20% off any booking of 4+ seats, across all series. Editable from Admin → Overview (next to price fields). Verified by testing_agent iteration_31 — 100% pass.
- **2026-08-18** New event series "When There Wasn't Enough" — 5 real bookable events (Lunches Aug 23/Sep 6/Sep 13, Dinners Aug 30/Sep 11), flat ₹2,800 for both veg & non-veg. Full immersive story page (`/supper-club/when-there-wasnt-enough`: hero, dates+reserve, chef quote, "The idea" 3-pillar section, closer) + menu page (`/menus/when-there-wasnt-enough`: 8 courses, veg variants on Starter/Rice/Dal/Main only). Added as 3rd card on `/menus` and `/suppers`. Backend: `Event` model now supports optional `price_veg`/`price_nonveg` per-event override (falls back to global `/api/settings` pricing when absent) — Barsaat/Naani Ghar unaffected. Admin: Events tab has veg/non-veg price inputs, Menu tab has a 3rd series editor, CMS (`/admin/edit`) has a `wtwe` schema group. Verified by testing_agent iteration_30 — 100% backend + frontend pass, 0 blocking issues.
- **2026-07-16** Capacity set to 8 (direct + off-site sales both count toward it); admin Registrations tab now merges direct + off-site bookings. Pricing finalised Veg ₹2,500 / Non-Veg ₹2,800. Site-wide grammar/spacing cleanup + stale "twelve seats" copy fixed. See CHANGELOG.md.
- **2026-07-16** Website Traffic analytics (first-party, no cookies): `POST /api/analytics/track`, `GET /api/analytics/summary`, "Traffic" tab in dashboard. See CHANGELOG.md.
- **2026-07-16** Registration data-loss safety net: archive-on-delete + Restore. Deleting events/bookings no longer erases guest data (`registrations_archive`, `GET /api/registrations/archived`, `POST /api/registrations/{id}/restore`). See CHANGELOG.md.
- **[2026-07] Media compression — VERIFIED (iteration 24)**: Compressed all 16 media assets in place (same /api/media paths, no DB/code changes). Videos re-encoded to iOS-friendly H.264 yuv420p with +faststart (moov at front), max 1280px; images resized to max 1920px JPEG q80. Total media 186.7MB → ~13.7MB (~88% smaller); hero video 22MB → 0.85MB, largest 42.9MB → 1.44MB. Faststart also improves iOS/mobile playback. Local media cache cleared. Requires redeploy for production.

- **[2026-07] iOS hero broken-image fix — VERIFIED (iteration 23)**: On iPhone (Chrome/WebKit) the hero image showed for a second then turned into a broken question-mark box. Cause: Hero.jsx overlaid a `<video>` (with the image as its `poster`) on top of the real `<img>` (which was hidden at `-z-10`); when the video failed to autoplay on iOS, WebKit swapped the poster for the native broken-media icon. Fix: `<img>` is now the always-visible base layer; the `<video>` has no `poster` and fades in (opacity 0→100) only after `onCanPlay`, staying hidden on error. Video failure can no longer blank the hero. Requires redeploy for production.

- **[2026-07] iOS media fix — VERIFIED (iterations 20-22, 100%)**: iOS devices showed all images/videos as broken (black + question mark) because media was hosted on the external customer-assets CDN and iOS Safari requires HTTP Range (206) responses for <video>. Fix: (1) re-hosted ALL media (images+videos) to the app's own object storage; (2) added `GET /api/media/{path}` backend endpoint that caches assets locally and serves proper 206 Range / 200 Accept-Ranges responses; (3) rewrote every stored reference (gallery, site_content draft+published, events.image_url, code, site_defaults.py, 25 history snapshots) to same-origin /api/media/... . Zero customer-assets refs remain anywhere. NOTE: requires redeploy for production to get the /api/media endpoint + rebuilt frontend.
- **[2026-06] Capacity fixed at 10 & customer emails cancelled**: EVENT_CAPACITY=10 enforced server-side on create/update and in all seat checks (guest + off-site); admin seats field locked to 10. Customer welcome/confirmation emails disabled (admin notifications retained).

- **[2026-06] ScrollToHash cross-page nav FIXED & VERIFIED (iteration_19, 100% pass)**: Navbar "Gallery"/"Reach out" links now reliably route from sub-pages (e.g. /supper-club/barsaat) to '/' and scroll to #gallery/#contact. Replaced fixed 800ms settle with a ResizeObserver-driven re-scroll loop (3s window) in App.js + guarded 80ms scroll-to-top to avoid the pathname-before-hash race. 4/4 desktop + 4/4 mobile stability sweeps pass.


### 2026-07-01 — Barsaat page reorg + 5 new reels in gallery & page
- **Layout reorg**: Dates + Reserve block moved to the TOP of `/supper-club/barsaat` (was at bottom). New order: Hero → Dates → Chef's note → Sensory → Rajneesh → Reels → Closer.
- **5 new "Barsaat test run" MP4s** uploaded by user, now:
  - Added to the Gallery (12 total items) with captions
  - Added to the Barsaat page reels grid (7 total reels — 5 new + 2 existing), responsive 4-column grid on desktop
- **Hero image regression** patched again — the previous testing-agent restore round-trip had reverted `barsaat.hero.image` to the broken kpwk8ol3 URL; re-patched to the working ctn50bz1 URL.
- Verified by testing_agent iteration_14 → 0 issues, all pytest and Playwright checks pass.


### 2026-06-30 (later) — Black-image fix + new Barsaat reel
- ROOT CAUSE of "2 black screens": the artifact URL `kpwk8ol3__DSC4913-2 (1).jpg` under `job_feast-studio-1` returns HTTP 403. It was used as `barsaat.hero.image`, `landing.experiences.cards[0].image`, `naani_ghar.photos_block.photos[0]` and hardcoded in `Suppers.jsx`.
- FIX: replaced everywhere with the working alternate `ctn50bz1__DSC4913-2 (1) (1).jpg` (200 OK) via CMS publish + `site_defaults.py` + `Suppers.jsx` hardcoded path.
- Also swapped the unreliable Unsplash placeholder in `InstagramFeed.jsx` with a verified Biraajo artifact.
- NEW REEL added to Barsaat page: `barsaat.reels.items[]` now stores an array of `{url, label}`. The Barsaat page renders a 2-up reel grid: "Behind the menu" (new `pampvqbe_Barssat Reel 2.MP4`) + "On the line" (existing reel). Defaults updated so reset preserves both.
- Verified by testing_agent iteration_13: 0 broken images, 0 4xx artifact responses, both reels load (readyState ≥ 2), regression OK.


### 2026-06-30 (later still) — Save-failure rescue: localStorage backup + auth-expiry modal + Save now
- ROOT CAUSE: user's autosave in /admin/edit was silently 401-ing when the JWT session expired mid-edit. Frontend showed "changes not saved" but never actionable.
- FIX shipped & verified by testing_agent iteration_12 (no issues):
  - Every keystroke now backs up content to `localStorage['biraajo_unsaved_draft']`; cleared on successful save
  - On 401 the auth-expired modal opens; logging back in immediately pushes the in-memory content to the server
  - "Save now" button next to Publish forces an immediate save
  - On page load, if a local backup exists, a recovery banner offers Restore / Discard
  - `window.__biraajoDumpDraft()` exposed in console for emergency JSON download


### 2026-06-30 (late) — CMS data-loss safety net + Off-site sales tab
- **DATA-LOSS BUG ACKNOWLEDGED**: testing-agent calls + seed script overwrote the user's CMS edits during prior iterations. No backups existed (standalone Mongo, no oplog).
- **Safety net (now live)**:
  - Auto-snapshot on every publish, every reset and every restore (collection `site_content_history`, capped at 50 most recent)
  - New endpoints: GET `/api/admin/site-content/history`, GET `/history/{id}`, POST `/restore/{id}`
  - Reset now requires `{confirm: true}` body — silent test calls return 400
  - New CMS UI: "Version history" button in `/admin/edit` toolbar → modal listing snapshots with one-click restore
- **OFF-SITE SALES TAB (new admin feature)**:
  - Backend collection `offsite_bookings` + POST/GET/DELETE `/api/admin/offsite-bookings`
  - Creating/deleting an off-site booking atomically increments/decrements `event.seats_booked`
  - New Admin Dashboard tab "Off-site sales" with form (date, guest name, guests, preference, source/aggregator, contact, notes) and per-event grouped table view
  - Public Barsaat date cards reflect off-site bookings in real time
- testing_agent iteration_11 → 59/60 pytest pass (only pre-existing Google Sheets test fails, out of scope), zero critical/UI issues


### 2026-06-30 (later) — Barsaat immersive experience page + 3 dates + critical menu-default fix
- **New `/supper-club/barsaat`** page rebuilt as a multi-sensory story:
  - Hero with refreshed copy ("A supper with the rain")
  - Chef's signature quote
  - "Not just dinner. A monsoon, indoors." — sensory journey: Sight & space / Sound / Smell (camphor + vetiver)
  - "The soundscape, by Rajneesh" — full collaboration narrative (sound designer credit)
  - 3-date picker: Sun 5 Jul, Sat 18 Jul, Sun 26 Jul 2026 — 12 seats each, "Selected"/"Choose" interaction, with selected date passed to EventRegistrationModal
  - Early-bird pricing box: Veg ₹2,200 · Non-veg ₹2,800 (user will raise to ₹2,500 / ₹3,000 after first 10 seats)
- **Backend pricing now configurable** via /api/settings (price_veg + price_nonveg). _calc_total reads from settings; EventRegistrationModal and Barsaat page read them too.
- **Hero "Reserve a seat"** now navigates to /supper-club/barsaat#dates so guests pick which date; "Pull up a chair" still opens modal directly.
- **3 Barsaat events created** in DB; old single Barsaat event removed.
- **All test registrations cleared** — ready for live customer influx.
- **CRITICAL DATA-LOSS FIX**: `barsaat.menu` (10 courses + 4 veg variants) added to `site_defaults.py` so any admin "Reset to defaults" no longer wipes it. Verified by testing agent (iteration_10).
- **Google Sheets** webhook env cleared per user request; backend silently no-ops.
- **Cosmetic fix**: /api/sheets/test now always includes `webhook_url` field (empty string when not configured) — addresses pre-existing pytest assertion.


### 2026-06-30 — Barsaat menu seeded with veg/non-veg variants
- Seeded 10-course Barsaat monsoon menu via CMS draft+publish (Khicchu → Caramelised Malai Toast)
- 4 courses (Panko Bombay Duck, Thepla Tacos, Dal Bhaat, Sev Ussal) include a vegetarian alternative — rendered as a minimal "VEGETARIAN" sub-block under each non-veg dish on `/menus/barsaat`
- New menu intro line + custom title ("Ten courses, a monsoon told in plates.") wired through CMS so user can edit
- Admin → Menu editor extended with `alt_dish` and `alt_note` fields so the user can manage veg variants going forward


### 2026-06-28 — Admin menu CRUD + About CTA modal + UPI QR
- **Admin → Menu tab**: rebuilt to manage per-series menus (Naani Ghar + Barsaat) via site_content. Add, edit, reorder (↑↓), delete courses — saves and publishes instantly. Old `/api/menu` editor retired.
- **About "Pull up a chair"** CTA now opens the EventRegistrationModal directly (was an anchor to #events). Same Barsaat pre-book flow as Hero and Suppers.
- **UPI QR Code** on payment step — both `EventRegistrationModal` (booking flow step 2) and `BookingStatus` (public pending payment) now show Vidip Shah's Google Pay QR. UPI ID + copy button retained as fallback. Bypasses the ₹2,000 UPI ID transaction limit.
- **`/menus/barsaat`** now renders menu items if admin adds them (otherwise still shows "Work in progress" + Book now).


### 2026-06-28 — Menu nav restructure: per-series menu pages
- Removed AI-generated MenuSection from landing page (the 2 random dishes block is gone)
- Navbar "Menu" link now routes to a new **`/menus`** chooser page (Naani Ghar / Barsaat cards)
- New **`/menus/naani-ghar`** page — menu courses only, ends with a disabled **"Series has been concluded"** button
- New **`/menus/barsaat`** page — "Work in progress" placeholder with functional **"Book Now"** CTA opening the EventRegistrationModal (pre-book flow with disclaimer)
- Hero "See the menu" button now also points to `/menus` (was `/suppers`)


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

## Deployment note (2026-08-18)
Deployment readiness scan flagged the `retire_yaadein_aug7_v1` migration (server.py, on-startup) as "destructive" since it deletes the old Aug 7 Barsaat event + all `yaadein-*` placeholder events on first run against a DB where it hasn't applied yet. This is **intentional** — it's the exact migration the user approved in a prior session to retire the Yaadein placeholder series and reassign its 2 real Aug 7 bookings to Aug 9 before redeploying. It is idempotent (gated by `db.migrations`) and safe to ship. Do not remove it without the user's explicit confirmation that production has already synced.
