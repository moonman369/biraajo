"""Create the Biraajo backend's MongoDB collections and indexes (e.g. on a fresh Atlas database).

Run by hand from a laptop or the VM (not part of the Docker image):

    cd backend
    python scripts/init_db.py --dry-run     # show what would be created, change nothing
    python scripts/init_db.py --yes         # create what is missing

MONGO_URL and DB_NAME come from the environment; backend/.env is loaded if present (values already
in the environment win). Safe to run many times: existing collections and indexes are left alone,
and no document is inserted, changed or deleted.

The lists below mirror server.py. Collections: every db.<name> in server.py / site_defaults.py.
Indexes: the ones _setup_indexes() creates at startup, with pymongo's default names, so the app's
own create_index calls find them already in place.
"""
import argparse
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from pymongo import ASCENDING, MongoClient
from pymongo.errors import OperationFailure, PyMongoError

COLLECTIONS = [
    "admins",
    "contacts",
    "events",
    "gallery",
    "menus",
    "migrations",
    "offsite_bookings",
    "pageviews",
    "registrations",
    "registrations_archive",
    "settings",
    "site_content",
    "site_content_history",
    "subscribers",
]

# (collection, field, unique) - same as server.py _setup_indexes()
INDEXES = [
    ("admins", "email", True),
    ("subscribers", "email", True),
    ("pageviews", "day", False),
    ("pageviews", "ts", False),
]


def describe_host(url: str) -> str:
    """Host part of a MongoDB URL without user or password."""
    rest = re.sub(r"^mongodb(\+srv)?://", "", url)
    rest = rest.rsplit("@", 1)[-1]          # drop user:password@
    return re.split(r"[/?]", rest, 1)[0] or "(unknown)"


def main() -> int:
    parser = argparse.ArgumentParser(description="Create Biraajo MongoDB collections and indexes.")
    parser.add_argument("--yes", action="store_true", help="actually create missing collections and indexes")
    parser.add_argument("--dry-run", action="store_true", help="only report what would be created")
    args = parser.parse_args()

    load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)
    url = os.environ.get("MONGO_URL", "").strip()
    db_name = os.environ.get("DB_NAME", "").strip()
    if not url or not db_name:
        print("MONGO_URL and DB_NAME must be set (environment or backend/.env).", file=sys.stderr)
        return 2

    print(f"Cluster host : {describe_host(url)}")
    print(f"Database     : {db_name}")
    print(f"Mode         : {'dry run (no changes)' if args.dry_run else 'create missing'}", flush=True)
    if not args.dry_run and not args.yes:
        print("\nNothing done. Re-run with --yes to continue, or --dry-run to preview.", file=sys.stderr)
        return 2

    try:
        client = MongoClient(url, serverSelectionTimeoutMS=10000)
        db = client[db_name]
        existing = set(db.list_collection_names())
    except PyMongoError as e:
        print(f"Cannot reach the database: {e.__class__.__name__}: {e}", file=sys.stderr)
        return 1

    created, already, idx_created, idx_existing, errors = [], [], [], [], []

    for name in COLLECTIONS:
        if name in existing:
            already.append(name)
            continue
        if not args.dry_run:
            try:
                db.create_collection(name)
            except OperationFailure as e:
                if e.code != 48:  # 48 = NamespaceExists (created meanwhile)
                    errors.append(f"collection {name}: {e}")
                    continue
        created.append(name)

    for coll, field, unique in INDEXES:
        label = f"{coll}.{field}{' (unique)' if unique else ''}"
        current = {} if coll not in existing else {
            ix["name"]: ix for ix in db[coll].list_indexes()
        }
        same_key = [ix for ix in current.values() if list(ix["key"].items()) == [(field, ASCENDING)]]
        if same_key:
            if bool(same_key[0].get("unique")) == unique:
                idx_existing.append(label)
            else:
                errors.append(f"index {label}: an index on {coll}.{field} exists with different options "
                              f"({same_key[0]['name']}); left unchanged")
            continue
        if not args.dry_run:
            try:
                db[coll].create_index([(field, ASCENDING)], unique=unique)
            except OperationFailure as e:
                errors.append(f"index {label}: {e}")
                continue
        idx_created.append(label)

    verb = "would be created" if args.dry_run else "created"
    print(f"\nCollections {verb} ({len(created)}): {', '.join(created) or '-'}")
    print(f"Collections already there ({len(already)}): {', '.join(already) or '-'}")
    print(f"Indexes {verb} ({len(idx_created)}): {', '.join(idx_created) or '-'}")
    print(f"Indexes already there ({len(idx_existing)}): {', '.join(idx_existing) or '-'}")
    for err in errors:
        print(f"ERROR: {err}", file=sys.stderr)
    client.close()
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
