#!/usr/bin/env bash
# Génère un fichier .env production avec secrets aléatoires
# Usage: ./scripts/generate-env.sh <domaine> [fichier_sortie]
set -euo pipefail

DOMAIN="${1:-}"
OUT="${2:-.env}"

if [ -z "$DOMAIN" ]; then
  echo "Usage: $0 <domaine> [.env]"
  exit 1
fi

JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
JWT_REFRESH=$(openssl rand -base64 48 | tr -d '\n')
MYSQL_ROOT=$(openssl rand -base64 24 | tr -d '\n/+=' | head -c 32)
MYSQL_PASS=$(openssl rand -base64 24 | tr -d '\n/+=' | head -c 32)

cat > "$OUT" <<EOF
FRONTEND_URL=https://${DOMAIN}
DOMAIN=${DOMAIN}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT}
MYSQL_USER=medicare
MYSQL_PASSWORD=${MYSQL_PASS}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH}
SMS_ENABLED=false
AFRICASTALKING_USERNAME=
AFRICASTALKING_API_KEY=
AFRICASTALKING_SENDER_ID=MEDICARE
OPENAI_API_KEY=
VITE_GOOGLE_MAPS_API_KEY=
NGINX_CONFIG=nginx.bootstrap.conf
EOF

chmod 600 "$OUT" 2>/dev/null || true
echo "Fichier $OUT généré pour https://${DOMAIN}"
