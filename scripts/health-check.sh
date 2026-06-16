#!/usr/bin/env bash
# Vérification santé production — pour cron ou monitoring
# Usage: ./scripts/health-check.sh [url]
# Exemple cron : */5 * * * * /opt/medicare-tchad/scripts/health-check.sh https://medicare-td.com/api/v1/health
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

URL="${1:-}"

if [ -z "$URL" ] && [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  URL="${FRONTEND_URL}/api/v1/health"
fi

URL="${URL:-http://localhost/api/v1/health}"

RESPONSE=$(curl -sf -k "$URL" 2>/dev/null || echo "FAIL")

if echo "$RESPONSE" | grep -q '"status":"ok"'; then
  echo "[OK] $URL — $(date -Iseconds)"
  exit 0
else
  echo "[FAIL] $URL — $(date -Iseconds)"
  echo "Réponse: $RESPONSE"
  exit 1
fi
