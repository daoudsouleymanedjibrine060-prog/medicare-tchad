#!/usr/bin/env bash
# Sauvegarde quotidienne MySQL — MediCare Tchad
# Usage: ./scripts/backup-mysql.sh
# Cron recommandé : 0 2 * * * /opt/medicare-tchad/scripts/backup-mysql.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  echo "Fichier .env introuvable"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/medicare_tchad_${TIMESTAMP}.sql"

echo "Sauvegarde MySQL vers $BACKUP_FILE..."
docker exec medicare-mysql-prod mysqldump \
  -u "${MYSQL_USER:-medicare}" \
  -p"${MYSQL_PASSWORD}" \
  medicare_tchad > "$BACKUP_FILE"

gzip "$BACKUP_FILE"
echo "Sauvegarde terminée : ${BACKUP_FILE}.gz"

# Conserver les 14 dernières sauvegardes
ls -t "$BACKUP_DIR"/medicare_tchad_*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
