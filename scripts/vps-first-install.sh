#!/usr/bin/env bash
# Installation complète MediCare Tchad sur un VPS Ubuntu/Debian
# Usage:
#   ./scripts/vps-first-install.sh --domain medicare-tchad.com --email admin@medicare-tchad.com
#   ./scripts/vps-first-install.sh --repo https://github.com/user/medicare-tchad.git --domain ... --email ...
set -euo pipefail

REPO=""
DOMAIN=""
EMAIL=""
INSTALL_DIR="/opt/medicare-tchad"
SKIP_SSL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --skip-ssl) SKIP_SSL=true; shift ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
done

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 --domain <domaine> --email <email> [--repo <url_git>] [--skip-ssl]"
  exit 1
fi

echo "=== Installation MediCare Tchad sur VPS ==="
echo "Domaine: $DOMAIN"
echo "Email SSL: $EMAIL"

# Docker
if ! command -v docker &>/dev/null; then
  echo "Installation de Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# Pare-feu
if command -v ufw &>/dev/null; then
  ufw allow 22/tcp 2>/dev/null || true
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
  ufw --force enable 2>/dev/null || true
fi

# Clone ou mise à jour
if [ -n "$REPO" ]; then
  if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Mise à jour du dépôt..."
    cd "$INSTALL_DIR"
    git pull
  else
    echo "Clone du dépôt..."
    git clone "$REPO" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  fi
else
  INSTALL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
  cd "$INSTALL_DIR"
fi

chmod +x scripts/*.sh

# Générer .env production
if [ ! -f .env ] || grep -q "change-me" .env 2>/dev/null; then
  echo "Génération du fichier .env..."
  ./scripts/generate-env.sh "$DOMAIN" .env
fi

# Déploiement HTTP + seed
export NGINX_CONFIG=nginx.bootstrap.conf
./scripts/deploy-prod.sh --seed

# Vérifier DNS (optionnel)
echo "Vérification DNS pour $DOMAIN..."
RESOLVED=$(dig +short "$DOMAIN" 2>/dev/null | head -1 || true)
PUBLIC_IP=$(curl -sf ifconfig.me 2>/dev/null || curl -sf icanhazip.com 2>/dev/null || true)
if [ -n "$RESOLVED" ] && [ -n "$PUBLIC_IP" ] && [ "$RESOLVED" != "$PUBLIC_IP" ]; then
  echo "ATTENTION: DNS ($RESOLVED) != IP serveur ($PUBLIC_IP)"
  echo "Configurez un enregistrement A @ -> $PUBLIC_IP avant SSL"
  SKIP_SSL=true
fi

# HTTPS
if [ "$SKIP_SSL" = false ]; then
  echo "Configuration SSL..."
  ./scripts/setup-ssl.sh "$DOMAIN" "$EMAIL"
  export NGINX_CONFIG=nginx.conf
  docker compose -f docker-compose.prod.yml up -d nginx
fi

# Cron
./scripts/install-cron.sh "$DOMAIN"

# Validation
./scripts/validate-production.sh "https://${DOMAIN}"

echo ""
echo "=== Installation terminée ==="
echo "Site public : https://${DOMAIN}"
echo "Comptes démo : patient@medicare-td.test / Patient@123"
