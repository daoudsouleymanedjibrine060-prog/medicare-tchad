# Déploiement Production — MediCare Tchad

Guide complet pour mettre la plateforme en ligne (**Oracle Cloud Always Free** recommandé + Docker + HTTPS).

Stack : **React** (frontend) + **Node.js / Express** (API) + **MySQL 8**.

## Architecture

```
Internet (HTTPS)
    ↓
Nginx (80 → redirect, 443 → TLS)
    ├── /api/*  → API Express (port 4000)
    ├── /*      → Frontend React (nginx static)
    └── MySQL   (réseau Docker interne uniquement)
```

## Mise en ligne complète (Oracle Cloud — gratuit)

1. Créer la VM Always Free : [ORACLE_CLOUD.md](ORACLE_CLOUD.md) et [VPS_ONBOARDING.md](VPS_ONBOARDING.md)
2. Ouvrir TCP **22 / 80 / 443** dans la Security List OCI
3. Depuis Windows :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\vps-deploy-all.ps1 -VpsHost VOTRE_IP -SshUser ubuntu
```

Installation manuelle sur la VM :

```bash
./scripts/vps-first-install.sh --domain medicare-tchad.com --email admin@medicare-tchad.com
# ou avec sslip.io : --domain 129-146-10-20.sslip.io
```

## Prérequis VPS

- **Fournisseur** : Oracle Cloud Always Free (prioritaire) — ou tout VPS Ubuntu compatible Docker
- **OS** : Ubuntu 22.04+ (utilisateur SSH Oracle : **`ubuntu`**)
- **Ressources** : idéal 2+ OCPU / ≥ 8 Go RAM (shape A1.Flex) ; minimum pour démo ~2 Go
- **Logiciels** : Docker + Docker Compose plugin
- **Domaine** : DNS `A` vers l'IP **ou** `x-x-x-x.sslip.io` (gratuit)
- **Ports ouverts** : 22 (SSH), 80 (HTTP), 443 (HTTPS) — **Security List OCI + UFW**
- **Ne pas exposer** : 3306 (MySQL reste interne)

## Étape 1 — Préparer le serveur (Oracle Ubuntu)

```bash
# Connexion SSH (Oracle Ubuntu — pas root)
ssh ubuntu@votre-ip-publique

# Installer Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# se reconnecter pour prendre le groupe docker

# Cloner le projet
sudo git clone https://github.com/daoudsouleymanedjibrine060-prog/medicare-tchad.git /opt/medicare-tchad
sudo chown -R ubuntu:ubuntu /opt/medicare-tchad
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
| SSH timeout Oracle | Security List sans port **22** — [ORACLE_CLOUD.md](ORACLE_CLOUD.md) |
| Site inaccessible (80/443) | Ingress Security List + `ufw allow 80,443` sur la VM |
| Nginx ne démarre pas (SSL) | Certificats manquants → utiliser `nginx.bootstrap.conf` ou lancer `setup-ssl.sh` |
| Erreur CORS | Vérifier `FRONTEND_URL=https://...` dans `.env`, redémarrer l'API |
| API ne démarre pas | `docker logs medicare-api-prod` — vérifier MySQL et `DATABASE_URL` |
| Pas de créneaux RDV | Seed + planning assistant (cases cochées) |
| Certbot échoue | DNS non propagé, port 80 bloqué, ou Nginx encore actif |
