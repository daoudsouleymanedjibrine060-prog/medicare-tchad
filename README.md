# MediCare Tchad

Plateforme web de **gestion des rendez-vous médicaux** pour le Tchad (indicatif +235).

**Version :** v1.1.0

### Périmètre v1.0.0

- Patients, assistants, administrateurs, super-administrateurs
- Recherche de médecins, prise et gestion de rendez-vous
- Laboratoires, carte hybride, messages, notifications, chatbot
- Tableau de bord et administration

**v1.1.0** : dossiers médicaux, ordonnances, portail médecin autonome (`/connexion/medecin`). Les assistants conservent aussi la gestion des médecins.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Backend:** Node.js + Express + Prisma
- **Base de données:** MySQL 8
- **Cartographie:** Google Maps (hybride) ou OpenStreetMap + Leaflet
- **SMS:** Africa's Talking (+235)
- **Chatbot:** OpenAI API (fallback local)
- **Hébergement prod (gratuit):** [Vercel](https://vercel.com) (frontend) + [Render](https://render.com) (API) + MySQL externe — voir [`docs/VERCEL_RENDER.md`](docs/VERCEL_RENDER.md). Alternative : Oracle Cloud — [`docs/ORACLE_CLOUD.md`](docs/ORACLE_CLOUD.md)

## Démarrage rapide (Windows — une commande)

Depuis la racine du projet (`medicare-tchad`) :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-dev.ps1
```

Ou via npm :

```powershell
npm run start:dev
```

Le script démarre Docker Desktop si besoin, lance la stack, vérifie l'API et affiche les URLs.

- Frontend: http://localhost:5173
- API: http://localhost:4000/api/v1/health
- Patient démo: `patient@medicare-td.test` / `Patient@123`

## Démarrage rapide (Docker manuel)

```powershell
cd medicare-tchad
docker compose up -d
```

Première installation uniquement (base vide) :

```powershell
docker exec medicare-api npm run db:seed
```

### Vérification API

```powershell
npm run verify:api
```

## Démarrage local (sans Docker)

### Prérequis

- Node.js 20+
- MySQL 8

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | superadmin@medicare-td.test | Admin@123 |
| Admin | admin@medicare-td.test | Admin@123 |
| Assistant | assistant1@medicare-td.test | Admin@123 |
| Patient | patient@medicare-td.test | Patient@123 |

## Production (Oracle Cloud Always Free — gratuit)

Hébergement recommandé : **Oracle Cloud Always Free** (VM Ubuntu + Docker). Stack inchangée : React + Node.js + MySQL.

```powershell
# Windows : guide + clé SSH, puis déploiement
powershell -ExecutionPolicy Bypass -File scripts\vps-oracle-create.ps1
powershell -ExecutionPolicy Bypass -File scripts\vps-deploy-all.ps1 -VpsHost VOTRE_IP -SshUser ubuntu
```

Sur la VM :

```bash
cp .env.example .env
# Éditer .env (FRONTEND_URL, secrets JWT, MySQL)
chmod +x scripts/*.sh
./scripts/deploy-prod.sh --seed
./scripts/setup-ssl.sh votre-domaine.com admin@votre-domaine.com
```

Voir :

- [docs/VERCEL_RENDER.md](docs/VERCEL_RENDER.md) — déploiement Vercel + Render + MySQL (gratuit)
- [docs/ORACLE_CLOUD.md](docs/ORACLE_CLOUD.md) — guide Oracle Always Free
- [docs/VPS_ONBOARDING.md](docs/VPS_ONBOARDING.md) — VM + DNS + GitHub
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Docker prod, SSL, backups

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API REST](docs/API.md)
- [Manuel utilisateur](docs/MANUEL_UTILISATEUR.md)
- [Changelog](CHANGELOG.md)
- [Vercel + Render](docs/VERCEL_RENDER.md)
- [Oracle Cloud (gratuit)](docs/ORACLE_CLOUD.md)
- [Déploiement](docs/DEPLOYMENT.md)
- [Mémoire Tchad](docs/MEMOIRE_TCHAD.md)

## Licence

MIT
