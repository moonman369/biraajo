# Biraajo — Changelog

## 2026-07-16
### Registration data-loss safety net (BUG FIX — verified iteration_26)
- Root cause: deleting an event `delete_many`'d all its registrations; manual deletes were also permanent. A booking could silently vanish.
- Fix: registrations are now ARCHIVED (moved to `registrations_archive`) instead of being erased, on both event deletion (`archive_reason=event_deleted:<title>`) and manual delete (`manual_delete`).
- New endpoints: `GET /api/registrations/archived`, `POST /api/registrations/{id}/restore` (re-books seats if event still exists).
- Dashboard: Registrations tab has an "Archived" toggle → recoverable panel with per-row "Restore".
- NOTE: The originally-lost registration lived on the PRODUCTION database (separate from preview `test_database`) and could not be recovered from the preview environment. This fix prevents all FUTURE loss.

### Website Traffic analytics (NEW FEATURE — verified iteration_26)
- Privacy-friendly, first-party, no cookies/no PII.
- Backend: `POST /api/analytics/track` (public; skips `/admin` paths; derives device from UA, maps referrer→source), `GET /api/analytics/summary?days=7|30|90` (admin).
- Frontend: `src/lib/analytics.js` + `AnalyticsTracker` in App.js (sendBeacon on route change). New "Traffic" tab in AdminDashboard with stat cards, daily chart, top pages, referrers, device breakdown, range toggle.
- Collection: `pageviews` (indexed on day/ts). Tracks from install date onward only.

## 2026-07-16 (later)
### Capacity 8 + off-site seats + merged Registrations (verified iter27, 9/9 backend)
- EVENT_CAPACITY 10 -> 8; startup migration forces seats_total=8 on all events. Off-site bookings already increment seats_booked, so direct + off-site now sum toward the 8-seat cap.
- Admin Registrations tab now merges direct registrations + off-site bookings (blue "Off-site · via <source>" badge; total shows "—"). Pending filter hides off-site rows.

### Pricing finalised: Veg ₹2,500 / Non-Veg ₹2,800
- Updated settings (DB) + code default PRICE_VEG=2500. Fixed hardcoded landing Events card prices (were ₹2,200/₹2,500 -> now ₹2,500/₹2,800). Barsaat/modal read prices from /api/settings. Backfilled 2 pending demo registration totals.

### Grammar & spacing cleanup
- 17 copy corrections applied to live DB site_content (published + draft): double spaces, "a a", "Going to back", its/it's, capitalization, "newfound", em-dashes, and stale "Twelve seats"/"ten people" -> "eight" to match 8-seat capacity.
- Updated 4 event description fields ("Twelve seats" -> "Eight seats"). Fixed frontend fallback copy (Hero/Barsaat/Suppers). Removed dead code line in _calc_total.

## 2026-07-16 (later)
### Added 3 Barsaat videos
- Uploaded 3 user videos to persistent object storage (biraajo/media/f20a..., da03..., 5fc8...), served via /api/media with 206 Range.
- Added to Barsaat reels (barsaat.reels.items, published+draft) and to the gallery collection. Verified rendering + 206 serving.

## 2026-07-16 (later)
### Veg price 2200->2500 on production (startup enforcement)
- Root cause: price is a DB-stored setting; production DB still held 2200 (code redeploy doesn't migrate DB data, and there is no admin price editor).
- Fix: startup now enforces settings.price_veg=PRICE_VEG(2500) & price_nonveg=PRICE_NONVEG(2800) on the existing settings doc (same pattern as seats_total=8). Verified: a simulated stale 2200 auto-corrects to 2500 on restart. Production fixes itself on next redeploy.

## 2026-07-16 (later) — Content now propagates to production via startup migrations
### Root cause of "changes not reflecting on production"
- Preview and production use SEPARATE databases. Earlier content edits (price, 3 Barsaat videos, grammar/copy, event descriptions) were written directly to the PREVIEW db, so a code-only redeploy never carried them to production. Object storage IS shared (video files were already reachable from prod).
### Fix
- Added idempotent, once-only startup migrations (tracked in `migrations` collection): `content_grammar_v1` (17 copy fixes + "Twelve seats"->"Eight seats" event descriptions) and `barsaat_videos_v1` (adds 3 videos to reels + gallery). Price/capacity remain enforced every startup.
- Verified by simulating a production-like DB (removed videos+markers, reverted a grammar string) then restarting: migration restored 11 gallery videos, 10 reels, corrected copy, and 2500/2800 pricing. Requires ONE redeploy to apply on production.

## 2026-07-16 (later) — Removed early-bird pricing
- Barsaat "Reserve your seat" price box: removed "Early-bird · first 10 seats" eyebrow and the "Pricing revises after the first ten seats..." footnote clause. Now shows flat Veg ₹2,500 / Non-Veg ₹2,800 + "Per seat, all-inclusive." Frontend-only (no DB dependency); applies on redeploy.

## 2026-07-25 — Menu pricing editor + live gallery uploads (verified iter28, backend 13/13)
- Admin Overview now has a "Menu pricing — per seat" editor (Veg / Non-Veg inputs + Save) via PUT /api/admin/settings. Prices persist across restarts (removed every-startup enforcement; replaced with one-time `pricing_final_v1` migration so admin edits stick). Added non-negative int validation.
- Public site reads prices live from /api/settings: Barsaat price box, Events landing cards (made dynamic), and booking modal.
- Gallery: new POST /api/admin/media upload endpoint (image/video -> object storage -> /api/media URL, 50MB cap). GalleryAdmin now uploads from device (images + videos), renders video tiles with a "Video" badge, and keeps the paste-URL option. Uploaded media appears live on the landing gallery.
- Known cosmetic: gallery video tiles show no poster/thumbnail until buffered.

## 2026-07-27 — 3 August Barsaat dates + gallery upload reconfirmed
- Added 3 upcoming Barsaat events via one-time migration `barsaat_aug_events_v1` (fixed ids, idempotent → appears on preview + production on redeploy): Lunch Aug 2 (13:00–15:30), Dinner Aug 7 (19:00–22:00), Dinner Aug 9 (19:00–22:00). 8 seats each, ₹2,500 veg / ₹2,800 non-veg (global settings), venue Biraajo House. Descriptions + Barsaat price footnote mention "Group discount available for parties of 4 or more."
- NOTE: the old Jul events are now past (server date 2026-07-27) so only the 3 Aug dates show as upcoming.
- Re-added lost `pricing_final_v1` migration (had reverted). Re-verified gallery upload endpoint POST /api/admin/media accepts images (200) + videos (200), rejects non-media (400); items render live on the gallery.

## 2026-07-27 (later) — Yaadein single-box redesign, event thumbnail upload, deploy prep
- Yaadein: consolidated the 4 "Work in progress" cards into ONE box (Events.jsx) — image + description + all 4 dates (with Lunch/Dinner labels + times) + subtle "Bookings open soon". Removed the WIP button/modal entirely. Used a fresh non-repetitive heritage-table image (hardcoded YAADEIN_IMG constant, no longer the Barsaat photo). Frontend-only; applies on redeploy.
- Admin Events form (AdminDashboard.jsx EventForm): added "Thumbnail image" section with live preview + "Upload from device" (reuses POST /api/admin/media). Lets admin change any event thumbnail (incl. each Barsaat card) without pasting a URL. Still supports Image URL paste. Changes go live on event Save.
- Final health check + cleanup (was pending from earlier): all services RUNNING; endpoints /events,/settings,/gallery = 200; media image GET 200; media video Range = 206 (iOS Safari OK). Purged 4 leftover TEST registrations (@example.com) from preview DB + recomputed seats_booked for all events; cleaned __pycache__. /tmp/biraajo_media_cache (30M) left intact (functional runtime cache).
- DEPLOY BLOCKER FIXED: PUBLIC_SITE_URL no longer hardcodes the preview URL. Added PUBLIC_SITE_URL to backend/.env (production domain) and updated the code fallback. deployment_agent re-scan = PASS (no blockers).

## 2026-08-05 — Retired Yaadein series + Aug 7 Barsaat; moved its 2 bookings to Aug 9
- Removed all 4 Yaadein events and the Barsaat Aug 7 event. Source defs updated (_YAADEIN_EVENTS=[], Aug 7 dropped from _BARSAAT_AUG_EVENTS) so fresh DBs never recreate them.
- New idempotent migration `retire_yaadein_aug7_v1`: reassigns Aug 7 registrations + offsite bookings to Aug 9 (barsaat-2026-08-09-dinner), deletes the Aug 7 event, deletes all yaadein-* events + their registrations, then recomputes Aug 9 seats_booked = active regs guests + offsite guests. Applies on preview now and on production at redeploy (production has the 2 real Aug 7 bookings → will show as 2 on Aug 9).
- Remaining Barsaat Aug dates: Aug 2 (concluded, server date is Aug 5) + Aug 9 (upcoming). Yaadein UI on landing page + dashboard auto-hides (no coming_soon events).

## 2026-08-05 (later) — Nav "Events" direct link, Move-booking feature, Karan Soni on Aug 9
- Navbar: "Events" no longer opens a dropdown; it links straight to the #events section (desktop + mobile). Removed dropdown state/refs/ChevronDown.
- Move booking feature: new backend endpoints POST /api/registrations/{id}/move and POST /api/admin/offsite-bookings/{id}/move (body {target_event_id}) — capacity-checked (8), decrements source + increments target seats_booked, updates event_id. Dashboard Registrations tab: added "Move" button per row + a modal with a target-date select (shows seats left). Works for both direct registrations and off-site bookings. Verified via curl both directions (seat math correct) + UI modal screenshot.
- Karan Soni: added as an off-site booking (fixed id offsite-karan-soni-aug9, 2 veg seats, source Direct) on Aug 9 via idempotent migration `karan_soni_aug9_offsite_v1`. Aug 9 now shows 2/8 booked. Applies to production on redeploy.

## 2026-08-05 (later) — Global newest-first ordering
- Events: backend GET /api/events now sorts by date DESC (was ASC) → latest date on top everywhere (landing Events section, admin, off-site). Barsaat page date list also flipped to newest-first.
- Bookings (registrations + off-site) already sort created_at DESC; gallery/pictures already created_at DESC — verified newest-on-top.
