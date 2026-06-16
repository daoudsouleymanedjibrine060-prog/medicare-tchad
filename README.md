# MediCare Tchad

Plateforme web de gestion des rendez-vous médicaux pour le Tchad (indicatif +235).

Fonctionnalités : patients, médecins, assistants, administrateurs, rendez-vous, laboratoires, carte hybride, chatbot.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Backend:** Node.js + Express + Prisma
- **Base de données:** MySQL 8
- **Cartographie:** Google Maps (hybride) ou OpenStreetMap + Leaflet
- **SMS:** Africa's Talking (+235)
- **Chatbot:** OpenAI API (fallback local)

## Démarrage rapide (Docker)

```bash
cd medicare-tchad
docker compose up -d
# Première installation uniquement :
docker exec medicare-api npm run db:seed
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api/v1/health
- MySQL: localhost:3306

### Vérification API

Une fois l'API démarrée avec le seed :

```bash
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

## Production

```bash
cp .env.example .env
# Éditer .env (FRONTEND_URL, secrets JWT, MySQL)
chmod +x scripts/*.sh
./scripts/deploy-prod.sh --seed
./scripts/setup-ssl.sh votre-domaine.com admin@votre-domaine.com
```

Voir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) pour le déploiement complet et [docs/VPS_ONBOARDING.md](docs/VPS_ONBOARDING.md) pour **mettre le site en ligne** (VPS + domaine + GitHub).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API REST](docs/API.md)
- [Déploiement](docs/DEPLOYMENT.md)
- [Mémoire Tchad](docs/MEMOIRE_TCHAD.md)

## Licence

MIT
