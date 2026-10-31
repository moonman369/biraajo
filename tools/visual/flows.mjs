// Smoke test of the user flows that matter for the frontend migration (plan B3/B4 gates):
// booking modal, payment screenshot upload (modal + /booking/:id), admin login, admin screenshot viewer.
//   node flows.mjs
// Restores the dummy DB before and after. Prints one line per check; exit 1 if any check FAILs.
// Checks that need working storage are reported as STORAGE (expected while A2 is not done)
// as long as the frontend sent the right request and handled the error.
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import fs from "node:fs";
import { FIXTURE_FILE, REPO_ROOT, SITE_URL, readBackendEnv } from "./config.mjs";
import { restore } from "./db.mjs";

const env = readBackendEnv();
const fixture = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf8"));
const results = [];
const log = (status, name, detail = "") => {
  results.push(status);
  console.log(`${status.padEnd(8)} ${name}${detail ? ` - ${detail}` : ""}`);
};

const tinyPng = (() => {
  const p = new PNG({ width: 8, height: 8 });
  p.data.fill(200);
  return PNG.sync.write(p);
})();
const file = { name: "receipt.png", mimeType: "image/png", buffer: tinyPng };

function mongosh(js) {
  return new Promise((resolve, reject) => {
    const p = spawn("docker", ["compose", "exec", "-T", "mongo", "mongosh", "--quiet", env.DB_NAME, "--eval", js],
      { cwd: REPO_ROOT, stdio: ["ignore", "ignore", "inherit"] });
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error(`mongosh exit ${c}`))));
  });
}

// Waits for the payment-screenshot POST triggered by `act` and classifies the outcome.
async function uploadCheck(page, name, act, confirmedTestId) {
  const respP = page.waitForResponse((r) => r.url().includes("/payment-screenshot") && r.request().method() === "POST", { timeout: 20000 });
  await act();
  const resp = await respP;
  const status = resp.status();
  if (status === 200) {
    await page.getByTestId(confirmedTestId).waitFor({ timeout: 10000 });
    log("PASS", name, `POST ${new URL(resp.url()).pathname} -> 200, confirmation shown`);
  } else {
    const body = await resp.text();
    if (status === 500 && /Storage not configured/.test(body)) log("STORAGE", name, `request sent correctly, backend: 500 ${body}`);
    else log("FAIL", name, `POST -> ${status} ${body}`);
  }
}

await restore();
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route(/posthog|emergent/, (r) => r.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // 1. Booking modal: the home page "join the table" opens it for the first upcoming event (the fixture).
  await page.goto(`${SITE_URL}/`);
  await page.getByTestId("about-join-table").click();
  const modal = page.getByTestId("event-registration-modal");
  await modal.waitFor({ timeout: 10000 });
  await page.getByTestId("reg-fullname-input").fill("Flow Guest");
  await page.getByTestId("reg-email-input").fill("flow.guest@example.com");
  await page.getByTestId("reg-phone-input").fill("9000000001");
  await page.getByTestId("reg-menu-vegetarian").click();
  await page.getByTestId("reg-dietary-input").fill("None");
  const regP = page.waitForResponse((r) => /\/api\/events\/[^/]+\/register$/.test(new URL(r.url()).pathname));
  await page.getByTestId("event-registration-submit").click();
  const reg = await regP;
  if (reg.status() === 200) {
    await page.getByTestId("reg-payment-step").waitFor({ timeout: 10000 });
    log("PASS", "booking modal", `register -> 200, payment step shown (${await page.getByTestId("payment-total").innerText()})`);
  } else {
    log("FAIL", "booking modal", `register -> ${reg.status()} ${await reg.text()}`);
  }

  // 2. Screenshot upload inside the modal.
  if (reg.status() === 200) {
    await uploadCheck(page, "modal screenshot upload",
      () => page.getByTestId("screenshot-file-input").setInputFiles(file), "reg-confirmation");
  }

  // 3. Screenshot upload on /booking/:id.
  await page.goto(`${SITE_URL}/booking/${fixture.registration_id}`);
  await page.getByTestId("booking-pay-section").waitFor({ timeout: 10000 });
  await uploadCheck(page, "booking page screenshot upload",
    () => page.getByTestId("booking-file-input").setInputFiles(file), "booking-confirmed-block");

  // If no upload succeeded, mark the fixture as paid with a stored path; the admin "Receipt" button
  // only renders for confirmed registrations that have one (checked in 5).
  await mongosh(`db.registrations.updateOne({id: ${JSON.stringify(fixture.registration_id)}, payment_screenshot_path: ""},
    {$set: {payment_status: "confirmed", payment_screenshot_path: "biraajo/payments/${fixture.registration_id}/flow.png"}})`);

  // 4. Admin login through the form.
  await page.goto(`${SITE_URL}/admin/login`);
  await page.getByTestId("admin-email-input").fill(env.ADMIN_EMAIL);
  await page.getByTestId("admin-password-input").fill(env.ADMIN_PASSWORD);
  await page.getByTestId("admin-login-button").click();
  await page.getByTestId("admin-dashboard").waitFor({ timeout: 10000 });
  log(new URL(page.url()).pathname === "/admin" ? "PASS" : "FAIL", "admin login", `landed on ${new URL(page.url()).pathname}`);

  // 5. Admin screenshot viewer.
  await page.getByTestId("admin-tab-registrations").click();
  const viewBtn = page.getByTestId(`view-screenshot-${fixture.registration_id}`);
  await viewBtn.waitFor({ timeout: 10000 });
  const shotP = page.waitForRequest((r) => r.url().includes(`/api/registrations/${fixture.registration_id}/screenshot`));
  const shotRespP = page.waitForResponse((r) => r.url().includes(`/api/registrations/${fixture.registration_id}/screenshot`));
  await viewBtn.click();
  const shotReq = await shotP;
  const shotResp = await shotRespP;
  const auth = (await shotReq.allHeaders()).authorization || "";
  if (!auth.startsWith("Bearer ")) {
    log("FAIL", "admin screenshot viewer", "request had no Bearer token");
  } else if (shotResp.status() === 200) {
    await page.getByTestId("screenshot-viewer").waitFor({ timeout: 10000 });
    log("PASS", "admin screenshot viewer", "GET with Bearer token -> 200, viewer shown");
  } else if (shotResp.status() === 500) {
    await page.getByText("Screenshot not available").waitFor({ timeout: 10000 });
    log("STORAGE", "admin screenshot viewer", "GET with Bearer token sent; backend 500, UI shows 'Screenshot not available'");
  } else {
    log("FAIL", "admin screenshot viewer", `GET -> ${shotResp.status()}`);
  }

  log(errors.length ? "FAIL" : "PASS", "no page errors", errors.join(" | "));
} finally {
  await browser.close();
  await restore();
}
process.exit(results.includes("FAIL") ? 1 : 0);
