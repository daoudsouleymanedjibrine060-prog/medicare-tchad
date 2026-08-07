# Manuel utilisateur — MediCare Tchad v1.0.0

Guide pratique pour utiliser la plateforme de **rendez-vous médicaux** (Tchad, +235).

**Hors périmètre v1** : dossiers médicaux complets, ordonnances, portail médecin autonome (les assistants gèrent le planning des médecins).

## Accès

| Environnement | URL |
|---------------|-----|
| Local | http://localhost:5173 |
| Production | Voir déploiement Oracle (`docs/ORACLE_CLOUD.md`) |

### Comptes de démonstration

| Rôle | Email | Mot de passe | Portail |
|------|-------|--------------|---------|
| Patient | `patient@medicare-td.test` | `Patient@123` | `/connexion` |
| Assistant | `assistant1@medicare-td.test` | `Admin@123` | `/connexion/assistant` |
| Admin | `admin@medicare-td.test` | `Admin@123` | `/connexion/admin` |
| Super Admin | `superadmin@medicare-td.test` | `Admin@123` | `/connexion/super-admin` |

## Patient

1. **Inscription** : `/inscription` (email, téléphone +235, mot de passe ≥ 8 caractères).
2. **Connexion** : `/connexion`.
3. **Tableau de bord** : statistiques RDV, notifications (marquer lu / tout lu), prochains RDV.
4. **Médecins** : rechercher, ouvrir une fiche, choisir date et créneau, réserver.
5. **Rendez-vous** : consulter, annuler (PENDING / CONFIRMED).
6. **Laboratoires / Carte** : établissements et carte hybride.
7. **Messages** : échanger avec l’assistant du médecin.
8. **Paramètres** : modifier profil (téléphone +235XXXXXXXX, âge, ville, etc.).
9. **Chatbot** : questions fréquentes sur la prise de RDV.

## Assistant

1. Connexion via `/connexion/assistant`.
2. **Accueil** : demandes en attente, RDV confirmés, patients.
3. **Mon médecin** : fiche du médecin associé.
4. **Planning** : ouvrir / bloquer les créneaux du lendemain.
5. **Demandes** : confirmer ou refuser les RDV.
6. **Horaires** : horaires récurrents de la semaine.
7. **Messages** : répondre aux patients.

## Administrateur

1. Connexion via `/connexion/admin`.
2. **Tableau de bord** : volumes médecins, patients, laboratoires, RDV.
3. **Gestion** : médecins, patients, cabinets, laboratoires, assistants, rendez-vous.
4. **Paramètres** : voir le profil, **changer le mot de passe**.

## Super administrateur

1. Connexion via `/connexion/super-admin`.
2. Supervision + gestion des **admins**.
3. Export CSV des rendez-vous.

## Sécurité (côté utilisateur)

- Ne partagez jamais votre mot de passe.
- Utilisez le bon portail selon votre rôle (un patient ne peut pas se connecter sur `/connexion/admin`).
- Déconnectez-vous sur un poste partagé.

## Installation locale (rappel)

```powershell
cd medicare-tchad
powershell -ExecutionPolicy Bypass -File scripts\start-dev.ps1
```

Voir aussi [README.md](../README.md) et [ORACLE_CLOUD.md](ORACLE_CLOUD.md).
