// Dummy database snapshot for repeatable captures.
//   node db.mjs prepare   -> adds the fixture event + booking via the API, then dumps biraajo_dev
//   node db.mjs restore   -> restores biraajo_dev from that dump (capture.mjs calls this)
// Uses the mongo container from the root docker-compose.yml, so no local Mongo tools are needed.
import fs from "node:fs";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { API_URL, DB_NAME, DUMP_FILE, FIXTURE_FILE, OUT_DIR, REPO_ROOT, readBackendEnv } from "./config.mjs";

function compose(args, { stdin, stdout } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn("docker", ["compose", "exec", "-T", "mongo", ...args], {
      cwd: REPO_ROOT,
      stdio: [stdin ? "pipe" : "ignore", stdout ? "pipe" : "inherit", "inherit"],
    });
    if (stdin) fs.createReadStream(stdin).pipe(p.stdin);
    if (stdout) p.stdout.pipe(fs.createWriteStream(stdout));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`docker compose exit ${code}`))));
  });
}

async function api(method, path, body, token) {
  const r = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${await r.text()}`);
  return r.json();
}

async function prepare() {
  const env = readBackendEnv();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { access_token: token } = await api("POST", "/auth/login", {
    email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD,
  });
  // Fixed future date so the event stays "upcoming" for the server's real clock.
  const event = await api("POST", "/events", {
    title: "Visual Fixture Supper",
    date: "2027-03-14",
    time: "19:30",
    venue: "Fixture Venue, Mumbai",
    description: "Fixture event used only for screenshot baselines.",
    price: 2500,
    image_url: "/api/media/biraajo/media/6a6d9d936ab71fa4.jpg",
    tag: "Supper Club",
  }, token);
  const reg = await api("POST", `/events/${event.id}/register`, {
    event_id: event.id,
    full_name: "Fixture Guest",
    email: "fixture.guest@example.com",
    phone: "9000000000",
    menu_preference: "Vegetarian",
    dietary_preferences: "None",
    guests: 2,
  });
  fs.writeFileSync(FIXTURE_FILE, JSON.stringify({ event_id: event.id, registration_id: reg.id }, null, 2));
  await compose(["mongodump", "--quiet", `--db=${DB_NAME}`, "--archive"], { stdout: DUMP_FILE });
  console.log(`fixture: ${FIXTURE_FILE}\ndump: ${DUMP_FILE} (${fs.statSync(DUMP_FILE).size} bytes)`);
}

export async function restore() {
  if (!fs.existsSync(DUMP_FILE)) throw new Error(`No dump at ${DUMP_FILE}. Run: node db.mjs prepare`);
  await compose(["mongorestore", "--quiet", "--drop", "--archive", `--nsInclude=${DB_NAME}.*`], { stdin: DUMP_FILE });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cmd = process.argv[2];
  if (cmd === "prepare") await prepare();
  else if (cmd === "restore") { await restore(); console.log("restored", DB_NAME); }
  else { console.error("usage: node db.mjs prepare|restore"); process.exit(1); }
}
