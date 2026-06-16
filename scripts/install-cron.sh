#!/usr/bin/env bash
# Installe les tâches cron pour backup, health check et SSL
# Usage: ./scripts/install-cron.sh [domaine]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${1:-}"

if [ -z "$DOMAIN" ] && [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

DOMAIN="${DOMAIN:-localhost}"

CRON_FILE="/tmp/medicare-cron-$$"
cat > "$CRON_FILE" <<EOF
# MediCare Tchad — tâches automatiques
0 2 * * * ${ROOT_DIR}/scripts/backup-mysql.sh >> /var/log/medicare-backup.log 2>&1
*/5 * * * * ${ROOT_DIR}/scripts/health-check.sh >> /var/log/medicare-health.log 2>&1
0 3 * * * certbot renew --quiet --deploy-hook 'cd ${ROOT_DIR} && cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem nginx/ssl/ 2>/dev/null; cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem nginx/ssl/ 2>/dev/null; docker compose -f docker-compose.prod.yml restart nginx' 2>/dev/null || true
EOF

if crontab -l 2>/dev/null | grep -q "medicare-tchad"; then
  echo "Cron MediCare déjà installé."
else
  (crontab -l 2>/dev/null; cat "$CRON_FILE") | crontab -
  echo "Cron installé : backup 2h, health 5min, SSL renew 3h"
fi

rm -f "$CRON_FILE"
