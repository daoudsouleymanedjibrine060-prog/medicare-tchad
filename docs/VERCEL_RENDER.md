# Déploiement Vercel + Render + MySQL

Architecture gratuite pour MediCare Tchad :

| Composant | Hébergeur |
|-----------|-----------|
| Frontend React | [Vercel](https://vercel.com) |
| API Express | [Render](https://render.com) |
| MySQL 8 | [Aiven](https://aiven.io) ou [Railway](https://railway.app) |

Vercel proxy `/api/*` vers Render (voir [`vercel.json`](../vercel.json)) — pas de CORS côté navigateur.

## 1. MySQL externe

Render ne propose pas MySQL. Créez une base MySQL 8 :

### Option A — Aiven (recommandé)

1. Compte sur [console.aiven.io](https://console.aiven.io)
2. **Create service** → MySQL → plan free si disponible
3. Copier **Service URI** : `mysql://USER:PASS@HOST:PORT/defaultdb?ssl-mode=REQUIRED`
4. Créer la base `medicare_tchad` via console ou :
   ```sql
   CREATE DATABASE medicare_tchad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
5. Adapter l'URL : `mysql://USER:PASS@HOST:PORT/medicare_tchad?ssl-mode=REQUIRED`

### Option B — Railway

1. [railway.app](https://railway.app) → New Project → MySQL
2. Copier `DATABASE_URL` depuis Variables

## 2. API sur Render

### Via Blueprint (recommandé)

1. [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. **New Blueprint Instance** → repo GitHub `medicare-tchad`
3. Fichier [`render.yaml`](../render.yaml) détecté automatiquement
4. Renseigner manuellement :
   - `DATABASE_URL` — URL MySQL (étape 1)
   - `FRONTEND_URL` — `https://VOTRE-APP.vercel.app` (après Vercel)

### Via Web Service manuel

| Champ | Valeur |
|-------|--------|
| Root Directory | `backend` |
| Build | `npm ci && npx prisma generate && npm run build && npx prisma migrate deploy` |
| Start | `node dist/index.js` |
| Health Check | `/api/v1/health` |

Variables obligatoires : `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`, `SMS_ENABLED=false`

### Seed (une fois)

Render Shell ou local avec `DATABASE_URL` prod :

```bash
cd backend
npm run db:seed
```

Comptes démo : voir [`MANUEL_UTILISATEUR.md`](MANUEL_UTILISATEUR.md).

**Limite free** : l'API s'endort après ~15 min sans trafic (1re requête lente).

## 3. Frontend sur Vercel

1. [vercel.com/new](https://vercel.com/new) → Import repo GitHub
2. **Root Directory** : racine du repo (défaut)
3. Variable d'environnement :
   - `VITE_API_URL` = `/api/v1`
4. Deploy

Mettre à jour [`vercel.json`](../vercel.json) si l'URL Render diffère de `medicare-tchad-api.onrender.com` :

```json
"destination": "https://VOTRE-SERVICE.onrender.com/api/$1"
```

## 4. Finaliser CORS

Sur Render, `FRONTEND_URL` doit être l'URL Vercel exacte (sans slash final), ex. `https://medicare-tchad.vercel.app`.

Redéployez Render après modification.

## 5. Vérification

Script automatique (après `.env.deploy` configuré) :

```powershell
.\scripts\deploy-cloud.ps1
```

Ou vérification manuelle :

```powershell
.\scripts\deploy-vercel-render.ps1
```

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Patient | patient@medicare-td.test | Patient@123 |
| Médecin | dr.hassan@medicare-td.test | Admin@123 |

## Dépannage

| Problème | Solution |
|----------|----------|
| 502 / timeout API | Render free en cold start — attendre 30–60 s |
| Erreur DB migrate | Vérifier `DATABASE_URL`, SSL, base `medicare_tchad` |
| Login échoue | Seed exécuté ? `FRONTEND_URL` correct ? |
| `/api` 404 sur Vercel | Vérifier rewrite dans `vercel.json` |

## Alternative : tout sur Oracle

Pour une API toujours active sans cold start : [`ORACLE_CLOUD.md`](ORACLE_CLOUD.md).
