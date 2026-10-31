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
3. **deploy**: checks that the four `VM_*` secrets exist, then over SSH: copies
   `docker-compose.yml` into `VM_APP_DIR`, checks that the VM's `.env` has the required settings
   (key names only; values are never printed), sets its `IMAGE_TAG` line, logs in to GHCR, `docker compose pull` +
   `up -d` of the exact `sha-<commit>` image, prunes old images of this app only (keeps the newest
   3), and waits up to 4 minutes for the container to be **healthy** and answer on
   `127.0.0.1:8002/api/`. If it doesn't, the job prints the container logs and fails.

## GitHub secrets (connection only)

Set them in GitHub: **repository → Settings → Secrets and variables → Actions → Secrets**.
The `GITHUB_TOKEN` is automatic. No app settings are stored in GitHub.

| Name | Required | What it is |
|---|---|---|
| `VM_HOST` | yes | Public IP or hostname of the Oracle VM |
| `VM_USER` | yes | SSH user on the VM (must be able to run `docker`) |
| `VM_SSH_KEY` | yes | Private key (full text, including the BEGIN/END lines) whose public key is in the user's `~/.ssh/authorized_keys` |
| `VM_APP_DIR` | yes | Deploy folder on the VM, e.g. `biraajo-backend` (relative paths are relative to the user's home; `~/...` works). The job fails if it is unset |
| `VM_SSH_FINGERPRINT` | recommended | SHA256 fingerprint of the VM's SSH host key; when set, the job refuses to connect to any other host |

## App settings: `.env` on the VM

All app settings live in `<VM_APP_DIR>/.env` on the VM. You create and edit this file by hand; the
pipeline never writes it. On every deploy the pipeline:
- fails if `.env` is missing, or if any **required** key below is missing or empty (it prints the key
  names, never the values);
- warns if `CORS_ORIGINS` is not set;
- replaces (or adds) only the `IMAGE_TAG='sha-<commit>'` line. Every other line, comments included,
  stays as you wrote it.

After editing `.env`, apply it without waiting for a deploy: `docker compose up -d` in `VM_APP_DIR`.

| Key | Required | What it is | Default in the app if unset |
|---|---|---|---|
| `MONGO_URL` | yes | Atlas connection string, `mongodb+srv://user:password@cluster.../` | — |
| `DB_NAME` | yes | Database name in Atlas, e.g. `biraajo` | — |
| `JWT_SECRET` | yes | Long random string used to sign admin login tokens (`openssl rand -hex 32`) | — |
| `ADMIN_EMAIL` | yes | Admin login email; the admin account is created from it on first start | — |
| `ADMIN_PASSWORD` | yes | Admin password (bcrypt uses at most the first 72 bytes) | — |
| `CORS_ORIGINS` | strongly recommended | Comma-separated site origins allowed to call the API, e.g. `https://biraajo.in,https://www.biraajo.in,https://<project>.vercel.app` | `*` (any origin) |
| `PUBLIC_SITE_URL` | recommended | Site URL used in links inside emails, e.g. `https://biraajo.in` | an old Emergent preview URL |
| `CLOUDINARY_URL` | for the Content Bank | `cloudinary://<api_key>:<api_secret>@<cloud_name>` (Cloudinary console → Settings → API Keys). Without it `/api/media/content-bank/...` returns 404 | — |
| `CONTENT_BANK_FOLDER` | no | Cloudinary Media Library folder served at `/api/media/content-bank/` | `biraajo/Biraajo Content Bank` |
| `UPI_ID` | no | UPI ID shown on the payment step | the chef's current UPI ID |
| `RESEND_API_KEY` | no | Resend API key; without it emails are skipped | — |
| `RESEND_FROM_EMAIL` | no | Sender, e.g. `Biraajo <hello@biraajo.in>` | `Biraajo <onboarding@resend.dev>` |
| `RESEND_REPLY_TO` | no | Reply-to address | none |
| `GOOGLE_SHEETS_WEBHOOK_URL` | no | Google Apps Script webhook for the bookings sheet; without it the sheet sync is skipped | — |
| `EMERGENT_LLM_KEY` | no, temporary | Login for Emergent object storage, which still serves the old `/api/media/biraajo/*` files and payment screenshots until the Cloudinary switch (plan phase A2). Without it those fail | — |
| `APP_NAME` | no | Prefix of the object-storage paths | `biraajo` |
| `IMAGE_TAG` | managed by the pipeline | Image tag to run; set on every deploy | `latest` |

**Quoting:** Compose reads `$` in unquoted or double-quoted values as a variable reference. Wrap any
value that contains `$` in single quotes, e.g. `ADMIN_PASSWORD='pa$$word'`. Leave an optional key out
entirely rather than writing it empty: an empty value replaces the app's default.

Template (`chmod 600 .env` after creating it):

```bash
# Required
MONGO_URL='mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority'
DB_NAME='biraajo'
JWT_SECRET='<openssl rand -hex 32>'
ADMIN_EMAIL='<admin email>'
ADMIN_PASSWORD='<admin password>'

# Recommended
CORS_ORIGINS='https://<site-domain>,https://www.<site-domain>,https://<project>.vercel.app'
PUBLIC_SITE_URL='https://<site-domain>'
CLOUDINARY_URL='cloudinary://<api_key>:<api_secret>@<cloud_name>'

# Optional (delete the line to use the app's default)
# UPI_ID='...'
# RESEND_API_KEY='...'
# RESEND_FROM_EMAIL='Biraajo <hello@<site-domain>>'
# RESEND_REPLY_TO='...'
# GOOGLE_SHEETS_WEBHOOK_URL='...'
# EMERGENT_LLM_KEY='...'
```

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
4. The deploy folder and its `.env` (the deploy fails until both exist):
   ```bash
   mkdir -p ~/biraajo-backend && cd ~/biraajo-backend   # set VM_APP_DIR to biraajo-backend
   nano .env                                            # fill in from the template above
   chmod 600 .env
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

## Content Bank (Cloudinary)

Everything inside the Cloudinary folder `biraajo/Biraajo Content Bank` (subfolders included) is
served at `/api/media/content-bank/<subfolders>/<display name>.<ext>`, for example
`https://api.<my-domain>/api/media/content-bank/Naani%20Ghar/Testimonials/IMG_0274.mp4`.

- The API answers with a redirect to Cloudinary's CDN (cached 5 minutes by browsers).
- Videos are always delivered as H.264 MP4 (`.mp4` or the original extension both work), so iPhone
  HEVC uploads play in every browser. The backend asks Cloudinary to prepare the MP4 as soon as it sees
  a new video; it is usually ready within seconds.
- New uploads appear within 30 seconds to 5 minutes; no deploy needed. Renaming or moving a file in the
  Media Library changes its URL.
- Free plan limits: 10 MB per image, 100 MB per video, 25 credits a month in total (storage, bandwidth,
  conversions). Usage: Cloudinary console → Dashboard.

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
re-run only **deploy**. It redeploys that run's exact image tag (it only changes `IMAGE_TAG` in `.env`).

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
