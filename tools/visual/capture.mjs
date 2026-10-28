// Capture every route at 390px and 1440px, plus admin tabs and /admin/edit.
//   node capture.mjs <label>        -> PNGs in <OUT_DIR>/<label>/
// Needs: backend on API_URL (biraajo_dev), the frontend on SITE_URL, a dump from `node db.mjs prepare`.
//
// Repeatability:
// - biraajo_dev is restored from the same dump before the run
// - `Date` fixed at FIXED_TIME. Only Date: Playwright's page.clock.setFixedTime also stalls
//   framer-motion (cards stayed at opacity 0), so performance.now and timers stay real.
// - /api/media/** and every external image get the same generated placeholder; videos get 404 (poster shows)
// - analytics beacons are answered locally so the run writes nothing
// - third-party scripts (emergent, posthog) are blocked; Google Fonts load normally
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import {
  ADMIN_ROUTES, ADMIN_TABS, API_URL, FIXED_TIME, FIXTURE_FILE, OUT_DIR, PUBLIC_ROUTES,
  SITE_URL, WIDTHS, readBackendEnv, routeSlug,
} from "./config.mjs";
import { restore } from "./db.mjs";

const label = process.argv[2];
if (!label) { console.error("usage: node capture.mjs <label>"); process.exit(1); }
const outDir = path.join(OUT_DIR, label);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i;
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

function placeholderPng(w = 1200, h = 800) {
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const band = Math.floor(x / 80 + y / 80) % 2;
      png.data[i] = 90 + Math.floor((x / w) * 60) + band * 12;
      png.data[i + 1] = 40 + Math.floor((y / h) * 40) + band * 12;
      png.data[i + 2] = 30 + band * 12;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}
const PLACEHOLDER = placeholderPng();
// Every non-app host the pages try to reach, written to _hosts.txt (B2 gate: no emergent/posthog).
const externalHosts = new Map();

async function routeNetwork(context) {
  const site = new URL(SITE_URL);
  const api = new URL(API_URL);
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const sameOrigin = url.host === site.host || url.host === api.host
      || (url.hostname === "localhost" && [site.port, api.port].includes(url.port));
    if (url.pathname.startsWith("/api/media/")) {
      if (VIDEO_EXT.test(url.pathname)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ status: 200, contentType: "image/png", body: PLACEHOLDER });
    }
    if (url.pathname === "/api/analytics/track") {
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    }
    if (sameOrigin || url.protocol === "data:" || url.protocol === "blob:") return route.continue();
    externalHosts.set(url.hostname, (externalHosts.get(url.hostname) || 0) + 1);
    if (FONT_HOSTS.includes(url.hostname)) return route.continue();
    if (req.resourceType() === "image" || IMAGE_EXT.test(url.pathname)) {
      return route.fulfill({ status: 200, contentType: "image/png", body: PLACEHOLDER });
    }
    if (req.resourceType() === "media" || VIDEO_EXT.test(url.pathname)) {
      return route.fulfill({ status: 404, body: "" });
    }
    return route.abort(); // emergent-main.js, posthog, anything else third-party
  });
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  // Walk the page so every `whileInView` (all are once: true) fires, then go back to the top.
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // Lazy images in view must finish before moving on, or a tile can be captured empty.
    const imagesInViewDone = async () => {
      for (let t = 0; t < 40; t++) {
        const pending = [...document.images].filter((img) => {
          const r = img.getBoundingClientRect();
          return !img.complete && r.bottom > -200 && r.top < window.innerHeight + 200;
        });
        if (!pending.length) return;
        await sleep(100);
      }
    };
    const step = Math.max(200, Math.floor(window.innerHeight * 0.5));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await sleep(150);
      await imagesInViewDone();
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await sleep(300);
    await imagesInViewDone();
    // Any reveal that was missed (framer leaves inline opacity 0) gets scrolled to directly.
    for (let pass = 0; pass < 5; pass++) {
      const hidden = [...document.querySelectorAll('[style*="opacity"]')]
        .filter((el) => el.style.opacity === "0" && el.getClientRects().length);
      if (!hidden.length) break;
      for (const el of hidden) {
        el.scrollIntoView({ block: "center" });
        await sleep(250);
        await imagesInViewDone();
      }
      await sleep(600);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
}

async function shoot(page, name) {
  await page.screenshot({
    path: path.join(outDir, `${name}.png`),
    fullPage: true,
    animations: "disabled",
    caret: "hide",
  });
}

async function newContext(browser, w, token) {
  const context = await browser.newContext({
    viewport: { width: w.width, height: w.height },
    deviceScaleFactor: 1,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    colorScheme: "dark",
  });
  await routeNetwork(context);
  await context.addInitScript(([t, iso]) => {
    if (t) localStorage.setItem("biraajo_admin_token", t);
    const fixed = new Date(iso).getTime();
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(fixed); }
      static now() { return fixed; }
    }
    globalThis.Date = FixedDate;
  }, [token || null, FIXED_TIME]);
  return context;
}

async function main() {
  const env = readBackendEnv();
  const fixture = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf8"));
  await restore();

  const login = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
  });
  if (!login.ok) throw new Error(`admin login failed: ${login.status}`);
  const { access_token: token } = await login.json();

  // Fixed text rasterization; otherwise single glyphs differ run to run.
  const browser = await chromium.launch({
    args: [
      "--font-render-hinting=none", "--disable-lcd-text", "--disable-font-subpixel-positioning",
      "--force-color-profile=srgb", "--disable-gpu", "--disable-partial-raster",
    ],
  });
  const problems = [];
  let count = 0;
  try {
    for (const w of WIDTHS) {
      for (const [routes, tok] of [[PUBLIC_ROUTES, null], [ADMIN_ROUTES, token]]) {
        const context = await newContext(browser, w, tok);
        const page = await context.newPage();
        page.on("pageerror", (e) => problems.push(`[${w.name}] ${page.url()} pageerror: ${e.message}`));
        // Requests to the app or API that fail at the network level (Windows sometimes returns
        // ERR_NO_BUFFER_SPACE under load). The page is reloaded and captured again.
        let netFailures = 0;
        page.on("requestfailed", (r) => {
          const u = r.url();
          if (!VIDEO_EXT.test(u) && (u.startsWith(SITE_URL) || u.includes(":8000"))) netFailures++;
        });
        page.on("console", (m) => {
          if (m.type() !== "error") return;
          const src = m.location()?.url || "";
          // Expected noise from our own mocks (videos 404, third-party aborted); net:: errors are retried above.
          if (/Failed to load resource/.test(m.text())
            && (VIDEO_EXT.test(src) || /net::ERR_/.test(m.text()) || !src.startsWith(SITE_URL) && !src.includes(":8000"))) return;
          problems.push(`[${w.name}] ${page.url()} console: ${m.text()} ${src}`);
        });
        const capture = async (name, load) => {
          for (let attempt = 1; ; attempt++) {
            const before = netFailures;
            await load();
            await settle(page);
            if (netFailures === before) break;
            if (attempt === 3) { problems.push(`[${w.name}] ${name}: network failures after 3 attempts`); break; }
            console.log(`retry ${name} (network failure)`);
          }
          await shoot(page, name);
          count++;
        };
        for (const route of routes) {
          const target = route.replace(":id", fixture.registration_id);
          const open = () => page.goto(`${SITE_URL}${target}`, { waitUntil: "domcontentloaded" });
          await capture(`${routeSlug(route)}-${w.name}`, open);
          if (new URL(page.url()).pathname !== target) {
            problems.push(`[${w.name}] ${target} redirected to ${page.url()}`);
          }
          if (route === "/admin") {
            for (const tab of ADMIN_TABS) {
              let first = true;
              await capture(`admin_tab_${tab}-${w.name}`, async () => {
                if (!first) { await open(); await settle(page); }
                first = false;
                await page.getByTestId(`admin-tab-${tab}`).click();
              });
            }
          }
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(outDir, "_hosts.txt"),
    [...externalHosts].sort().map(([h, n]) => `${h} ${n}`).join("\n") + "\n");
  fs.writeFileSync(path.join(outDir, "_problems.txt"), problems.join("\n") + (problems.length ? "\n" : ""));
  console.log(`${count} screenshots in ${outDir}`);
  console.log(problems.length ? `${problems.length} console/page problems (see _problems.txt)` : "no console/page problems");
  if (problems.length) process.exitCode = 1;
}

await main();
