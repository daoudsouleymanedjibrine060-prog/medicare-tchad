# Tests et validation — MediCare Tchad (conformité mémoire)

## Builds (automatisé)

```bash
cd backend && npm run build
cd frontend && npm run build
```

## API (nécessite MySQL + seed)

1. Démarrer Docker Desktop
2. `docker compose up -d --build`
3. `docker exec medicare-api npx prisma migrate deploy`
4. `docker exec medicare-api npm run db:seed`
5. `npm run verify:api`

Le script [`scripts/verify-api.js`](../scripts/verify-api.js) vérifie :
- Health check
- Login par portail (patient, assistant, admin, super-admin) + refus rôle incorrect (admin et assistant)
- Liste médecins avec photos
- Villes tchadiennes (11+)
- Carte et laboratoires (avec `parentEstablishment`)
- Rendez-vous patient + filtre `?status=PENDING`
- Mise à jour téléphone patient (`PATCH /patients/profile`)
- Messages (lecture + envoi) + contacts assistant
- Stats assistant (3 métriques) + mon médecin + horaires PATCH
- Dashboard admin (6 entités + graphique)
- Export CSV super-admin (Bearer)
- Réservation patient (`POST /appointments` avec créneau)
- Créneaux avec statut (`slotDetails` : available / booked / unavailable)
- Chatbot

## Checklist manuelle — Figures mémoire 4 à 14

### Figure 4 — Inscription patient
| Test | URL | Attendu |
|------|-----|---------|
| Formulaire complet | `/inscription` | Nom, email, mdp, téléphone +235, **âge**, **sexe** |
| Création compte | `/inscription` | Redirection dashboard patient |

### Figure 5 — Connexion patient
| Test | URL | Compte |
|------|-----|--------|
| Login patient | `/connexion` | patient@medicare-td.test / Patient@123 |

### Figures 6–7 — Médecins et RDV
| Test | URL | Attendu |
|------|-----|---------|
| Liste médecins | `/patient/medecins` | Photo, spécialité, **ville**, tél. (cabinet ou médecin), bouton RDV, pagination |
| Vue publique | `/medecins` | Lien RDV → `/connexion?redirect=/patient/medecins/:id` si non connecté |
| Détail + modal RDV | `/patient/medecins/:id` | Photo, téléphone, jours de consultation, bouton **Prendre rendez-vous** → modal Figure 7 : **carte médecin** (fond bleu), date **demain** préremplie, **tous les créneaux** avec légende vert/rouge/gris, notes, boutons **Annuler** + **Confirmer la réservation** |

### Prise de RDV patient (parcours complet)

| Étape | Action |
|-------|--------|
| 1 | Connexion `patient@medicare-td.test` / `Patient@123` sur `/connexion` |
| 2 | Médecins → fiche médecin → **Prendre rendez-vous** |
| 3 | Choisir un jour **lundi–vendredi**, sélectionner un **créneau vert** (disponible), ajouter un motif |
| 4 | **Confirmer la réservation** → RDV visible dans `/patient/rendez-vous` (statut En attente) |
| 5 | Assistant confirme via `/assistant/demandes` |

**Dépannage :** si aucun créneau → vérifier jour ouvré (pas samedi/dimanche) et planning assistant (cases cochées = réservables ; décochées = indisponibles pour les patients).

### Figure 8 — Dashboard patient
| Test | URL | Attendu |
|------|-----|---------|
| En-tête + stats | `/patient/dashboard` | **Bienvenue, {prénom}** + carte profil (avatar, nom, rôle Patient) |
| 4 stats | `/patient/dashboard` | Total RDV, À venir, En attente, Messages non lus |
| Tableau RDV | `/patient/dashboard` | En-tête bleu (Médecin, Spécialité, Date, Heure, Statut, Action), bouton **Annuler** pour PENDING/CONFIRMED |
| Cabinets | `/patient/dashboard` | Cartes cabinets, lien **Voir sur la carte** |

### Figure 9 — Rendez-vous, labos, carte
| Test | URL | Attendu |
|------|-----|---------|
| Mes RDV | `/patient/rendez-vous` | Onglets **À venir** / **Historique**, colonnes **Motif** et **Motif refus** (séparées), plage horaire, pagination |
| Laboratoires | `/patient/laboratoires` | Liste labs Tchad |
| Carte | `/patient/carte` | OSM/Google Maps + lien externe |
| Paramètres patient | `/patient/parametres` | Profil, **âge**, **sexe**, **téléphone +235** (lecture/écriture) |
| Messages | `/patient/messages` | Fil de discussion avec assistants |

### Figure 10 — Connexion assistant (sombre)
| Test | URL | Compte |
|------|-----|--------|
| Portail sombre | `/connexion/assistant` | assistant1@medicare-td.test / Admin@123 |
| Refus patient | `/connexion/assistant` | Compte patient → erreur 403 |

### Figure 11 — Espace assistant
| Test | URL | Attendu |
|------|-----|---------|
| En-tête | `/assistant/dashboard` | **Tableau de bord Assistant** + sous-titre médecin assigné |
| 3 stats | `/assistant/dashboard` | Attente (icône horloge), confirmés (check), total patients (users) |
| Planning demain | `/assistant/dashboard` | Grille en **cases à cocher** par créneau, bouton **Enregistrer** (icône disquette) |
| Demandes RDV | `/assistant/dashboard` | **Tableau** (Patient, Coordonnées, Adresse, Date, Heure, Action) avec **Approuver** / **Refuser** |
| Planning assistant | `/assistant/planning` | Grille demain + liste RDV planifiés (date, heure, patient) |
| Horaires récurrents | `/assistant/horaires` | CRUD horaires (ajouter, **modifier**, supprimer) |
| Messages | `/assistant/messages` | Contacts patients, fil de discussion |
| Mon médecin | `/assistant/mon-medecin` | Profil médecin assigné |
| Demandes RDV | `/assistant/demandes` | Tableau complet avec colonne Notes, Approuver / Refuser |

### Figure 12 — Connexion admin / super-admin (sombre)
| Test | URL | Compte |
|------|-----|--------|
| Portail admin | `/connexion/admin` | admin@medicare-td.test / Admin@123 |
| Portail super-admin | `/connexion/super-admin` | superadmin@medicare-td.test / Admin@123 |
| Lien retour admin | `/connexion/super-admin` | Lien vers portail admin |

### Figure 13 — Espace admin
| Test | URL | Attendu |
|------|-----|---------|
| 6 stats + graphique | `/admin/dashboard` | Médecins, patients, cabinets, labs, assistants, RDV |
| Quick actions | `/admin/dashboard` | 6 liens gestion |
| Gestion séparée | `/admin/medecins`, `/patients`, `/cabinets`, `/laboratoires`, `/assistants`, `/rendez-vous` | CRUD par section : modifier/supprimer établissements, édition utilisateurs, actions RDV **avec motif de refus**, labos rattachés à cabinet parent |
| Paramètres | `/admin/parametres` | Profil admin |
| Messages patient | `/patient/messages` | Fil de discussion |
| Chatbot | widget flottant | Réponse orientation |

### Figure 14 — Super admin LedControl
| Test | URL | Attendu |
|------|-----|---------|
| Dashboard LedControl | `/super-admin/dashboard` | Stats + actions en attente |
| Gestion admins | `/super-admin/admins` | CRUD admins |
| Export CSV | bouton dashboard | Téléchargement rendez-vous (authentification Bearer) |

### Navigation mémoire
| Rôle | Entrées sidebar attendues |
|------|---------------------------|
| Patient | Dashboard, RDV, Médecins, Laboratoires, Carte, Messages, Paramètres |
| Assistant | Dashboard, Mon médecin, Planning, Demandes, **Messages** |
| Admin | Dashboard + 6 gestions + Paramètres |
| Super Admin | Supervision, Admins + miroir admin |

## Production (local / VPS)

```bash
cp .env.example .env
# Éditer .env puis :
chmod +x scripts/*.sh
./scripts/deploy-prod.sh --seed
curl http://localhost/api/v1/health
node scripts/verify-api.js http://localhost/api/v1
```

Voir [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) pour le déploiement HTTPS complet.

## Validation production en ligne

Une fois déployé sur `https://votre-domaine.com` :

### Tests automatisés

```bash
node scripts/verify-api.js https://votre-domaine.com/api/v1
./scripts/health-check.sh https://votre-domaine.com/api/v1/health
```

### Parcours patient (mobile + desktop)

| Étape | URL | Attendu |
|-------|-----|---------|
| Accès public | `/` | Landing responsive, HTTPS actif |
| Inscription | `/inscription` | Compte créé, redirection dashboard |
| Connexion | `/connexion` | Dashboard patient (4 stats, tableau RDV) |
| Médecins | `/patient/medecins` | Liste paginée, bouton RDV |
| Prise RDV | `/patient/medecins/:id` | Modal créneaux vert/rouge/gris |
| Suivi | `/patient/rendez-vous` | RDV en attente visible |

### Parcours assistant

| Étape | URL | Attendu |
|-------|-----|---------|
| Connexion | `/connexion/assistant` | Dashboard avec sous-titre médecin |
| Planning | `/assistant/dashboard` | Cases à cocher + Enregistrer |
| Demandes | `/assistant/demandes` | Tableau Approuver / Refuser |

### Parcours administrateur

| Étape | URL | Attendu |
|-------|-----|---------|
| Connexion | `/connexion/admin` | Dashboard 6 stats |
| Gestion RDV | `/admin/rendez-vous` | Actions sur statuts |

### Critères de succès

- [ ] HTTPS valide (cadenas navigateur)
- [ ] `verify-api.js` : 33/33 tests passés
- [ ] Inscription + connexion patient depuis téléphone
- [ ] Réservation RDV bout en bout (patient → assistant confirme)
- [ ] Conteneurs `restart: always` actifs après reboot VPS

