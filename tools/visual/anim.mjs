// Check that framer-motion entrance animations still play, and compare their timing between builds.
//   node anim.mjs <siteUrlA> [siteUrlB ...]
// For each target it samples opacity and translateY of the animated element every frame after the
// trigger. Times are aligned to the first frame where the element starts moving, so page-load jitter
// does not hide timing changes. "plays" = it moved and ended at opacity 1, translateY 0.
import { chromium } from "playwright";

const TARGETS = [
  { name: "hero title (on load)", path: "/", trigger: "load", selector: '[data-testid="hero-title"]' },
  { name: "events section (in view)", path: "/", trigger: "scroll", container: '[data-testid="events-section"]' },
  { name: "gallery section (in view)", path: "/", trigger: "scroll", container: '[data-testid="gallery-section"]' },
  // The panel inside the modal slides up; the backdrop fade is too short to sample reliably.
  { name: "booking modal panel (open)", path: "/", trigger: "modal", selector: '[data-testid="event-registration-modal"] > div' },
];
const AT = [0, 100, 250, 500, 800, 1200, 1800, 2500];

async function sample(page, sel, container, ms = 3500, waitForIt = false) {
  return page.evaluate(async ([sel, container, ms, waitForIt]) => {
    // waitForIt: poll every frame until the element exists, so sampling starts on its first frame.
    if (waitForIt) {
      const t = performance.now();
      while (!document.querySelector(sel) && performance.now() - t < 5000) await new Promise((r) => requestAnimationFrame(r));
    }
    const pick = () => {
      if (sel) return document.querySelector(sel);
      const root = document.querySelector(container);
      if (!root) return null;
      return [root, ...root.querySelectorAll("*")].find((el) => el.style.opacity !== "") || null;
    };
    const el = pick();
    if (!el) return null;
    const id = `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")}`;
    const out = [];
    const t0 = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        const cs = getComputedStyle(el);
        const m = new DOMMatrixReadOnly(cs.transform === "none" ? undefined : cs.transform);
        out.push([performance.now() - t0, Number(cs.opacity), m.m42]);
        if (performance.now() - t0 < ms) requestAnimationFrame(tick); else resolve();
      };
      tick();
    });
    return { id, out };
  }, [sel, container, ms, waitForIt]);
}

function at(samples, t) {
  let best = samples[0];
  for (const s of samples) if (s[0] <= t) best = s;
  return best;
}

const sites = process.argv.slice(2);
if (!sites.length) { console.error("usage: node anim.mjs <siteUrl> [siteUrl ...]"); process.exit(1); }
const browser = await chromium.launch();
let failed = false;
for (const t of TARGETS) {
  console.log(`\n${t.name}`);
  for (const site of sites) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.route(/posthog|emergent|\/api\/media\//, (r) => r.abort());
    const page = await context.newPage();
    let samples;
    if (t.trigger === "load") {
      // Start sampling as early as possible: the element appears once React renders.
      await page.goto(`${site}${t.path}`, { waitUntil: "commit" });
      await page.waitForSelector(t.selector, { state: "attached" });
      samples = await sample(page, t.selector, null);
    } else if (t.trigger === "scroll") {
      await page.goto(`${site}${t.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      // Select the target while it is still hidden, then bring it into view and sample.
      const p = sample(page, null, t.container);
      await page.evaluate((c) => document.querySelector(c).scrollIntoView({ block: "start" }), t.container);
      samples = await p;
    } else {
      await page.goto(`${site}${t.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      const p = sample(page, t.selector, null, 3500, true);
      await page.getByTestId("about-join-table").click();
      samples = await p;
    }
    await context.close();
    if (!samples) { console.log(`  ${site}  element not found`); failed = true; continue; }
    const { id, out } = samples;
    const [, o0, y0] = out[0];
    const startIdx = out.findIndex(([, o, y]) => Math.abs(o - o0) > 0.01 || Math.abs(y - y0) > 0.1);
    const end = out[out.length - 1];
    const plays = startIdx >= 0 && end[1] > 0.99 && Math.abs(end[2]) < 0.5;
    if (!plays) failed = true;
    const tStart = startIdx >= 0 ? out[startIdx][0] : NaN;
    const settled = out.find(([t, o, y]) => t >= tStart && o > 0.99 && Math.abs(y) < 0.5);
    const row = AT.map((ms) => { const s = at(out, tStart + ms); return `+${String(ms).padStart(4)}ms o=${s[1].toFixed(2)} y=${s[2].toFixed(1)}`; });
    console.log(`  ${site}  ${plays ? "plays" : "DOES NOT PLAY"}  <${id}>  from o=${o0.toFixed(2)} y=${y0.toFixed(1)}; `
      + `starts +${tStart.toFixed(0)}ms after trigger, settles ${settled ? (settled[0] - tStart).toFixed(0) : "never"}ms later`);
    console.log(`    ${row.join(" | ")}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
