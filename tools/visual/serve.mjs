// Static server with SPA fallback for a production build, plus an /api proxy to the backend.
//   node serve.mjs <build-dir> [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { API_URL } from "./config.mjs";

const root = path.resolve(process.argv[2] || "");
const port = Number(process.argv[3] || 3000);
if (!process.argv[2] || !fs.existsSync(path.join(root, "index.html"))) {
  console.error("usage: node serve.mjs <build-dir-with-index.html> [port]");
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain", ".map": "application/json",
};

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname.startsWith("/api/")) {
    const upstream = new URL(req.url, API_URL);
    const p = http.request(upstream, { method: req.method, headers: { ...req.headers, host: upstream.host } }, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    p.on("error", (e) => { res.writeHead(502); res.end(String(e)); });
    req.pipe(p);
    return;
  }
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(root, "index.html"); // SPA fallback
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
