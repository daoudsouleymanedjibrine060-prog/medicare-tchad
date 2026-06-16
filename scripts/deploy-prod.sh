#!/usr/bin/env bash
# Déploiement production MediCare Tchad
# Usage: ./scripts/deploy-prod.sh [--seed]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

SEED=false
if [ "${1:-}" = "--seed" ]; then
  SEED=true
fi

echo "=== Déploiement MediCare Tchad (production) ==="

# Vérifier .env
if [ ! -f .env ]; then
  echo "Fichier .env manquant. Copie depuis .env.example..."
  cp .env.example .env
  echo ""
  echo "ERREUR: Éditez .env avec vos valeurs de production avant de relancer."
  echo "Variables obligatoires : FRONTEND_URL, JWT_SECRET, JWT_REFRESH_SECRET, MYSQL_*"
  exit 1
fi

# Charger DOMAIN depuis .env si défini
set -a
# shellcheck disable=SC1091
source .env
set +a

# Valider les variables critiques
missing=()
[ -z "${JWT_SECRET:-}" ] || [ "${#JWT_SECRET}" -lt 32 ] && missing+=("JWT_SECRET (min 32 caractères)")
[ -z "${JWT_REFRESH_SECRET:-}" ] || [ "${#JWT_REFRESH_SECRET}" -lt 32 ] && missing+=("JWT_REFRESH_SECRET (min 32 caractères)")
[ -z "${MYSQL_ROOT_PASSWORD:-}" ] && missing+=("MYSQL_ROOT_PASSWORD")
[ -z "${MYSQL_PASSWORD:-}" ] && missing+=("MYSQL_PASSWORD")
[ -z "${FRONTEND_URL:-}" ] && missing+=("FRONTEND_URL")

if [ "${#missing[@]}" -gt 0 ]; then
  echo "Variables .env manquantes ou invalides :"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

if [[ "${FRONTEND_URL}" != https://* ]]; then
  echo "ATTENTION: FRONTEND_URL devrait commencer par https:// en production (actuel: $FRONTEND_URL)"
fi

# Choisir la config Nginx selon présence des certificats
if [ -f nginx/ssl/fullchain.pem ] && [ -f nginx/ssl/privkey.pem ]; then
  export NGINX_CONFIG=nginx.conf
  echo "Mode: HTTPS (certificats détectés)"
else
  export NGINX_CONFIG=nginx.bootstrap.conf
  echo "Mode: HTTP bootstrap (pas de certificats SSL)"
  echo "Après configuration DNS, lancez: ./scripts/setup-ssl.sh <domaine> <email>"
fi

echo "Build et démarrage des conteneurs..."
docker compose -f docker-compose.prod.yml up -d --build

echo "Attente du démarrage de l'API..."
for i in $(seq 1 30); do
  if docker exec medicare-api-prod wget -qO- http://localhost:4000/api/v1/health 2>/dev/null | grep -q '"status":"ok"'; then
    echo "API prête."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERREUR: L'API n'a pas démarré dans les temps. Vérifiez: docker logs medicare-api-prod"
    exit 1
  fi
  sleep 2
done

# Seed initial si demandé
if [ "$SEED" = true ]; then
  echo "Exécution du seed initial..."
  docker exec medicare-api-prod npx tsx prisma/seed.ts
  echo "Seed terminé."
fi

# Health check via Nginx
HEALTH_URL="http://localhost/api/v1/health"
if [ "$NGINX_CONFIG" = "nginx.conf" ]; then
  HEALTH_URL="https://localhost/api/v1/health"
fi

echo ""
echo "=== Déploiement terminé ==="
echo "Health check local : curl -k $HEALTH_URL"
echo "Health check public : curl ${FRONTEND_URL}/api/v1/health"
echo ""
echo "Vérification API complète :"
echo "  node scripts/verify-api.js ${FRONTEND_URL}/api/v1"
echo ""
echo "Comptes démo (après --seed) :"
echo "  Patient   : patient@medicare-td.test / Patient@123"
echo "  Assistant : assistant1@medicare-td.test / Admin@123"
echo "  Admin     : admin@medicare-td.test / Admin@123"
