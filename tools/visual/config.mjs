// Shared settings for the visual baseline tools (plan B0).
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(TOOL_DIR, "..", "..");

// Dumps, fixtures and PNGs live OUTSIDE git.
export const OUT_DIR = path.resolve(process.env.VISUAL_OUT || path.join(REPO_ROOT, "..", "biraajo-visual"));
export const DUMP_FILE = path.join(OUT_DIR, "dummy-db.archive");
export const FIXTURE_FILE = path.join(OUT_DIR, "fixture.json");

export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const API_URL = (process.env.API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export const DB_NAME = "biraajo_dev";
// Browser clock is frozen at this instant on every run.
export const FIXED_TIME = "2026-10-28T12:00:00+05:30";

export const WIDTHS = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];

// The 15 routes from src/App.js. ":id" is filled from the fixture booking.
export const PUBLIC_ROUTES = [
  "/",
  "/events",
  "/about-the-chef",
  "/supper-club/naani-ghar",
  "/supper-club/barsaat",
  "/supper-club/when-there-wasnt-enough",
  "/booking/:id",
  "/suppers",
  "/menus",
  "/menus/naani-ghar",
  "/menus/barsaat",
  "/menus/when-there-wasnt-enough",
  "/admin/login",
];
export const ADMIN_ROUTES = ["/admin", "/admin/edit"];
export const ADMIN_TABS = [
  "overview", "traffic", "events", "registrations", "offsite",
  "menu", "newsletter", "contacts", "gallery",
];

export function readBackendEnv() {
  const env = {};
  const text = fs.readFileSync(path.join(REPO_ROOT, "backend", ".env"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  if (!/_(dev|test)$/.test(env.DB_NAME || "")) {
    throw new Error(`backend/.env DB_NAME is ${JSON.stringify(env.DB_NAME)}; refusing to touch it.`);
  }
  return env;
}

export function routeSlug(route) {
  return route === "/" ? "home" : route.replace(/^\//, "").replace(/[/:]/g, "_");
}
