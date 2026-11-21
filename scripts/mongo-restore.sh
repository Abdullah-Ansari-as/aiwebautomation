#!/usr/bin/env bash
# Restore a WebAIAutomation backup created by scripts/mongo-backup.sh.
#
# Usage:
#   sudo scripts/mongo-restore.sh <archive.gz> [--to <database>] [--drop] [--yes]
#
#   --to <database>  restore into a different database (default: the original,
#                    MONGODB_DB_NAME or webaiautomation). Restoring into a
#                    scratch name such as webaiautomation_restore_test is the
#                    safe way to verify a backup.
#   --drop           drop each collection in the target before restoring it.
#                    Without it, documents that already exist (same _id) are
#                    skipped and the existing version is kept; nothing is overwritten.
#   --yes            skip the confirmation prompt (for scripted restore tests).
#
# Settings: MONGO_RESTORE_CONFIG (default /etc/webaiautomation/mongorestore.yaml,
# mode 600) holds the connection URI of a user allowed to write the target
# database. Credentials are never passed on the command line.
set -euo pipefail

ARCHIVE=""
SOURCE_DB="${MONGODB_DB_NAME:-webaiautomation}"
TARGET_DB=""
DROP=""
ASSUME_YES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --to) TARGET_DB="${2:-}"; shift 2 ;;
    --drop) DROP="--drop"; shift ;;
    --yes) ASSUME_YES=1; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *) ARCHIVE="$1"; shift ;;
  esac
done

CONFIG="${MONGO_RESTORE_CONFIG:-/etc/webaiautomation/mongorestore.yaml}"
TARGET_DB="${TARGET_DB:-$SOURCE_DB}"

command -v mongorestore >/dev/null || { echo "mongorestore not found. Install the MongoDB Database Tools." >&2; exit 1; }
[[ -n "$ARCHIVE" && -f "$ARCHIVE" ]] || { echo "Archive not found. Usage: $0 <archive.gz> [--to <db>] [--drop] [--yes]" >&2; exit 1; }
[[ -r "$CONFIG" ]] || { echo "Config file $CONFIG is missing or unreadable." >&2; exit 1; }
if [[ "$(stat -c '%a' "$CONFIG")" != "600" && "$(stat -c '%a' "$CONFIG")" != "400" ]]; then
  echo "Refusing to run: $CONFIG must be mode 600 or 400 (it contains a password)." >&2
  exit 1
fi
for name in "$SOURCE_DB" "$TARGET_DB"; do
  [[ "$name" =~ ^[A-Za-z0-9_-]+$ ]] || { echo "Invalid database name: $name" >&2; exit 1; }
done

if [[ -f "$ARCHIVE.sha256" ]]; then
  (cd "$(dirname "$ARCHIVE")" && sha256sum --check --quiet "$(basename "$ARCHIVE").sha256") \
    || { echo "Checksum mismatch: the archive is corrupt or was modified." >&2; exit 1; }
  echo "Checksum OK"
else
  echo "Warning: no .sha256 file next to the archive; skipping checksum verification."
fi

echo "About to restore '$SOURCE_DB' from $ARCHIVE into database '$TARGET_DB'${DROP:+ (existing collections will be DROPPED first)}."
if [[ -z "$ASSUME_YES" ]]; then
  read -r -p "Type the target database name to continue: " answer
  [[ "$answer" == "$TARGET_DB" ]] || { echo "Cancelled."; exit 1; }
fi

mongorestore --config="$CONFIG" --archive="$ARCHIVE" --gzip \
  --nsInclude="${SOURCE_DB}.*" --nsFrom="${SOURCE_DB}.*" --nsTo="${TARGET_DB}.*" \
  $DROP --quiet
echo "Restore finished into '$TARGET_DB'."
