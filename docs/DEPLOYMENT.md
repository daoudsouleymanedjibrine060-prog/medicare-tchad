# Déploiement Production — MediCare Tchad

Guide complet pour mettre la plateforme en ligne (VPS + Docker + HTTPS).

## Architecture

```
Internet (HTTPS)
    ↓
Nginx (80 → redirect, 443 → TLS)
    ├── /api/*  → API Express (port 4000)
    ├── /*      → Frontend React (nginx static)
    └── MySQL   (réseau Docker interne uniquement)
```

## Mise en ligne complète (VPS)

Guide détaillé pour obtenir VPS + domaine : [VPS_ONBOARDING.md](VPS_ONBOARDING.md)

Installation automatique sur le VPS (une commande) :

```bash
./scripts/vps-first-install.sh --domain medicare-tchad.com --email admin@medicare-tchad.com
```

## Prérequis VPS

- **OS** : Ubuntu 22.04+ ou Debian 12
- **Ressources** : 2 vCPU, 4 GB RAM minimum
- **Logiciels** : Docker + Docker Compose plugin
- **Domaine** : enregistrement DNS `A` pointant vers l'IP du VPS
- **Ports ouverts** : 22 (SSH), 80 (HTTP), 443 (HTTPS)
- **Ne pas exposer** : 3306 (MySQL reste interne)

## Étape 1 — Préparer le serveur

```bash
# Connexion SSH
ssh root@votre-ip-vps

# Installer Docker (Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Cloner le projet
git clone https://github.com/VOTRE_ORG/medicare-tchad.git /opt/medicare-tchad
cd /opt/medicare-tchad

# Pare-feu (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Étape 2 — Configurer DNS

Chez votre registrar (OVH, Cloudflare, etc.) :

| Type | Nom | Valeur |
|------|-----|--------|
| A | @ | IP_DU_VPS |
| A | www | IP_DU_VPS |

Attendre la propagation DNS (5 min à 48 h). Vérifier :

```bash
dig +short medicare-td.com
```

## Étape 3 — Variables d'environnement

```bash
cp .env.example .env
nano .env
```

Variables **obligatoires** :

| Variable | Description |
|----------|-------------|
| `FRONTEND_URL` | `https://votre-domaine.com` (CORS API) |
| `DOMAIN` | `votre-domaine.com` |
| `JWT_SECRET` | Chaîne aléatoire ≥ 32 caractères |
| `JWT_REFRESH_SECRET` | Chaîne aléatoire ≥ 32 caractères |
| `MYSQL_ROOT_PASSWORD` | Mot de passe root MySQL |
| `MYSQL_PASSWORD` | Mot de passe utilisateur `medicare` |

Générer des secrets :

```bash
openssl rand -base64 48
```

## Étape 4 — Premier déploiement (HTTP bootstrap)

Sans certificats SSL, le déploiement démarre en mode HTTP :

```bash
chmod +x scripts/*.sh
./scripts/deploy-prod.sh --seed
```

Vérifier localement sur le VPS :

```bash
curl http://localhost/api/v1/health
```

## Étape 5 — Activer HTTPS (Let's Encrypt)

Une fois le DNS propagé :

```bash
./scripts/setup-ssl.sh medicare-td.com admin@medicare-td.com
```

Ce script :
1. Arrête Nginx temporairement
2. Obtient le certificat via Certbot (standalone)
3. Copie les certificats dans `nginx/ssl/`
4. Redémarre Nginx en mode HTTPS

Vérifier :

```bash
curl https://medicare-td.com/api/v1/health
```

## Étape 6 — Validation complète

```bash
# Tests API automatisés (33 tests)
node scripts/verify-api.js https://medicare-td.com/api/v1

# Health check
./scripts/health-check.sh
```

Checklist manuelle : voir [TESTING.md](TESTING.md) section « Validation production en ligne ».

## Comptes de démonstration (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Patient | patient@medicare-td.test | Patient@123 |
| Assistant | assistant1@medicare-td.test | Admin@123 |
| Admin | admin@medicare-td.test | Admin@123 |
| Super Admin | superadmin@medicare-td.test | Admin@123 |

## Migrations base de données

Les migrations Prisma s'exécutent **automatiquement** au démarrage de l'API (`prisma migrate deploy`).

Seed manuel (première installation uniquement) :

```bash
docker exec medicare-api-prod npx tsx prisma/seed.ts
```

## Sauvegarde MySQL (quotidienne)

```bash
./scripts/backup-mysql.sh
```

Cron recommandé (`crontab -e`) :

```cron
0 2 * * * /opt/medicare-tchad/scripts/backup-mysql.sh >> /var/log/medicare-backup.log 2>&1
```

Les 14 dernières sauvegardes sont conservées dans `backups/`.

## Renouvellement SSL

Certbot renouvelle automatiquement les certificats. Ajouter au cron :

```cron
0 3 * * * certbot renew --quiet --deploy-hook 'cd /opt/medicare-tchad && cp /etc/letsencrypt/live/DOMAIN/fullchain.pem nginx/ssl/ && cp /etc/letsencrypt/live/DOMAIN/privkey.pem nginx/ssl/ && docker compose -f docker-compose.prod.yml restart nginx'
```

Remplacer `DOMAIN` par votre domaine.

## Monitoring 24h/24

Les conteneurs redémarrent automatiquement (`restart: always`).

Health check périodique (`crontab -e`) :

```cron
*/5 * * * * /opt/medicare-tchad/scripts/health-check.sh >> /var/log/medicare-health.log 2>&1
```

Services externes gratuits : [UptimeRobot](https://uptimerobot.com) sur `https://votre-domaine.com/api/v1/health`.

## Logs

```bash
docker logs medicare-api-prod -f
docker logs medicare-nginx -f
docker logs medicare-mysql-prod -f
```

## Mise à jour

```bash
cd /opt/medicare-tchad
git pull
./scripts/deploy-prod.sh
```

## Dépannage

| Problème | Solution |
|----------|----------|
| Nginx ne démarre pas (SSL) | Certificats manquants → utiliser `nginx.bootstrap.conf` ou lancer `setup-ssl.sh` |
| Erreur CORS | Vérifier `FRONTEND_URL=https://...` dans `.env`, redémarrer l'API |
| API ne démarre pas | `docker logs medicare-api-prod` — vérifier MySQL et `DATABASE_URL` |
| Pas de créneaux RDV | Seed + planning assistant (cases cochées) |
| Certbot échoue | DNS non propagé, port 80 bloqué, ou Nginx encore actif |
