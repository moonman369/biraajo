# Biraajo: Emergent exit, final plan (v3)

Date: 2026-10-28. Repo: `moonman369/biraajo`. Suggested location in the repo: `docs/emergent-exit/plan.md`.
Replaces v2 and `biraajo-migration-plan.md`.
Versions were checked on npm and PyPI on 2026-10-26 and 2026-10-28. The prompts tell the agent to re-check at run time.

**What changed in v3:** no production data or live-site access is needed to start. The agent builds and tests everything against a local Mongo and a dummy Cloudinary connection. All steps that need real data, real Cloudinary or the live site moved to Section 6 (Cutover), which you run by hand later.

---

## 1. Decisions locked

| Topic | Decision |
|---|---|
| Repo layout | Monorepo kept. `backend/` and `frontend/` deploy separately. |
| Backend host | Oracle VM, Docker, behind the existing Nginx + SSL. Docker exists **only** in `backend/` (plus compose files). |
| Frontend host | Vercel, root directory `frontend`. No Docker. |
| Database | MongoDB Atlas in prod, local Mongo container in dev. |
| Media storage | **Cloudinary only** in prod. No GridFS. Replaces Emergent object storage. |
| Dev and test storage | `STORAGE_MODE=local` (files on disk) plus a mocked Cloudinary SDK in unit tests. No real Cloudinary account needed until cutover. |
| Payment screenshots | Cloudinary `authenticated` delivery (private). See section 2. |
| Media URLs | Stay `/api/media/<path>`. In prod the backend redirects to Cloudinary. No stored URL is rewritten. |
| Frontend tooling | CRA to Vite. Prune dead code first. Tailwind 4 last, with fallback to 3.4.17. |
| UI | Must not change, except the browser tab title and meta description. |

## 2. Cloudinary: what to watch

1. **Payment screenshots are private data** (names, UPI details, phone numbers). A normal Cloudinary upload is a public URL, so they go in as `type="authenticated"`. The admin route keeps returning bytes with the admin JWT, because `AdminDashboard.jsx` fetches them with an `Authorization` header and builds a blob. A redirect could break that cross-origin.
2. **Public media** uploads as normal public assets, `public_id` = existing path without extension, so every `/api/media/biraajo/...` string already stored in Mongo keeps working.
3. **Media Library layout** is why the owner likes Cloudinary. [Likely] Newer accounts use "dynamic folders", where the `public_id` path does not create a visible folder. At cutover, check the account's folder mode and set `asset_folder` if needed, so `biraajo/media`, `biraajo/gallery`, `biraajo/payments` show as folders.
4. **Free-plan limits** (Cloudinary pricing doc): 25 credits a month shared across storage, bandwidth and transformations; max 10 MB per image, 100 MB per video. The backend's 50 MB cap works for video. An image over 10 MB must fail with a clear 400.
5. **iOS Safari video:** the old code built its own 206 range server because Emergent storage returned only 200. [Likely] Cloudinary's CDN handles ranges, so a redirect should work. **Untested until cutover** (Section 6). Fallback: the backend streams from Cloudinary and forwards the `Range` header.
6. Cloudinary's Python SDK is synchronous. Calls go through `asyncio.to_thread`.

## 3. What "dummy" means (so the agent does not guess)

- **Mongo:** a local container, empty database `biraajo_dev` (tests: `biraajo_test`). The app seeds its own admin, gallery, menu and runs its startup migrations on first boot. That gives a realistic-looking site, not your production content.
- **Cloudinary:** `CLOUDINARY_URL=cloudinary://dummy:dummy@dummy-cloud` and `STORAGE_MODE=local`. In local mode, uploads write to `backend/.local-media/` (git-ignored) and `/api/media/<path>` serves them with the existing 206 range code. Unit tests mock the Cloudinary SDK, so no network call is made.
- **Media in dev:** images and videos that the seed data references do not exist locally. Visual tests mock `**/api/media/**` in Playwright with the same fixed placeholder files for every run.
- **In prod** (`STORAGE_MODE=cloudinary`), the app must refuse to start if `CLOUDINARY_URL` is missing.

## 4. Rules for both parts

- Work on branch `emergent-exit`. One commit per phase, message names the phase.
- Keep `docs/emergent-exit/PROGRESS.md` (create it first if missing): one row per phase with status, date, commit, gate evidence, notes. Update it in the same commit as the phase.
- A gate is pass or fail. If a gate fails, stop and report. Do not move on, do not work around it.
- No new features, no refactors, no redesign. Out of scope: splitting `server.py`, TypeScript, fixing the Google Sheets 405, Resend domain, the seat-count race (reads then `$inc` separately). If touched by accident, mention it in the report, never fix it silently.
- Never commit secrets, dumps, media or screenshots. `.gitignore` has `.env.*`, which also ignores `.env.example`, so add `!.env.example`.
- Keep every `data-testid` unchanged.
- Tests must never run against real data. `conftest.py` reads `DB_NAME` from `backend/.env` and aborts unless it ends with `_dev` or `_test`.
- Scripts are written in Python or Node, not bash-only, because the repo is worked on from Windows.
- **Do not delete the startup migrations** (`_run_migrations`, 24 ids). Whether they are all applied in production is unknown until cutover. See Section 6, step C1.
- On a fresh database those migrations insert some real content, including a named off-site booking. That is fine for dev; never carry a dev database's data into production.

## 5. Order

1. **Part A** (backend) in full.
2. **Part B** (frontend) after A is green.
3. **Section 6 (Cutover)** by hand, when you have the dump, Cloudinary account, Atlas and domains.

---

# PART A: Backend

## A0. Scaffolding
- Tag the current commit `pre-emergent-exit`. Create branch `emergent-exit`. Create `docs/emergent-exit/PROGRESS.md`.
- `backend/.env.example` with dummy values:
  ```
  MONGO_URL=mongodb://localhost:27017
  DB_NAME=biraajo_dev
  JWT_SECRET=dev-only-change-me
  ADMIN_EMAIL=admin@example.com
  ADMIN_PASSWORD=dev-only-change-me
  PUBLIC_SITE_URL=http://localhost:3000
  CORS_ORIGINS=http://localhost:3000
  UPI_ID=
  STORAGE_MODE=local
  CLOUDINARY_URL=cloudinary://dummy:dummy@dummy-cloud
  # optional: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_REPLY_TO, GOOGLE_SHEETS_WEBHOOK_URL
  ```
- Local Mongo container via a root `docker-compose.yml` (finalised in A5).
- Gate: `.env.example` is tracked, `.env` is ignored, Mongo container starts.

## A1. Run locally, unchanged
- Python venv, original code, local Mongo. Boot once. Fix tests to default to `http://localhost:8000` and stop reading `/app/frontend/.env`. Add the `conftest.py` DB-name guard.
- Tests that need Emergent storage are expected to fail here. List them in PROGRESS.md.
- Gate: server boots on a fresh DB, seeds and migrations run, all other tests pass.

## A2. Storage: Cloudinary in prod, local files in dev
- Add a small `backend/storage.py` with four functions: `put_public(path, data, content_type)`, `put_private(path, data, content_type)`, `get_private(path)`, and the public read path used by `/api/media`. Two backends chosen by `STORAGE_MODE`. This is the only new module; `server.py` just calls it.
- **Cloudinary backend:** `cloudinary` SDK, config from `CLOUDINARY_URL`.
  - `POST /api/admin/media`: `resource_type="auto"`, `public_id` = `biraajo/gallery/<uuid>`, `overwrite=True`. Return `{"url": "/api/media/biraajo/gallery/<uuid>.<ext>", ...}`, same shape as today.
  - `POST /api/registrations/{id}/payment-screenshot`: `type="authenticated"`, `public_id` = `biraajo/payments/<reg_id>/<uuid>`. Keep storing the path string in `payment_screenshot_path`.
  - `GET /api/media/{path}`: map extension to `video` (mp4, webm, mov, m4v) or `image`, then redirect to `https://res.cloudinary.com/<cloud>/<type>/upload/<public_id>.<ext>` with `Cache-Control: public, max-age=31536000, immutable`. Return 404 for any `biraajo/payments/` path.
  - `GET /api/registrations/{id}/screenshot` (admin only): signed URL, fetch bytes with `httpx`, return them with the right content type. Same response as today.
  - Image over 10 MB: 400 with a clear message. Video cap stays 50 MB.
- **Local backend:** same functions write to `backend/.local-media/`. `/api/media` serves from there using the existing 206 range-slicing code (keep that code for this mode). Payments are stored under a private subfolder and only served by the admin route.
- Remove: `STORAGE_URL`, `EMERGENT_LLM_KEY` use, `init_storage`, the `/tmp` cache, and the `requests` runtime dependency.
- Add `scripts/import_media_to_cloudinary.py` (used at cutover). It reads a folder of downloaded files plus a manifest, uploads each with the same `public_id` (payments as `authenticated`), is safe to re-run, then checks every file returns 200 and the byte size matches. Test it with a 3-file fixture folder and a mocked SDK.
- Add `scripts/scan_emergent_refs.py` (used at cutover). It walks every string in every collection of a given database and lists any containing `customer-assets`, `emergentagent`, `emergent.host` or `emergent.sh`. `server.py:546` (`_WTWE_IMG`) is one known hit in code; list it, do not change it yet.
- Add `scripts/smoke_cloudinary.py` (used at cutover, needs real credentials). It uploads a tiny public image and a tiny authenticated image, fetches both the way the app does, checks the redirect URL and the signed fetch, then deletes them.
- Update `test_media_range.py` and `test_media_compression.py` to work in local mode. Add unit tests with a mocked SDK: `public_id` format, `type="authenticated"` for payments, extension to resource-type mapping, redirect URL, 404 for payments path via `/api/media`, 10 MB image rejection.
- Gate: all tests pass in local mode and with the mocked SDK; upload then fetch round-trips for image, video and payment screenshot in local mode; payment path is not reachable without admin; app refuses to start with `STORAGE_MODE=cloudinary` and no `CLOUDINARY_URL`.

## A3. Strip Emergent from the backend
- Delete `emergentintegrations`, the `litellm` wheel and every package the code does not import. `requirements.txt` becomes direct dependencies only, exact versions.
- Replace the `PUBLIC_SITE_URL` default (`chef-luxury-preview.emergent.host`) with `http://localhost:3000`.
- Delete `.emergent/`, `.gitconfig`, `memory/`, `test_reports/`, `test_result.md`, `tests/__init__.py`. Replace `README.md`.
- Leave `_WTWE_IMG` and the migrations untouched (see rules).
- Gate: `grep -ri emergent` over backend code and config returns only the `_WTWE_IMG` line, which is listed in PROGRESS.md as a cutover item.

## A4. Upgrade the backend
- Python 3.13. Target versions (re-check at run time): fastapi 0.162.0, uvicorn 0.54.0, pymongo 4.19.0, pydantic 2.14.1, email-validator 2.3.0, python-dotenv 1.2.4, PyJWT 2.15.1, bcrypt 5.0.0, httpx 0.28.1, resend 2.50.0, python-multipart 0.0.32, cloudinary 1.46.3. Dev: pytest 9.1.1, requests.
- Motor to PyMongo Async: `AsyncMongoClient`, `await` every `aggregate()` (3 places outside the migrations block, 2 more inside it), `await client.close()`.
- Replace `@app.on_event` with a lifespan handler.
- bcrypt 5 rejects passwords over 72 bytes. Test a long admin password.
- Gate: all tests pass. Manual run of a full booking in local mode: register, upload screenshot, admin views screenshot, confirm, move, delete, restore. Sheets and email fail soft when not configured.

## A5. Dockerize (backend only)
Files: `backend/Dockerfile`, `backend/.dockerignore` (exclude `.env`, `tests`, `__pycache__`, `.local-media`), `docker-compose.yml` (local: mongo + backend), `deploy/docker-compose.prod.yml` (backend only).

Dockerfile sketch:
```
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m app && chown -R app /app
USER app
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/api/')"
CMD ["uvicorn","server:app","--host","0.0.0.0","--port","8000","--proxy-headers","--forwarded-allow-ips=*"]
```
- Local compose: `mongo` (volume, bound to 127.0.0.1) and `backend` (`env_file`, `MONGO_URL` pointing at `mongo`, `STORAGE_MODE=local`, a volume for `.local-media`).
- Prod compose: only `backend`, published as `127.0.0.1:8000:8000`, `env_file`, `restart: unless-stopped`, `STORAGE_MODE=cloudinary`.
- Oracle VM may be ARM. `python:3.13-slim` is multi-arch. Build on the VM or use `buildx`.
- Nginx notes for cutover (write them in the README): terminate SSL, proxy to `127.0.0.1:8000`, **`client_max_body_size 60m;`** (default 1 MB breaks gallery uploads), HTTP to HTTPS redirect must be `308` (a `301` turns POST into GET and gives the 405 you hit before).
- Gate: from a fresh clone, `docker compose up` builds, backend is healthy, and an image upload through the container works in local mode.

## A6. Hand-off
- `backend/README.md`: env vars, run locally, run tests, restore a dump, deploy to the VM, Nginx notes.
- Atlas backup note: scheduled `mongodump` (cron on the VM) or Atlas snapshots.
- `CORS_ORIGINS` = the Vercel domain. `PUBLIC_SITE_URL` = the site domain (used in emails).

## Prompt A (paste into a fresh session)

````text
You are working in the repo moonman369/biraajo (FastAPI + MongoDB backend in backend/, React frontend in frontend/). Read docs/emergent-exit/plan.md and docs/emergent-exit/PROGRESS.md first. Do PART A (backend) of the Emergent exit. Do not touch frontend/.

Goal: remove every dependency on Emergent's platform, use Cloudinary for media in production, keep all data in MongoDB, upgrade backend dependencies to the latest versions, and make the backend run in Docker. The site must behave exactly as before.

You have NO production data, NO real Cloudinary account and NO live site. Do not ask for them. Use a local Mongo container (empty database biraajo_dev, tests biraajo_test) and the dummy values in plan.md A0. STORAGE_MODE=local writes files to backend/.local-media/; unit tests mock the Cloudinary SDK. Anything that needs real data or real Cloudinary goes into the Cutover list in PROGRESS.md; you only write the scripts for it (A2) and test them with fixtures.

Facts you can rely on:
- backend/server.py is one 2,154-line file, 52 routes under /api, Motor + MongoDB, JWT admin auth, Resend email, optional Google Sheets webhook. backend/site_defaults.py holds default CMS content.
- Emergent coupling: object storage (STORAGE_URL, init_storage, put_object, get_object, _ensure_media_cached, serve_media, upload_payment_screenshot, get_payment_screenshot, upload_media), a PUBLIC_SITE_URL default on an emergent.host domain, a customer-assets.emergentagent.net image in _WTWE_IMG, and requirements.txt entries emergentintegrations and a litellm wheel from customer-assets.emergentagent.com. EMERGENT_LLM_KEY is only the storage login. There is no LLM usage.
- Stored media URLs look like /api/media/biraajo/media/<hex>.<ext> and /api/media/biraajo/gallery/<hex>.<ext>. They live inside Mongo documents and in code and must keep working without rewriting.
- payment_screenshot_path holds a path like biraajo/payments/<reg_id>/<uuid>.<ext>. The admin UI fetches it with an Authorization header and turns it into a blob, so GET /api/registrations/{id}/screenshot must keep returning bytes.
- There are 24 one-off startup migrations in _run_migrations. Do NOT delete or edit them, and do not touch _WTWE_IMG. Whether production has applied them is unknown until cutover.
- backend/tests has 11 HTTP-style pytest files. They hardcode /app/frontend/.env and an Emergent preview URL.

Follow plan.md section "PART A" phases A0 to A6 in order. Key requirements:
1. Payment screenshots: Cloudinary type "authenticated" in prod, served only through the admin-protected route. Public media: public_id equals the existing path without extension. GET /api/media/{path} redirects to res.cloudinary.com with an immutable cache header and returns 404 for biraajo/payments/. Verify Cloudinary SDK call signatures against the current Cloudinary docs before relying on them. The SDK is synchronous, so use asyncio.to_thread. Put the two backends (cloudinary, local) behind a small backend/storage.py. In prod mode the app must refuse to start without CLOUDINARY_URL.
2. Add conftest.py that aborts tests unless DB_NAME ends with _dev or _test.
3. Motor to PyMongo Async, FastAPI lifespan instead of on_event, bcrypt 5 long-password check. Re-check latest versions with `pip index versions` before pinning. requirements.txt contains direct dependencies only.
4. Dockerfile only in backend/. Document the Nginx notes (client_max_body_size 60m, 308 redirect) in the README.

Rules: branch emergent-exit, one commit per phase, update PROGRESS.md in the same commit, stop at the first failed gate and report. No new features, no refactors, do not split server.py. Do not commit secrets, dumps, media or screenshots. Add !.env.example to .gitignore. Keep response shapes of every route unchanged. Scripts must run on Windows (Python or Node, not bash-only).

When finished, report per phase: what changed, gate result with evidence (commands and outputs), what could not be verified and is now on the Cutover list, and any decision you need from me.
````

---

# PART B: Frontend

Starts after Part A is green. The backend runs locally on port 8000, against local Mongo with seeded dummy data, `STORAGE_MODE=local`.

## B0. Baseline (from the original code, not the live site)
- The live site is not available, so the baseline is the **original** frontend (tag `pre-emergent-exit`, CRA) running against the Part A backend. This proves the frontend changes alter nothing. It does not prove the new site matches the live one; that check is C6 in Section 6.
- Make captures repeatable: dump the dummy database once and restore it before each capture run; freeze the browser clock with Playwright; mock `**/api/media/**` with the same fixed placeholder image and video every time; wait for animations to settle.
- Capture: all 15 routes at 390px and 1440px, plus the admin dashboard tabs and `/admin/edit` (log in with the dummy admin). Script goes in `tools/visual/`; PNGs stay outside git.
- Record counts for later: number of `data-testid` attributes, list of routes.
- Gate: the original frontend builds (`craco build`), every route renders, two baseline runs in a row produce identical PNGs.

## B1. Prune dead code and dependencies
- A trace from `src/index.js` shows the real runtime packages: `react`, `react-dom`, `react-router-dom`, `axios`, `framer-motion`, `lucide-react`, `sonner`, `@tanstack/react-query`.
- Delete: all of `src/components/ui/` (46 files, none imported), `src/hooks/use-toast.js`, and every unused dependency (all Radix packages, `recharts`, `zod`, `lodash`, `swr`, `dayjs`, `date-fns`, `react-hook-form`, `@hookform/resolvers`, `react-day-picker`, `cmdk`, `vaul`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-resizable-panels`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@types/lodash`, ...). Check each against a fresh trace before deleting. Keep `tailwindcss-animate` only if one of its classes is used. Remove `components.json` if nothing needs it.
- Check `constants/testIds/home.js` `emergentLink`: remove only if unused.
- Gate: build passes, screenshot diff vs baseline shows no change, `data-testid` count unchanged.

## B2. Strip Emergent from the frontend
- `public/index.html`: remove the `emergent-main.js` script, the whole PostHog snippet, the DataCloneError shim, and the "A product of emergent.sh" description. Set a **placeholder** tab title and meta description (`Biraajo by Vidip Shah` and a one-line description) and list them in PROGRESS.md as awaiting the chef's final text. Nothing else changes.
- Delete the health-check wiring, `plugins/health-check/`, `@emergentbase/visual-edits`, `cra-template`.
- Gate: `grep -ri emergent frontend` is empty; the page makes no request to any emergent or posthog host (check the network log).

## B3. CRA to Vite
- Vite 8, `@vitejs/plugin-react` 6, Node 22. Package manager: npm, commit `package-lock.json`, remove the `packageManager` field.
- Move `index.html` to `frontend/`, add the module script tag. Rename files that contain JSX from `.js` to `.jsx` (`App.js`, `index.js`, and any lib file with JSX). Alias `@` to `src`. Dev server port 3000.
- `REACT_APP_BACKEND_URL` is used in two places (`lib/api.js`, `pages/AdminDashboard.jsx`). Replace with `import.meta.env.VITE_API_URL ?? ""`. With an empty value, requests go to `/api` and the dev proxy sends them to `http://localhost:8000`.
- Add `frontend/.env.example` with `VITE_API_URL=`.
- Gate: `npm run dev` and `npm run build` work; screenshot diff clean; admin login, booking modal, screenshot upload and the admin screenshot viewer work against the local backend.

## B4. Upgrade the runtime packages
- Target versions (re-check at run time): react and react-dom 19.3.1, react-router-dom 7.18.4, axios 1.20.0, sonner 2.0.8, @tanstack/react-query 5.105.0, lucide-react 1.61.0, framer-motion 14.6.0.
- **Instagram icon:** lucide-react 1.x removed it. Used in `InstagramFeed.jsx`, `Contact.jsx`, `Footer.jsx`. Create `src/components/icons/Instagram.jsx` with the old shapes: rect `x=2 y=2 width=20 height=20 rx=5 ry=5`, path `M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z`, line from `17.5,6.5` to `17.51,6.5`. 24x24 viewBox, `fill="none"`, `stroke="currentColor"`, stroke width 2, round caps and joins. It must accept `size` and `className` like lucide.
- One package per commit group, with a diff after each. Watch framer-motion (three major versions: 11 to 14) for animation timing, and lucide icons for shape changes.
- Gate: no console errors on any route, screenshot diff reviewed by eye, animations still play on Hero, Events, Gallery and the booking modal.

## B5. Tailwind 4 (last, highest UI risk)
- `tailwindcss` 4.3.3 and `@tailwindcss/vite`. Use the official upgrade tool. The design uses `rounded-sm`, `--radius` and `hsl(var(--x))` colors heavily, so renamed utilities can shift sizes.
- Keep every color, radius and font value identical. Do not "clean up" styles.
- Gate: pixel diff against baseline on all routes and both widths, every difference classified. If any difference is a visible regression that cannot be fixed with a small override, revert to Tailwind 3.4.17 and report.

## B6. Vercel preparation
- `frontend/vercel.json`: rewrite all non-file paths to `/index.html` (without it, refreshing `/booking/:id` returns 404).
- README section: Vercel project root `frontend`, build `npm run build`, output `dist`, env var `VITE_API_URL=https://api.<domain>`. Browser uploads go straight to the API domain, not through a Vercel rewrite.
- Gate: `npm run build` output served by a static server with SPA fallback loads deep links (`/booking/<id>`, `/admin`, `/menus/barsaat`) on refresh. The real deploy happens at cutover.

## Prompt B (paste into a fresh session, after Part A)

````text
You are working in the repo moonman369/biraajo, branch emergent-exit. Read docs/emergent-exit/plan.md and docs/emergent-exit/PROGRESS.md first. Part A (backend) is done: the backend runs locally on http://localhost:8000 against a local Mongo with seeded dummy data and STORAGE_MODE=local. Do PART B (frontend) of the Emergent exit, only inside frontend/ (plus tools/visual/ for the screenshot script).

Goal: remove Emergent from the frontend, move from Create React App to Vite, upgrade dependencies to the latest versions, prepare for Vercel, and keep the UI pixel-identical. The only intended visible change is the browser tab title and meta description; use the placeholders in plan.md B2.

You have no live site, no production data and no real Cloudinary. Do not ask for them. The baseline is the ORIGINAL frontend (tag pre-emergent-exit) running against the Part A backend; capture it first (plan.md B0), with the database restored from the same dump before every run, the browser clock frozen, and **/api/media/** mocked in Playwright with fixed placeholder files. Playwright's bundled Chromium cannot decode H.264, so compare video areas by their poster or placeholder.

Facts you can rely on:
- frontend/ is CRA via CRACO, React 19, React Router 7, Tailwind 3.4.17, Framer Motion 11, 15 routes (see src/App.js). Large files: src/pages/AdminDashboard.jsx (1,616 lines) and EditWebsite.jsx (982).
- A trace from src/index.js reaches 34 of 85 source files. The only external runtime packages used are react, react-dom, react-router-dom, axios, framer-motion, lucide-react, sonner, @tanstack/react-query. All 46 files in src/components/ui are dead code. About 40 dependencies in package.json are unused. Re-verify with a fresh trace before deleting anything.
- Emergent coupling: @emergentbase/visual-edits (loaded in craco.config.js), plugins/health-check/, cra-template, and public/index.html which loads https://assets.emergent.sh/scripts/emergent-main.js and a PostHog snippet, has the title "Emergent | Fullstack App" and the description "A product of emergent.sh".
- The backend URL comes from process.env.REACT_APP_BACKEND_URL in exactly two places: src/lib/api.js and src/pages/AdminDashboard.jsx.
- lucide-react 1.x no longer exports Instagram. It is used in InstagramFeed.jsx, Contact.jsx and Footer.jsx. Replace it with a local component that draws the old lucide shapes (rect x=2 y=2 w=20 h=20 rx=5; path "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"; line 17.5,6.5 to 17.51,6.5; 24x24 viewBox, stroke currentColor, width 2, round caps and joins; accepts size and className).
- Fonts (Cormorant Garamond, Manrope) load from Google Fonts. Leave that as is.

Follow plan.md section "PART B" phases B0 to B6 in order. Key requirements:
1. Delete dead code first (B1) and diff before changing any tool or version, so a visual difference can be traced to one change.
2. Vite 8, @vitejs/plugin-react 6, npm with a committed package-lock.json, Node 22, dev port 3000, alias @ to src, dev proxy /api to http://localhost:8000, VITE_API_URL via import.meta.env with an empty default.
3. Upgrade one package group at a time and run the screenshot diff after each. Re-check latest versions with `npm view <pkg> version` before pinning. Tailwind 4 goes last, using the official upgrade tool. If it causes a visible regression you cannot fix with a small override, revert to 3.4.17 and report.
4. Add frontend/vercel.json so all non-file paths rewrite to /index.html.
5. Keep every data-testid. Do not restyle, rename classes for taste, or refactor components.

Rules: stay on branch emergent-exit, one commit per phase, update PROGRESS.md in the same commit, stop at the first failed gate and report. Do not commit secrets or screenshots. If a diff is not zero, classify it (antialiasing, font load, animation frame, real change) and fix real changes. Scripts must run on Windows.

When finished, report per phase: what changed, gate evidence (build output, console log check, diff summary with the list of differing routes and why), what could not be verified and is now on the Cutover list, and any decision you need from me.
````

---

# 6. Cutover (you run this by hand, later)

Do these in order. **Keep the Emergent site and its database running until C6 passes.**

**C1. Get and restore the production data (hard rule).**
- Get the dump: `mongodump` with the Emergent production `MONGO_URL` (best). Fallback: log in as admin and pull the data through the API (`/api/events`, `/api/registrations`, `/api/registrations/archived`, `/api/admin/offsite-bookings`, `/api/newsletter`, `/api/contact`, `/api/menu`, `/api/gallery`, `/api/site-content`, `/api/admin/site-content/history` and each snapshot, `/api/settings`). Raw `pageviews` cannot be recovered this way.
- Restore into Atlas **every collection, including `migrations`**, before the new backend ever starts against that database. If `migrations` is missing or partial, the new backend will re-run old startup migrations and can overwrite content the chef edited later, and it will seed gallery, menu and admin rows on an empty database.
- Check that all 24 migration ids from `_run_migrations` exist in the restored `migrations` collection. If so, the migration block can be removed later in its own commit. If any id is missing, find out why before booting.
- Start the backend against a copy first, not the only copy.

**C2. Media.**
- Collect every `/api/media/...` string from the restored data and from code. Download each from the live site (public). Download payment screenshots through `GET /api/registrations/{id}/screenshot` with an admin token. Write a manifest: path, bytes, sha256.
- Run `scripts/scan_emergent_refs.py` on the restored database. Each hit (including `_WTWE_IMG`) must be downloaded, uploaded to `biraajo/media/...`, and the stored reference updated.
- Run `scripts/import_media_to_cloudinary.py`. Gate: every file returns 200 and sizes match the manifest.

**C3. Real Cloudinary.**
- Put the real `CLOUDINARY_URL` in the VM's `.env`, `STORAGE_MODE=cloudinary`. Run `scripts/smoke_cloudinary.py`.
- Check the account's folder mode; set `asset_folder` if needed so the Media Library shows `biraajo/media`, `biraajo/gallery`, `biraajo/payments`.
- Test on a **real iPhone with Safari**: the hero video and a gallery video play. If not, switch `/api/media` to the proxy that forwards `Range`.
- Confirm a payment screenshot URL cannot be opened without admin login.

**C4. Backend on the Oracle VM.**
- Atlas IP allowlist includes the VM's public IP. Nginx per the README (`client_max_body_size 60m`, `308` redirect). `docker compose -f deploy/docker-compose.prod.yml up -d`.
- Gate: `https://api.<domain>/api/` returns `{"status":"ok"}`; a 40 MB video upload through Nginx succeeds; admin login works with a **new** admin password.

**C5. Frontend on Vercel.**
- Root `frontend`, `VITE_API_URL=https://api.<domain>`, backend `CORS_ORIGINS` and `PUBLIC_SITE_URL` set to the site domain.
- Gate: deep links work on refresh; full booking works end to end; gallery upload and admin screenshot view work.

**C6. Compare with the live Emergent site.**
- Screenshot the same 15 routes at 390px and 1440px on both sites (Emergent live vs. the new one, both on real data). Review differences by eye. Expected: tab title only.
- Final tab title and meta description from the chef.
- Only after this passes: switch DNS, then turn off Emergent after a few days of no problems.

**C7. Clean-up.**
- Rotate the admin password and `JWT_SECRET`. Scheduled `mongodump` or Atlas snapshots. Set `RESEND_API_KEY` if emails should work (the domain verification is still pending on the chef's side).

---

## 7. Done means

- `grep -ri emergent` over the repo returns nothing except notes in docs.
- Fresh clone: backend starts with `docker compose up`, frontend with `npm install && npm run dev`.
- All backend tests pass. Frontend build has no warnings that did not exist before.
- Screenshot diff of the new frontend vs. the original frontend is clean on all routes at both widths (Part B), and vs. the live site is clean except the tab title (C6).
- Backend runs on the Oracle VM, frontend on Vercel, media in Cloudinary, data in Atlas.
- Payment screenshots are not reachable without the admin token.
