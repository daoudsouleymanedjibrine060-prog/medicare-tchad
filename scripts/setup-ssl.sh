#!/usr/bin/env bash
# Obtenir et installer un certificat Let's Encrypt pour MediCare Tchad
# Usage: ./scripts/setup-ssl.sh <domaine> <email>
# Exemple: ./scripts/setup-ssl.sh medicare-td.com admin@medicare-td.com
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domaine> <email>"
  echo "Exemple: $0 medicare-td.com admin@medicare-td.com"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Configuration SSL pour $DOMAIN ==="

# Installer certbot si absent
if ! command -v certbot &>/dev/null; then
  echo "Installation de certbot..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get update
    sudo apt-get install -y certbot
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y certbot
  else
    echo "Installez certbot manuellement puis relancez ce script."
    exit 1
  fi
fi

# Arrêter nginx pour libérer le port 80 (mode standalone)
echo "Arrêt temporaire de Nginx..."
docker compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

# Obtenir le certificat
echo "Obtention du certificat Let's Encrypt..."
sudo certbot certonly --standalone \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --preferred-challenges http

# Copier les certificats vers le dossier monté par Docker
mkdir -p nginx/ssl
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" nginx/ssl/fullchain.pem
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" nginx/ssl/privkey.pem
sudo chown "$(whoami):$(whoami)" nginx/ssl/*.pem
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem

echo "Certificats copiés dans nginx/ssl/"

# Passer en mode HTTPS et redémarrer
export NGINX_CONFIG=nginx.conf
docker compose -f docker-compose.prod.yml up -d nginx

echo ""
echo "=== SSL configuré avec succès ==="
echo "Site accessible sur : https://$DOMAIN"
echo ""
echo "Pour le renouvellement automatique, ajoutez au cron (crontab -e) :"
echo "0 3 * * * certbot renew --quiet --deploy-hook 'cd $ROOT_DIR && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/ && docker compose -f docker-compose.prod.yml restart nginx'"
