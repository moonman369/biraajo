"""Shared test setup: load backend/.env, refuse to run against real data, default to a local server."""
import os
from pathlib import Path

import pytest
from dotenv import dotenv_values

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
_env = dotenv_values(_ENV_FILE)

_db_name = (_env.get("DB_NAME") or "").strip()
if not (_db_name.endswith("_dev") or _db_name.endswith("_test")):
    pytest.exit(
        f"Refusing to run tests: DB_NAME in {_ENV_FILE} is {_db_name!r}; it must end with _dev or _test.",
        returncode=2,
    )

for _k, _v in _env.items():
    if _v is not None:
        os.environ.setdefault(_k, _v)

os.environ.setdefault("REACT_APP_BACKEND_URL", "http://localhost:8000")
