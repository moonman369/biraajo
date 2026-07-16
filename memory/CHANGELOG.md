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
