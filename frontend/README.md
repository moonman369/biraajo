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
