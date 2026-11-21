#!/usr/bin/env bash
# Back up the WebAIAutomation MongoDB database with mongodump.
#
# Usage:
#   sudo scripts/mongo-backup.sh
#
# Settings (environment variables, all optional):
#   MONGO_BACKUP_CONFIG  mongodump config file holding the connection URI
#                        (default /etc/webaiautomation/mongodump.yaml, mode 600)
#   MONGODB_DB_NAME      database to back up (default webaiautomation)
#   BACKUP_DIR           where archives are written (default /var/backups/webaiautomation)
#   RETENTION_DAYS       if set, delete archives in BACKUP_DIR older than this many days.
#                        Unset by default: nothing is ever deleted automatically.
#
# Credentials never appear on the command line or in logs: mongodump reads
# them from the config file (YAML with a single `uri:` line), so they are not
# visible in `ps` output.
set -euo pipefail
umask 077

CONFIG="${MONGO_BACKUP_CONFIG:-/etc/webaiautomation/mongodump.yaml}"
DB_NAME="${MONGODB_DB_NAME:-webaiautomation}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/webaiautomation}"

command -v mongodump >/dev/null || { echo "mongodump not found. Install the MongoDB Database Tools." >&2; exit 1; }
[[ -r "$CONFIG" ]] || { echo "Config file $CONFIG is missing or unreadable." >&2; exit 1; }
if [[ "$(stat -c '%a' "$CONFIG")" != "600" && "$(stat -c '%a' "$CONFIG")" != "400" ]]; then
  echo "Refusing to run: $CONFIG must be mode 600 or 400 (it contains a password)." >&2
  exit 1
fi
[[ "$DB_NAME" =~ ^[A-Za-z0-9_-]+$ ]] || { echo "Invalid database name." >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="$BACKUP_DIR/${DB_NAME}-${STAMP}.archive.gz"
PARTIAL="$ARCHIVE.partial"

echo "Backing up database '$DB_NAME' to $ARCHIVE"
if ! mongodump --config="$CONFIG" --db="$DB_NAME" --archive="$PARTIAL" --gzip --quiet; then
  rm -f "$PARTIAL"
  echo "Backup FAILED." >&2
  exit 1
fi
[[ -s "$PARTIAL" ]] || { rm -f "$PARTIAL"; echo "Backup FAILED: archive is empty." >&2; exit 1; }

mv "$PARTIAL" "$ARCHIVE"
(cd "$BACKUP_DIR" && sha256sum "$(basename "$ARCHIVE")" > "$(basename "$ARCHIVE").sha256")
echo "Backup OK: $(du -h "$ARCHIVE" | cut -f1) — checksum in $(basename "$ARCHIVE").sha256"

if [[ -n "${RETENTION_DAYS:-}" ]]; then
  [[ "$RETENTION_DAYS" =~ ^[0-9]+$ && "$RETENTION_DAYS" -ge 1 ]] || { echo "RETENTION_DAYS must be a whole number >= 1." >&2; exit 1; }
  echo "Retention policy: removing archives older than $RETENTION_DAYS days"
  find "$BACKUP_DIR" -maxdepth 1 -type f \( -name "${DB_NAME}-*.archive.gz" -o -name "${DB_NAME}-*.archive.gz.sha256" \) -mtime "+$RETENTION_DAYS" -print -delete
fi
