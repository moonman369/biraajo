# Biraajo by Vidip Shah

Website for Biraajo, a supper club by chef Vidip Shah. It has a public site (landing page, chapter story pages, menus, events archive, booking flow) and an admin dashboard with a CMS for editing site content, events, bookings, gallery and menus.

## Stack

| Layer    | Tech                                                                 |
| -------- | -------------------------------------------------------------------- |
| Frontend | React 19 (CRA + CRACO), Tailwind, shadcn/ui, Framer Motion, React Router |
| Backend  | FastAPI + Motor (async MongoDB), single file at `backend/server.py`  |
| Database | MongoDB                                                              |
| Auth     | JWT, admin only (the admin account is seeded from env vars)          |
| Optional | Emergent Object Storage (media + payment screenshots), Resend (email), Google Sheets webhook |

```
backend/    FastAPI app (server.py), CMS defaults (site_defaults.py), pytest suites
frontend/   React app (pages in src/pages, sections in src/components)
memory/     PRD and changelog
```

## Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn 1 (`corepack enable` or `npm i -g yarn`)
- MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

## Quickstart

### 1. Backend

Create `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=biraajo
JWT_SECRET=change-me-to-a-long-random-string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
CORS_ORIGINS=http://localhost:3000

# Optional
# EMERGENT_LLM_KEY=        # object storage: /api/media/* assets and payment screenshot uploads
# RESEND_API_KEY=          # admin notification emails
# RESEND_FROM_EMAIL=Biraajo <onboarding@resend.dev>
# RESEND_REPLY_TO=
# GOOGLE_SHEETS_WEBHOOK_URL=
# PUBLIC_SITE_URL=http://localhost:3000
# UPI_ID=
# APP_NAME=biraajo
```

Install and run:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
uvicorn server:app --reload --port 8001
```

`emergentintegrations` isn't on PyPI, so it needs the extra index URL above. `server.py` doesn't import it; if the install fails you can delete that line from `requirements.txt`.

When the server starts it creates indexes, seeds the admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD`, seeds the gallery and menus, and runs the content migrations. API docs are at http://localhost:8001/docs.

### 2. Frontend

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

Install and run:

```bash
cd frontend
yarn install
yarn start
```

Open http://localhost:3000. The admin panel is at http://localhost:3000/admin/login, and you sign in with the `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `backend/.env`.

## Main routes

| Path                                   | Page                         |
| -------------------------------------- | ---------------------------- |
| `/`                                    | Landing page                 |
| `/events`                              | Chapters archive             |
| `/supper-club/{naani-ghar,barsaat,when-there-wasnt-enough}` | Chapter story pages |
| `/menus`, `/menus/<chapter>`           | Menus                        |
| `/booking/:id`                         | Booking status               |
| `/admin`, `/admin/edit`                | Dashboard and CMS editor     |

All backend routes live under `/api` (for example `/api/events`, `/api/settings`, `/api/auth/login`).

## Running tests

The backend tests are integration tests that make HTTP calls to a running server. They read `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `backend/.env`, and `REACT_APP_BACKEND_URL` for the target. **If you don't set it, they hit the hosted preview URL, not your local server**, so point it at localhost:

```bash
cd backend
# Windows PowerShell: $env:REACT_APP_BACKEND_URL="http://localhost:8001"
REACT_APP_BACKEND_URL=http://localhost:8001 pytest tests
```

Some tests create and delete events and bookings, so use a throwaway database.

## Notes for local development

- **Media**: site images and videos are served through `/api/media/...`, which pulls them from Emergent Object Storage. Without `EMERGENT_LLM_KEY` those assets won't load locally, though the rest of the site still works. Payment screenshot uploads need it as well.
- **Email / Sheets**: if `RESEND_API_KEY` or `GOOGLE_SHEETS_WEBHOOK_URL` isn't set, that integration is skipped, and bookings are still saved to MongoDB.
- **Production build**: `cd frontend && yarn build`, which writes to `frontend/build/`.
