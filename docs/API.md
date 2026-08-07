# API MediCare Tchad

Base URL : `/api/v1`

Authentification : header `Authorization: Bearer <accessToken>` (sauf routes publiques). Refresh via cookie httpOnly `refreshToken`.

## Auth

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/register` | Inscription patient |
| POST | `/auth/login` | Connexion (option `expectedRole`) |
| POST | `/auth/refresh` | Renouveler access token |
| POST | `/auth/logout` | Déconnexion |
| GET | `/auth/me` | Profil courant |
| POST | `/auth/change-password` | Changer mot de passe (`currentPassword`, `newPassword`) |

## Patients

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/patients/profile` | Profil patient (Patient) |
| PATCH | `/patients/profile` | Mettre à jour profil |
| GET | `/patients` | Liste (Admin) |

## Médecins

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/doctors` | Recherche (`?specialty`, `?city`, `?name`) |
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
| GET | `/appointments/assistant/stats` | Stats assistant |
| GET | `/appointments/assistant/tomorrow-slots` | Créneaux demain |
| PUT | `/appointments/assistant/tomorrow-slots` | Enregistrer créneaux demain |

## Établissements

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/establishments` | Liste (`?type=LABORATOIRE`) |
| GET | `/establishments/map` | Markers carte |
| POST | `/establishments` | Créer (Admin) |
| PATCH | `/establishments/:id` | Modifier (Admin) |
| DELETE | `/establishments/:id` | Supprimer (Admin) |

## Horaires

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/schedules` | Horaires médecin |
| POST | `/schedules` | Ajouter |
| PATCH | `/schedules/:id` | Modifier |
| DELETE | `/schedules/:id` | Supprimer |

## Notifications

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/notifications` | Liste (+ `unreadCount`) |
| PATCH | `/notifications/read-all` | Tout marquer lu |
| PATCH | `/notifications/:id/read` | Marquer une notification lue |

## Messages

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/messages` | Conversations |
| GET | `/messages/contacts` | Contacts autorisés |
| POST | `/messages` | Envoyer (`receiverId`, `content`) |

## Utilisateurs (Admin)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/users` | Liste (`?role=PATIENT`) |
| GET | `/users/cities` | Villes (public) |
| GET | `/users/assistant/my-doctor` | Médecin de l’assistant |
| POST | `/users` | Créer utilisateur |
| PATCH | `/users/:id` | Modifier |
| DELETE | `/users/:id` | Désactiver / supprimer |

## Dashboard

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/dashboard/stats` | Stats admin |
| GET | `/dashboard/export/appointments` | Export CSV (Super Admin) |

## Chatbot

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/chatbot/chat` | Message patient |
| GET | `/chatbot/history` | Historique |

## Santé

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Health check |

## Périmètre v1.0.0

Cette API couvre la **gestion des rendez-vous**. Les dossiers médicaux et ordonnances ne font pas partie de v1.0.0.
