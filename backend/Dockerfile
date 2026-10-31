# syntax=docker/dockerfile:1

# ---- Stage 1: dependencies ----
FROM python:3.12-slim AS deps
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
# Requirements first: this layer is rebuilt only when dependencies change, not on every source edit.
COPY requirements.txt /tmp/requirements.txt
RUN python -m venv /opt/venv \
 && /opt/venv/bin/pip install -r /tmp/requirements.txt

# ---- Stage 2: runtime ----
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"
WORKDIR /app

RUN useradd --create-home --uid 10001 app
COPY --from=deps /opt/venv /opt/venv
COPY --chown=app:app server.py site_defaults.py content_bank.py ./

USER app
EXPOSE 8000

# GET /api/ is the app's existing health route ({"status":"ok"}). The slim image has no curl/wget.
# Startup seeds and migrates the database before serving, so give it a generous start period.
HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/', timeout=4).status == 200 else 1)"

# One worker: startup migrations must not run twice in parallel.
# --proxy-headers: Nginx on the VM forwards X-Forwarded-For/-Proto. The container only listens on
# loopback via the published port, and Nginx reaches it through the Docker gateway, hence "*".
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]
