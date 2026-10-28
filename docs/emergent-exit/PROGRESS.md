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
| B0 Baseline | Done | 2026-10-28 | this commit | build OK; 2 consecutive runs: 48/48 identical | Owner chose Part B before A2–A6 |
| B1 Prune | Done | 2026-10-28 | this commit | build OK; diff vs baseline 0/48; data-testid 316 | |
| B2 Strip Emergent (frontend) | Done | 2026-10-28 | this commit | grep empty; no emergent/posthog requests; diff 0/48 | Title/description are placeholders |
| B3 CRA → Vite | Done* | 2026-10-28 | this commit | dev + build OK (Node 22 & 24); diff 0/48; flows same as original | *Upload/viewer re-check after A2 |
| B4 Upgrade packages | **Paused: lucide decision** | 2026-10-28 | B4.1–B4.6 | 6 of 7 groups: diff 0/48, flows same, animations play | lucide-react 1.x redraws 11 icons |
| B5 Tailwind 4 | Not started | | | | |
| B6 Vercel prep | Not started | | | | |

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

## B0. Baseline (original frontend, against the local backend)

Context: on 2026-10-28 the owner asked to go to Part B now and fix the backend tests later. The backend under the frontend is therefore the **original** `server.py` (A1 state), `biraajo_dev`, Emergent storage not configured. That makes no difference to B0 because every `/api/media/**` request is mocked.

Tool: `tools/visual/` (Node, runs on Windows). Output lives outside git in `../biraajo-visual/` (override with `VISUAL_OUT`).
```
cd tools/visual && npm install && npx playwright install chromium
node db.mjs prepare                    # once: fixture event + booking via the API, then mongodump of biraajo_dev
node serve.mjs <build-dir> 3000        # static server, SPA fallback, /api proxied to :8000
node capture.mjs <label>               # restores the dump, captures 48 PNGs, exit 1 on console/page problems
node diff.mjs <labelA> <labelB>        # pixelmatch, threshold 0, writes diff PNGs, exit 1 if anything differs
```
What it captures: 13 public routes + `/admin` + 9 admin tabs + `/admin/edit` = 24 per width, at 390 and 1440 → 48 PNGs. `/booking/:id` uses the fixture booking.

How it is made repeatable (each fix was found by a failing run):
- The DB is restored from the same dump before every run. Analytics beacons are answered locally, so a run writes nothing.
- `Date` is frozen at 2026-10-28 12:00 IST through an init script. **Not** `page.clock.setFixedTime`: that stalled framer-motion and left the `/admin/login` card at opacity 0.
- `/api/media/**` and every external image return one generated placeholder PNG. Videos get 404, so posters show. Emergent, PostHog and other third-party scripts are blocked; Google Fonts load normally.
- The scroll walk waits for lazy images in view. Afterwards it scrolls straight to any element framer left at inline `opacity: 0`, because some `whileInView` reveals near the page bottom were missed.
- Chromium flags fix text rasterization (`--font-render-hinting=none --disable-lcd-text --disable-font-subpixel-positioning --force-color-profile=srgb --disable-gpu --disable-partial-raster`).
- A route is reloaded if a request to the app/API fails at network level. Windows once returned `ERR_NO_BUFFER_SPACE` for `/api/stats`.

Environment fix (not committed): the committed `frontend/package-lock.json` hoists `ajv-keywords@5` next to `ajv@6`, so `craco build` failed with `Cannot find module 'ajv/dist/compile/codegen'`. Locally fixed with `npm install --no-save --legacy-peer-deps ajv@8`, which leaves package.json and the lockfile untouched. B3 replaces CRA, so this goes away.

Gate: **PASS**
- `REACT_APP_BACKEND_URL=http://localhost:8000 npx craco build` → `Compiled with warnings.` The only warnings are 2 existing `react-hooks/exhaustive-deps` ones (`AdminDashboard.jsx:1047`, `BookingStatus.jsx:34`); later phases are compared against these. `main.js` 186.17 kB gz, `main.css` 13.3 kB gz. A copy of the build is kept at `../biraajo-visual/build-original`.
- Every route renders: 48 screenshots, no redirects, `_problems.txt` empty.
- Two runs in a row: `node diff.mjs baseline-1 baseline-2` → `48 compared, 0 differ`.
- Known noise: a third run (`baseline-3`) differed from `baseline-1` on 11 PNGs, all at 390px (admin pages + barsaat), 34–482 px each. Every differing pixel sits on single letters, mostly the small letter-spaced uppercase labels. Classified as **glyph antialiasing**: no layout, colour or position change. Later diffs that show only this pattern are classified the same way, and anything else counts as a real change.

Recorded counts for later phases:
- `data-testid`: **316** occurrences in **29** files under `src/` (0 inside `components/ui/`).
- Routes (src/App.js): `/`, `/events`, `/about-the-chef`, `/supper-club/naani-ghar`, `/supper-club/barsaat`, `/supper-club/when-there-wasnt-enough`, `/booking/:id`, `/suppers`, `/menus`, `/menus/naani-ghar`, `/menus/barsaat`, `/menus/when-there-wasnt-enough`, `/admin/login`, `/admin/edit`, `/admin`, plus `*` → `/`.
- Import trace from `src/index.js`: 34 of 87 files reachable. Packages used: `@tanstack/react-query axios framer-motion lucide-react react react-dom react-router-dom sonner`.

---

## B1. Prune dead code and dependencies

Changes:
- Deleted `src/components/ui/` (46 files), `src/hooks/use-toast.js`, `src/lib/utils.js` (shadcn `cn()` helper; only `ui/` imported it, and it was the only user of `clsx`/`tailwind-merge`), `components.json` (shadcn CLI config).
- `constants/testIds/home.js`: removed the unused `emergentLink` entry. Nothing imports `constants/testIds/` at all.
- Removed 47 dependencies: all 27 `@radix-ui/*`, `@hookform/resolvers`, `class-variance-authority`, `clsx`, `cmdk`, `date-fns`, `dayjs`, `embla-carousel-react`, `input-otp`, `lodash`, `next-themes`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `recharts`, `swr`, `tailwind-merge`, `vaul`, `zod`, `@types/lodash`, `tailwindcss-animate`.
- `tailwindcss-animate`: removed together with its `plugins` entry in `tailwind.config.js`. Generating the CSS with and without it differs only in `@keyframes enter/exit`, `.running`/`.paused`, and `animation-duration` on `.duration-300/500/700`. No element that uses those duration classes has a CSS animation; the only animated elements are `animate-pulse` and two `animate-spin`, and none carries a `duration-*` class. So nothing visible depended on it.
- Kept for now (CRA/CRACO still loads them; B2/B3 remove them): `react-scripts`, `@craco/craco`, `dotenv`, `@babel/plugin-proposal-private-property-in-object`, the eslint packages, `cra-template` and `@emergentbase/visual-edits` (B2).
- Kept versions: all 8 runtime packages and `tailwindcss` resolve to the same versions in the lockfile as before.

Gate: **PASS**
- `craco build` → same 2 warnings as B0. `main.e4ee6194.js` is **byte-identical** to B0 (same hash, 186.17 kB gz). CSS 13.3 kB → 7.75 kB gz (rules for classes only `ui/` used).
- `node diff.mjs baseline-1 b1` → `48 compared, 0 differ`.
- `data-testid`: 316 in 29 files (unchanged).
- Fresh trace: 34 of 39 files reachable, same 8 packages.

Not deleted, decision for the owner (dead code outside the plan's list): `components/Experiences.jsx`, `components/MenuSection.jsx`, `constants/testIds/` (auth.js, home.js, index.js). None are imported. They hold `data-testid`s, so deleting them would change the recorded count.

The `ajv` workaround from B0 has to be reapplied after every `npm install/uninstall` until B3.

---

## B2. Strip Emergent from the frontend

Changes:
- `public/index.html`: removed the DataCloneError shim, the `assets.emergent.sh/scripts/emergent-main.js` script and the whole PostHog snippet (including the `phc_...` project key). Title `Emergent | Fullstack App` → **`Biraajo by Vidip Shah`**. Description `A product of emergent.sh` → **`Biraajo by Vidip Shah. A personal chef supper club in Calcutta.`** Nothing else changed (the Inter font link and the CRA comments stay).
- `craco.config.js`: removed the health-check wiring (`ENABLE_HEALTH_CHECK`, webpack plugin, devServer middleware) and the `@emergentbase/visual-edits` wrapper. The eslint, `@` alias and watchOptions settings are unchanged.
- Deleted `plugins/health-check/`. Uninstalled `@emergentbase/visual-edits` and `cra-template`.
- `src/constants/testIds/auth.js`: comment no longer names the Emergent lint rule (it was the last `emergent` string in `frontend/`).
- `tools/visual/capture.mjs` now writes `_hosts.txt`: every non-app host a run tried to reach.

Gate: **PASS**
- `grep -rniI "emergent\|posthog" frontend --exclude-dir=node_modules --exclude-dir=build` → no output. The built `build/` has no match either; the original build had one, in `index.html`.
- Network log (`b2/_hosts.txt`), all 48 page loads: `fonts.googleapis.com`, `fonts.gstatic.com`, `images.unsplash.com`. The Unsplash URLs come from the seeded gallery data in the dummy DB, not from code. No emergent or posthog host.
- `craco build`: same 2 warnings; `main.e4ee6194.js` is still byte-identical.
- `node diff.mjs baseline-1 b2` → `48 compared, 0 differ`. The tab title isn't part of a screenshot.

Awaiting the chef's final text: tab title and meta description (placeholders above).

---

## B3. CRA → Vite

Changes:
- `public/index.html` → `frontend/index.html`, plus `<script type="module" src="/src/index.jsx">`. Removed the CRA-only template comments (`%PUBLIC_URL%`, manifest, `npm start`/`yarn start`). `public/` is empty and gone.
- `src/App.js` → `App.jsx`, `src/index.js` → `index.jsx`. These are the only `.js` files with JSX. The `constants/testIds` matches were `<feature>-<element>` inside comments.
- `vite.config.mjs`: `@vitejs/plugin-react`, alias `@` → `src`, dev port 3000 (`strictPort`), proxy `/api` → `http://localhost:8000`, preview port 3000. `build.chunkSizeWarningLimit: 700` because the app is one ~650 kB chunk, as under CRA, and splitting it would be a refactor. Rolldown's `pluginTimings` report is turned off. Without these two, Vite printed two notices CRA never showed.
- `REACT_APP_BACKEND_URL` → `import.meta.env.VITE_API_URL ?? ""` in `src/lib/api.js` and `src/pages/AdminDashboard.jsx`. Added `frontend/.env.example` (`VITE_API_URL=`); it is tracked thanks to `!.env.example`.
- `tailwind.config.js` content path `./public/index.html` → `./index.html`.
- package.json: scripts `dev`/`build`/`preview`; `engines.node: "22.x"` (Vercel reads this); `packageManager` removed. Added `vite 8.3.5`, `@vitejs/plugin-react 6.1.2` (latest on 2026-10-28). Removed `react-scripts`, `@craco/craco`, `@babel/plugin-proposal-private-property-in-object`, `dotenv`, and the eslint packages (`eslint`, `@eslint/js`, `eslint-plugin-{import,jsx-a11y,react,react-hooks}`, `globals`); CRA was their only user and there is no eslint config file. Deleted `craco.config.js`. `browserslist` is kept (autoprefixer reads it).
- `package-lock.json` regenerated with npm. A fresh `npm ci` works without `--legacy-peer-deps` and without the ajv workaround from B0/B1, which is no longer needed.
- READMEs: `frontend/README.md` (was CRA boilerplate) and the frontend parts of the root `README.md` now describe npm + Vite. The backend parts of the root README are still the old text; A3 replaces it.
- `tools/visual/flows.mjs`: Playwright smoke test of booking modal, both screenshot uploads, admin login and the admin screenshot viewer.

Gate: **PASS, except the upload/viewer success path, which needs A2** (owner decision: frontend before backend storage).
- `rm -rf node_modules && npm ci` → 133 packages. `npm run build` → `index-GnKdteyJ.js 649.55 kB (183.33 kB gz)`, `index-DFi4EFWy.css 34.41 kB (7.57 kB gz)`, no warnings. The same build on **Node 22.23.4** (`npx -p node@22`) produces byte-identical assets.
- `npm run dev` → ready on :3000; `/` 200, `/menus/barsaat` 200 (SPA fallback), `/api/` through the proxy → `{"status":"ok"}`.
- Screenshot diff, `dist/` served by `serve.mjs` → `node diff.mjs baseline-1 b3` → `48 compared, 0 differ`. Pixel-identical even though PostCSS changed: CRA used its own chain (postcss-preset-env); Vite uses `postcss.config.js` (tailwind + autoprefixer).
- `node flows.mjs`, with identical output for the original CRA build, the Vite build and `npm run dev`:
  ```
  PASS     booking modal - register -> 200, payment step shown (₹2,500)
  STORAGE  modal screenshot upload - request sent correctly, backend: 500 {"detail":"Storage not configured"}
  STORAGE  booking page screenshot upload - request sent correctly, backend: 500 {"detail":"Storage not configured"}
  PASS     admin login - landed on /admin
  STORAGE  admin screenshot viewer - GET with Bearer token sent; backend 500, UI shows 'Screenshot not available'
  PASS     no page errors
  ```
  The upload and viewer requests go to the right endpoint, with the Bearer token for the viewer, and errors are handled. The success path cannot be shown until A2 gives the backend storage. **Re-run `node flows.mjs` after A2; all lines must be PASS.**
- `data-testid` 316 (unchanged). `grep -ri emergent frontend` (excluding node_modules/dist) is empty.

Lost by design: CRA linted during the build (the 2 `exhaustive-deps` warnings). Vite does not lint. Adding an eslint setup would be new tooling, so not done.

`npm audit`: 5 high, all in versions B4 upgrades anyway (`axios` < 1.20, `react-router` ≤ 7.17, its `turbo-stream`, `postcss` ≤ 8.5.22).

---

## B4. Upgrade the runtime packages

Versions re-checked with `npm view` on 2026-10-28. Some are newer than the plan's targets; the newest was used. One commit per group. After each group: `npm run build`, 48-screenshot diff against `baseline-1`, `node flows.mjs`.

| Commit | Group | JS bundle (gz) | Diff | Flows |
|---|---|---|---|---|
| B4.1 | react, react-dom 19.0.0 → **19.3.1** | 194.10 kB | 0/48 | same as original |
| B4.2 | react-router-dom 7.5.1 → **7.18.5** (plan: 7.18.4) | 196.02 kB | 0/48 | same |
| B4.3 | axios 1.8.4 → **1.21.0** (plan: 1.20.0) | 203.85 kB | 0/48 | same |
| B4.4 | sonner 2.0.3 → **2.0.8** | 204.15 kB | 0/48 | same; toast renders |
| B4.5 | @tanstack/react-query 5.56.2 → **5.105.0** | 204.79 kB | 0/48 | same |
| B4.6 | framer-motion 11.18.0 → **14.7.1** (plan: 14.6.0) | 212.98 kB | 0/48 | same |
| — | lucide-react 0.516.0 → 1.63.0 (plan: 1.61.0) | — | **45/48 differ** | same | 

Notes:
- With axios 1.21 the single bundle passed 700 kB, so `chunkSizeWarningLimit` went from 700 to 800 (still one chunk, as under CRA). Total growth from the upgrades: 183 → 213 kB gz.
- `npm audit`: 5 high → 1 high (`postcss` ≤ 8.5.22, a build-time dependency of Tailwind; B5 replaces that toolchain).
- Animations, `tools/visual/anim.mjs` (samples opacity/translateY per frame, aligned to when motion starts), framer 11 build vs framer 14 build: hero title, events cards, gallery tiles and the booking modal all play and settle at opacity 1 / y 0. Events settle in 641 ms vs 632 ms. The gallery shows the same shape on both builds (a short stall while images decode). The hero curve over the overlapping range matches. No timing change I can measure.
- No console errors on any route in any group (`_problems.txt` empty in every capture).

**lucide-react: not committed, waiting for the owner.**
- As the plan expected, `Instagram` is gone. A local `src/components/icons/Instagram.jsx` built with lucide's own `createLucideIcon` and the old shapes renders **byte-identical SVG** to 0.516's `Instagram`.
- But 1.x also **redrew 11 more icons** the site uses. Comparing the rendered SVG markup of all 41 used icons between 0.516 and 1.63:
  - public site: `Menu` (hamburger: bars at y=5/12/19 instead of 6/12/18), `MessageCircle` (WhatsApp link in footer/contact: new bubble shape), `Heart`, `Play` (rounded triangle), `Sparkles`, `Calendar`, `Music2`
  - admin: `Edit3`, `Trash2`, `MessageSquare`, `Home`
  - 9 other names (`BarChart3`, `Loader2`, `Edit2`, ...) are now aliases but render as before.
- Result: 45 of 48 screenshots differ by 20–493 px, all of it in those icons. Diff images: `../biraajo-visual/diff-baseline-1-vs-b4-lucide/`. The full change (package bump + Instagram component + 3 imports) is saved as `../biraajo-visual/b4-lucide.patch`.
- Options: (a) accept the new icon designs (small visible change); (b) upgrade, but keep the old shapes for those 11 icons as local `createLucideIcon` copies like Instagram (pixel-identical, 12 small local icons to maintain); (c) stay on lucide-react 0.516.0.

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
- **B4 lucide-react (blocking B4/B5):** accept the 11 redrawn icons, keep the old shapes as local icons, or stay on 0.516? See B4.
- Backend tests (A1) and Part A phases A2–A6 are still open; Part B was started first at the owner's request.
- B3/B4: re-run `tools/visual/flows.mjs` once A2 gives the backend storage; the upload and admin-viewer checks must turn from STORAGE to PASS.
- Final tab title and meta description from the chef (B2 placeholders in `frontend/public/index.html`).
1. **A1 tests (deferred, not blocking).** How should the 27 non-storage failures be handled? Options:
   - (a) Update group 2 to the current code values. Mark groups 3 and 4 with pytest markers (`prod_data`, `needs_external`) that are deselected by default and run at cutover against a restored copy. Then rerun the gate. *(recommended)*
   - (b) Delete the one-off iteration snapshot tests (`test_barsaat_iter14`, `test_iter15`, `test_iter27`, `test_iter29`) and fix the rest as in (a).
   - (c) Accept them as known failures and change the gate wording.
