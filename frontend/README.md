# Biraajo frontend

React 19 + Vite + Tailwind 3. Node 22.12 or newer, npm.

```bash
npm install
npm run dev       # http://localhost:3000, /api proxied to http://localhost:8000
npm run build     # output in dist/
npm run preview   # serve dist/ on port 3000
```

Environment (see `.env.example`):

- `VITE_API_URL`: API origin used by the browser, for example `https://api.example.com`. Leave it empty in development so requests go to `/api` on the dev server, which proxies them to the backend on port 8000.

## Deploy on Vercel

- Project root directory: `frontend`. Framework preset: Vite. Build command `npm run build`, output directory `dist`. Node version comes from `engines.node` (22.x).
- Environment variable: `VITE_API_URL=https://api.<domain>` (no trailing slash). It is baked in at build time, so redeploy after changing it.
- `vercel.json` rewrites every path that is not a file to `/index.html`, so deep links such as `/booking/<id>` or `/menus/barsaat` work on refresh.
- The browser talks to the API domain directly, including uploads (gallery videos up to 50 MB, payment screenshots); nothing goes through a Vercel rewrite. The backend's `CORS_ORIGINS` must list the Vercel and custom domains.
