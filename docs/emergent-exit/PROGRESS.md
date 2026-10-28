# Emergent exit: progress

Plan: [plan.md](plan.md) (v3). Branch: `emergent-exit`, created from `feature/submergent` @ `6d77bbc` (`main` + one README commit).

| Phase | Status | Date | Commit | Gate evidence | Notes |
|---|---|---|---|---|---|
| A0 Scaffolding | Done | 2026-10-28 | this commit | See A0 below | |
| A1 Local run, unchanged | Gate failed, **deferred by owner** | 2026-10-28 | this commit | 95 pass / 47 fail / 3 skip; 27 failures are not storage. See A1 below | Tests to be fixed later |
| A2 Storage | Not started | | | | |
| A3 Strip Emergent (backend) | Not started | | | | |
| A4 Upgrade backend | Not started | | | | |
| A5 Dockerize | Not started | | | | |
| A6 Hand-off | Not started | | | | |
| B0–B6 Frontend | Not started | | | | After Part A is green |

---

## A0. Scaffolding

Changes:
- Tag `pre-emergent-exit` on `6d77bbc` (local, not pushed).
- `backend/.env.example` with the dummy values from plan A0. A local `backend/.env` was copied from it; that file is ignored.
- `.gitignore`: added `!.env.example` after `*.env`, plus `backend/.local-media/`.
- Root `docker-compose.yml`: `mongo:8.0` only, bound to `127.0.0.1:27017`, named volume. The backend service gets added in A5.
- `docs/emergent-exit/` (plan + this file) and `CLAUDE.md` committed.

Gate: **PASS**
```
$ git ls-files --error-unmatch backend/.env.example
backend/.env.example
$ git check-ignore -v backend/.env.example
.gitignore:88:!.env.example   backend/.env.example     (negated, so not ignored)
$ git check-ignore backend/.env
backend/.env
$ docker compose up -d mongo && docker compose exec -T mongo mongosh --quiet --eval 'db.runCommand({ping:1}).ok + " " + db.version()'
1 8.0.34
```

Decisions:
- I chose Mongo 8.0 for local dev, assuming Atlas runs 8.x. Check the Atlas major version at cutover and match it.
- `frontend/package-lock.json` (untracked before this work) was left alone. It belongs to Part B (B3 commits a lockfile).

Environment notes (Windows dev machine):
- Docker Desktop 29.6.1. It had to be started by hand.
- Python 3.12 is on PATH. A4 needs 3.13.
- `mongodump`/`mongorestore` are not installed. Use the `mongo` container (`docker compose exec mongo mongodump ...`) when needed.

---

## A1. Run locally, unchanged

Changes:
- venv (Python 3.12.4) with only the packages `server.py` imports, at the exact pins from `requirements.txt` (fastapi 0.110.1, motor 3.3.1, pymongo 4.5.0, bcrypt 4.1.3, ...). `emergentintegrations` and the litellm wheel were not installed; nothing imports them.
- `backend/tests/conftest.py`: loads `backend/.env`, aborts unless `DB_NAME` ends with `_dev`/`_test`, defaults `REACT_APP_BACKEND_URL` to `http://localhost:8000`.
- Tests: Emergent preview URL defaults replaced with `http://localhost:8000`; the `/app/frontend/.env` readers removed (iter27, iter28, iter29); the hardcoded admin email and password replaced with `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env` (7 files).

Evidence:
- Boot on an empty `biraajo_dev`: `GET /api/` → `{"status":"ok","name":"Biraajo API"}`. Admin seeded, **all 24 migrations applied** (`content_grammar_v1` … `barsaat_close_bookings_v1`).
- Guard: with `DB_NAME=biraajo`, pytest exits with `Refusing to run tests: DB_NAME ... is 'biraajo'; it must end with _dev or _test.`
- `pytest tests`: **47 failed, 95 passed, 3 skipped** (same result on two runs, ~10.5 min each).

Failure classification:

| Group | Count | Tests | Why |
|---|---|---|---|
| 1. Emergent storage (expected) | 20 | `test_media_range` (7 of 8), `test_media_compression` (5), iter28 upload image / video / gallery add (3), api `payment_screenshot_confirms`, `public_status_flips_to_confirmed_after_screenshot`, `payment_screenshot_succeeds_even_when_sheets_webhook_broken`, wtwe `upload_payment_screenshot`, iter14 `all_reel_urls_head_200_mp4` | `Storage not configured` / 500 from `/api/media`. iter14 also passes a relative URL to `requests.head` (a test bug). |
| 2. Stale against the current code | 11 | price 2200 / 4400 asserts (iter14, iter15, api `registration_creates_pending`, `resubmit_updates_pending`, `public_status_returns_full_shape`, `settings_exposes_prices`, `register_total_amount..._veg`), api `overbook_returns_400` (capacity is forced to `EVENT_CAPACITY = 8`, `server.py:1122`), wtwe title (`wtwe_rename_v1` renamed it), iter27 required/forbidden copy strings (2) | The tests encode older behaviour. They would fail on production too. |
| 3. Dated or production data | 15 | "upcoming Barsaat/Yaadein" events (iter14, iter15, iter29 ×4 incl. both confirmation-email tests, api `three_barsaat_events_present` and the `StopIteration` ones), iter14 hero image / reels = 7 / reel keys / gallery ids, api `gallery_seeded` and media_range `gallery_urls_are_relative` (seeded gallery has unsplash URLs) | The seeded events are July–Sept 2026, so in the past today (2026-10-28). Reels, gallery and hero values come from production edits, not from seeds. |
| 4. Needs external config | 1 | api `sheets_test_authorized_surfaces_failure` | Needs `GOOGLE_SHEETS_WEBHOOK_URL`. |

Gate wording: "all other tests pass". Groups 2–4 are not storage failures, so the gate **fails**. Nothing in the server code was changed to cause this; these tests also fail on the untouched code.

Side notes:
- Each request takes ~2 s because Windows tries `::1` first for `localhost` while uvicorn listens on 127.0.0.1. Not a bug; it only makes the suite slow.
- Tests mutate the dev DB (registrations, settings) and do not always clean up.

Decision (owner, 2026-10-28): proceed to Part B now; fix the tests later, once the new codebase is in place. Part A phases A2–A6 are not started yet. Part B runs against the original backend (Emergent storage not configured, so `/api/media` returns 500; B0 mocks `/api/media/**` anyway).

---

## Cutover list (needs real data / Cloudinary / live site)

Found during code scans. Each item is handled in plan Section 6.
- `backend/server.py:546` `_WTWE_IMG` = `customer-assets-gfyr7b9c.emergentagent.net/.../eofl6aqm_when.jpg`. Download it, re-host it under `biraajo/media/`, update references (C2). Do not change it before then.
- `test_reports/iteration_20/21.json` mention two more `customer-assets` images (`kpwk8ol3__DSC4913-2 (1).jpg`, `xw1h2s8n_IMG_0183 (3) (1).jpg`). They may be stored in production Mongo. `scripts/scan_emergent_refs.py` will confirm at C2.
- Media paths in code: **16** unique `/api/media/...` strings (the plan said 15; the extra one is `biraajo/gallery/cd7d617db6534131b7f07fa2eecd0b18.mp4`, `server.py:882`). Reproduce with:
  `grep -rhoE "/api/media/[A-Za-z0-9_./-]+" --exclude-dir=node_modules --exclude-dir=tests backend frontend/src | sort -u`
- Whether production applied all 24 `_run_migrations` ids (C1).
- Real iOS Safari video playback through the Cloudinary redirect (C3).
- Cloudinary folder mode / `asset_folder` (C3).

## Open questions
1. **A1 tests (deferred, not blocking).** How should the 27 non-storage failures be handled? Options:
   - (a) Update group 2 to the current code values. Mark groups 3 and 4 with pytest markers (`prod_data`, `needs_external`) that are deselected by default and run at cutover against a restored copy. Then rerun the gate. *(recommended)*
   - (b) Delete the one-off iteration snapshot tests (`test_barsaat_iter14`, `test_iter15`, `test_iter27`, `test_iter29`) and fix the rest as in (a).
   - (c) Accept them as known failures and change the gate wording.
