# Deploying the backend

An always-on Docker container on the Oracle Cloud VM, behind Nginx, with MongoDB Atlas as the
database. GitHub Actions ([`.github/workflows/deploy-backend.yml`](../.github/workflows/deploy-backend.yml))
checks the code, builds the image, pushes it to GHCR and SSHes into the VM to run it.

| Setting | Value |
|---|---|
| Image | `ghcr.io/moonman369/biraajo-backend` (`latest` and `sha-<commit>`), linux/amd64 + linux/arm64 |
| Container | `biraajo-backend` (listens on 8000 inside) |
| Host port | `127.0.0.1:8002` (8000 and 8001 belong to other services on the VM) |
| Health check | `GET /api/` → `{"status":"ok","name":"Biraajo API"}` |
| VM folder | the `VM_APP_DIR` secret (holds `docker-compose.yml` and `.env`) |

## When it runs

- Push to `main` that changes `backend/**` or the workflow file. Frontend changes never trigger it.
- Manually: GitHub → Actions → "Backend - build & deploy to Oracle VM" → Run workflow.

Jobs:
1. **test**: installs the dependencies, compiles and imports the app with dummy settings (no network,
   no keys), and runs `backend/tests/unit/` if it exists. The HTTP tests in `backend/tests/*.py` need a
   running server and database, so CI does not run them.
2. **build-and-push**: builds `backend/Dockerfile` for amd64 and arm64 and pushes `latest` and
   `sha-<commit>` to GHCR with the built-in `GITHUB_TOKEN`.
3. **deploy**: checks that the required secrets and variables exist, then over SSH: writes
   `docker-compose.yml` and `.env` into `VM_APP_DIR`, logs in to GHCR, `docker compose pull` +
   `up -d` of the exact `sha-<commit>` image, prunes old images of this app only (keeps the newest
   3), and waits up to 4 minutes for the container to be **healthy** and answer on
   `127.0.0.1:8002/api/`. If it doesn't, the job prints the container logs and fails.

## Secrets and variables

Set them in GitHub: **repository → Settings → Secrets and variables → Actions**. Secrets go on
the *Secrets* tab, variables on the *Variables* tab. The `GITHUB_TOKEN` is automatic.

Values are written to `.env` as `KEY='value'`, so a value **must not contain a single quote `'` or a
newline** (the deploy fails with the setting's name if one does). Optional settings that are not set
are left out of `.env`, so the app's built-in default applies.

### Secrets

| Name | Required | What it is |
|---|---|---|
| `VM_HOST` | yes | Public IP or hostname of the Oracle VM |
| `VM_USER` | yes | SSH user on the VM (must be able to run `docker`) |
| `VM_SSH_KEY` | yes | Private key (full text, including the BEGIN/END lines) whose public key is in the user's `~/.ssh/authorized_keys` |
| `VM_APP_DIR` | yes | Deploy folder on the VM, e.g. `biraajo-backend` (relative paths are relative to the user's home; `~/...` works). The job fails if it is unset |
| `VM_SSH_FINGERPRINT` | recommended | SHA256 fingerprint of the VM's SSH host key; when set, the job refuses to connect to any other host |
| `MONGO_URL` | yes | Atlas connection string, `mongodb+srv://user:password@cluster.../` |
| `JWT_SECRET` | yes | Long random string used to sign admin login tokens (`openssl rand -hex 32`) |
| `ADMIN_EMAIL` | yes | Admin login email; the admin account is created from it on first start |
| `ADMIN_PASSWORD` | yes | Admin password (bcrypt uses at most the first 72 bytes) |
| `RESEND_API_KEY` | no | Resend API key; without it emails are skipped |
| `GOOGLE_SHEETS_WEBHOOK_URL` | no | Google Apps Script webhook for the bookings sheet; without it the sheet sync is skipped |
| `EMERGENT_LLM_KEY` | no, temporary | Login for Emergent object storage, which still serves `/api/media/*` and payment screenshots until the Cloudinary switch (plan phase A2). Without it media and screenshot uploads fail. Remove after A2 |

### Variables

| Name | Required | What it is | Default in the app if unset |
|---|---|---|---|
| `DB_NAME` | yes | Database name in Atlas, e.g. `biraajo` | — |
| `CORS_ORIGINS` | yes | Comma-separated site origins allowed to call the API, e.g. `https://biraajo.in,https://www.biraajo.in,https://<project>.vercel.app` | `*` (the workflow requires it so production never runs with `*`) |
| `PUBLIC_SITE_URL` | no | Site URL used in links inside emails, e.g. `https://biraajo.in` | an old Emergent preview URL: **set this** |
| `UPI_ID` | no | UPI ID shown on the payment step | the chef's current UPI ID |
| `RESEND_FROM_EMAIL` | no | Sender, e.g. `Biraajo <hello@biraajo.in>` | `Biraajo <onboarding@resend.dev>` |
| `RESEND_REPLY_TO` | no | Reply-to address | none |
| `APP_NAME` | no | Prefix of the object-storage paths | `biraajo` |

## One-time VM setup

1. Docker Engine with the Compose plugin (`docker compose version` must work). Let the deploy user
   run Docker without sudo, then log out and back in:
   ```bash
   sudo usermod -aG docker "$USER"
   ```
2. A deploy key for GitHub Actions (on your machine):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions biraajo-backend" -f biraajo_deploy -N ""
   ssh-copy-id -i biraajo_deploy.pub <VM_USER>@<VM_HOST>     # or append the .pub to ~/.ssh/authorized_keys
   ```
   Put the content of `biraajo_deploy` (the private key) in the `VM_SSH_KEY` secret, then delete the local copy.
3. The host fingerprint for `VM_SSH_FINGERPRINT` (on the VM):
   ```bash
   ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub | awk '{print $2}'   # SHA256:...
   ```
4. The deploy folder (the workflow also creates it if missing):
   ```bash
   mkdir -p ~/biraajo-backend       # and set VM_APP_DIR to biraajo-backend
   ```
5. **MongoDB Atlas → Network Access → Add IP Address**: add the VM's public IP
   (`curl -s https://ifconfig.me` on the VM). Without it the container cannot reach the database,
   never becomes healthy, and the deploy fails.
6. **Before the first deploy, the database must already hold the restored production data,
   including the `migrations` collection** (plan, Cutover C1). On an empty database the app seeds an
   admin, gallery and menu and replays all startup migrations, some of which insert or overwrite content.
7. Point `api.<my-domain>` (DNS A record) at the VM, then set up Nginx and the certificate (below).
   On Oracle Cloud, ports 80 and 443 must be open both in the VCN security list and in the VM's own
   firewall (`iptables`/`firewalld`).

## Nginx and HTTPS

`/etc/nginx/sites-available/api.<my-domain>` (enable it with a symlink in `sites-enabled`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.<my-domain>;

    # Gallery videos up to 50 MB are uploaded through the API. The default 1 MB breaks them.
    client_max_body_size 60m;

    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.<my-domain> --redirect
```

Certbot adds the HTTPS server block and an HTTP→HTTPS redirect with `return 301`. **Change that
`301` to `308`** in the port-80 block and reload Nginx: a 301 turns a POST into a GET, so bookings and
uploads sent to `http://` fail with 405. Check:

```bash
curl -s https://api.<my-domain>/api/              # {"status":"ok","name":"Biraajo API"}
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://api.<my-domain>/api/auth/login   # 308
```

## Day to day

```bash
cd ~/biraajo-backend
docker compose ps                     # STATUS shows (healthy)
docker compose logs -f --tail 100
```

## Rolling back

Every build is kept in GHCR as `sha-<full commit hash>` (GitHub → your profile → Packages →
`biraajo-backend`, or the commit list on `main`). The VM also keeps the newest 3 images locally.

**Option A, from GitHub (recommended):** open the last good run of the workflow → Re-run jobs →
re-run only **deploy**. It redeploys that run's exact image tag and rewrites `.env` from the current
secrets.

**Option B, on the VM:**
```bash
cd ~/biraajo-backend
IMAGE_TAG=sha-<good commit> docker compose pull      # skip if the image is still local
IMAGE_TAG=sha-<good commit> docker compose up -d
docker compose ps                                    # wait for (healthy)
```
The shell variable overrides `IMAGE_TAG` in `.env` for that command only. A plain
`docker compose up -d` run later would switch back to the tag in `.env`, so also set `IMAGE_TAG` in
`.env` to the good tag. The next push to `main` deploys the new commit again.

The container's restart policy is `unless-stopped`, so it comes back after a VM reboot on its own.
