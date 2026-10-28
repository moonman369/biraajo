# Emergent exit: progress

Plan: [plan.md](plan.md) (v3). Branch: `emergent-exit`, created from `feature/submergent` @ `6d77bbc` (`main` + one README commit).

| Phase | Status | Date | Commit | Gate evidence | Notes |
|---|---|---|---|---|---|
| A0 Scaffolding | Done | 2026-10-28 | this commit | See A0 below | |
| A1 Local run, unchanged | Not started | | | | |
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
None blocking.
