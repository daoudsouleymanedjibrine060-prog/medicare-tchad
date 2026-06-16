#!/usr/bin/env bash
# Validation production complète
# Usage: ./scripts/validate-production.sh [base_url]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BASE_URL="${1:-${FRONTEND_URL:-http://localhost}}"
API_URL="${BASE_URL%/}/api/v1"

echo "=== Validation production MediCare Tchad ==="
echo "URL: $BASE_URL"
echo ""

# Health check
echo -n "Health check... "
if curl -sfk "${API_URL}/health" | grep -q '"status":"ok"'; then
  echo "OK"
else
  echo "ECHEC"
  exit 1
fi

# Frontend
echo -n "Frontend... "
if curl -sfk "${BASE_URL}/" | grep -qi "MediCare\|html"; then
  echo "OK"
else
  echo "ECHEC"
  exit 1
fi

# API tests
echo ""
echo "Tests API automatisés..."
if command -v node &>/dev/null; then
  node scripts/verify-api.js "$API_URL"
else
  echo "Node.js non installé — tests API ignorés"
fi

echo ""
echo "=== Validation terminée ==="
echo "Checklist manuelle :"
echo "  - https://${DOMAIN:-votre-domaine}/inscription"
echo "  - https://${DOMAIN:-votre-domaine}/connexion"
echo "  - https://${DOMAIN:-votre-domaine}/patient/medecins"
