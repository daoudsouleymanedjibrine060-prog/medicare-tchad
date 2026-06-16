# API MediCare Tchad

Base URL : `/api/v1`

## Auth

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/register` | Inscription patient |
| POST | `/auth/login` | Connexion |
| POST | `/auth/refresh` | Renouveler token |
| POST | `/auth/logout` | Déconnexion |
| GET | `/auth/me` | Profil courant |

## Médecins

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/doctors` | Recherche (?specialty, ?city, ?name) |
| GET | `/doctors/specialties/list` | Liste spécialités |
| GET | `/doctors/:id` | Détail médecin |
| GET | `/doctors/:id/slots?date=YYYY-MM-DD` | Créneaux disponibles |
| POST | `/doctors` | Créer (Admin) |

## Rendez-vous

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/appointments` | Réserver (Patient) |
| GET | `/appointments/mine` | Mes RDV |
| GET | `/appointments` | Tous (Admin) |
| PATCH | `/appointments/:id/status` | Changer statut |

## Établissements

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/establishments` | Liste |
| GET | `/establishments/map` | Markers carte |
| POST | `/establishments` | Créer (Admin) |

## Horaires

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/schedules` | Horaires médecin |
| POST | `/schedules` | Ajouter |
| DELETE | `/schedules/:id` | Supprimer |

## Notifications

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/notifications` | Liste + compteur non lues |
| PATCH | `/notifications/:id/read` | Marquer lue |
| PATCH | `/notifications/read-all` | Tout marquer lu |

## Chatbot

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/chatbot/chat` | Envoyer message |
| GET | `/chatbot/history/:sessionId` | Historique |

## Dashboard

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/dashboard/stats` | Statistiques |
| GET | `/dashboard/export/appointments` | Export CSV |

## Utilitaires

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/users/cities` | Villes Tchad |
| GET | `/health` | Health check |

## Codes d'erreur

- `400` — Données invalides
- `401` — Non authentifié
- `403` — Accès refusé
- `404` — Ressource introuvable
- `409` — Conflit (email/téléphone existant)
- `429` — Rate limit chatbot
- `500` — Erreur serveur
