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
