# Architecture MediCare Tchad

## Vue d'ensemble

MediCare Tchad est une application full-stack monorepo composée de :

- `frontend/` — SPA React (Vite)
- `backend/` — API REST Express
- `mysql` — Base de données relationnelle

## Flux d'authentification

1. L'utilisateur se connecte via `POST /api/v1/auth/login`
2. L'API retourne un **access token JWT** (15 min) et stocke un **refresh token** en cookie httpOnly
3. Le frontend envoie `Authorization: Bearer <token>` sur chaque requête
4. En cas d'expiration, `POST /api/v1/auth/refresh` renouvelle l'access token

## Rôles (RBAC)

| Rôle | Accès |
|------|-------|
| PATIENT | Recherche médecins, RDV, profil, carte, laboratoires, chatbot |
| DOCTOR | Profil médecin (géré par admin) |
| ASSISTANT | Planning, validation RDV, horaires |
| ADMIN | Gestion utilisateurs, établissements, laboratoires, stats |
| SUPER_ADMIN | Gestion admins, export CSV, supervision |

## Workflow rendez-vous

```
PENDING → (assistant confirme) → CONFIRMED → (après consultation) → COMPLETED
        → (assistant refuse)  → REJECTED
        → (patient annule)    → CANCELLED
```

Notifications in-app + SMS déclenchées à chaque changement de statut.

## Types d'établissements

- `HOPITAL` — HGRN, HME, hôpitaux provinciaux
- `CLINIQUE` — cliniques privées
- `CABINET` — cabinets médicaux
- `CENTRE_SANTE` — centres de santé de district
- `LABORATOIRE` — laboratoires d'analyses médicales

## Cartographie hybride

- Si `VITE_GOOGLE_MAPS_API_KEY` est définie : carte Google Maps centrée sur le Tchad
- Sinon : OpenStreetMap/Leaflet (léger, sans clé API)
- Chaque marqueur propose un lien **« Ouvrir dans Google Maps »** pour l'itinéraire

## Cron rappels

Job quotidien à 8h UTC : envoie SMS + notification aux patients avec RDV confirmé le lendemain.

## Optimisations connexions lentes

- Lazy loading des routes React (y compris bundle carte séparé)
- Pagination client sur listes médecins et laboratoires
- Code splitting Vite (vendor, charts, maps, google-maps)
- Compression gzip (Nginx)
- React Query cache 5 min
- Skeleton loaders sur les listes
- Indicateur hors ligne dans le dashboard
- Chatbot : réponses courtes (max 400 tokens)
