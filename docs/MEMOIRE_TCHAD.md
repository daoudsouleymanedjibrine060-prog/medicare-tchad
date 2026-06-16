# Mémoire technique — MediCare Tchad

Adaptation du projet MediCare (mémoire L3, contexte algérien) au système de santé tchadien.

## Résumé

MediCare Tchad est une plateforme web de gestion des rendez-vous médicaux destinée au Tchad. Elle permet aux patients de rechercher un médecin, de prendre rendez-vous en ligne et de localiser les établissements de santé (hôpitaux, cliniques, cabinets, laboratoires). Les assistants médicaux gèrent les plannings et valident les demandes. Les administrateurs supervisent l'ensemble du système.

**Contexte local :** indicatif +235, villes tchadiennes (N'Djamena, Moundou, Sarh, Abéché, etc.), établissements réels (HGRN, HME, CHU Moundou, laboratoires nationaux).

**Stack technique :** React 19, Node.js/Express, Prisma/MySQL (remplace PHP/MySQL du mémoire original).

## Problématique

Le secteur de la santé au Tchad fait face à :

- Une faible densité de personnel soignant (~0,4 médecin / 10 000 habitants)
- Un accès limité aux soins en zone rurale, avec des déplacements longs vers les chefs-lieux
- Une gestion manuelle des rendez-vous (appels répétés, files d'attente, erreurs d'agenda)
- Une connexion Internet intermittente (3G/4G urbain, faible couverture rurale)

## Objectifs

1. **Faciliter la recherche de médecins** par spécialité, ville ou nom
2. **Simplifier le travail des assistants** (planning, validation des RDV)
3. **Intégrer un chatbot d'orientation** (sans diagnostic médical)
4. **Proposer une interface simple** adaptée aux connexions lentes et aux smartphones

## Acteurs

| Acteur | Rôle |
|--------|------|
| Patient | Recherche médecins, RDV, carte, laboratoires, chatbot |
| Assistant | Planning, validation/refus des demandes de RDV |
| Administrateur | Gestion utilisateurs, établissements, laboratoires, statistiques |
| Super administrateur | Supervision nationale, gestion des admins, export CSV |

## Organisation du projet

```
medicare-tchad/
├── frontend/     # SPA React (Vite, Tailwind)
├── backend/      # API REST Express + Prisma
├── docs/         # Documentation technique
└── docker/       # Nginx, Docker Compose
```

## Fonctionnalités implémentées

- Authentification JWT (access + refresh)
- RBAC : PATIENT, DOCTOR, ASSISTANT, ADMIN, SUPER_ADMIN
- Recherche et réservation de rendez-vous
- Cartographie hybride (Google Maps si clé API, sinon OpenStreetMap + lien itinéraire)
- Module laboratoires (liste, carte, gestion admin)
- Notifications in-app + SMS (+235 via Africa's Talking)
- Chatbot OpenAI avec fallback local contextualisé Tchad

## Différences avec le mémoire algérien original

| Élément | Mémoire (Algérie) | MediCare Tchad |
|---------|-------------------|----------------|
| Indicatif | +213 | +235 |
| Backend | PHP | Node.js/Express |
| Carte | Google Maps | Hybride GMaps/OSM |
| Villes | Algériennes | Tchadiennes |
| Chatbot | n8n/webhooks | OpenAI + fallback |

## Références

- Ministère de la Santé Publique du Tchad
- OMS — profil santé Tchad
- HGRN, HME, CHU Moundou (établissements de référence)
