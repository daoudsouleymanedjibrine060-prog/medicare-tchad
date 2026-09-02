# Changelog

## [1.1.0] — 2026-08-13

### Ajouté
- Portail médecin autonome (`/connexion/medecin`, routes `/doctor/*`)
- Dossiers médicaux (API + UI médecin/patient)
- Ordonnances (API + UI médecin/patient)
- Endpoints `GET/POST /medical-records`, `GET/POST /prescriptions`
- Login `expectedRole: DOCTOR` ; stats RDV pour médecins
- Script `scripts/create-github-release.ps1`
- Données démo : dossier + ordonnance pour le patient test

## [1.0.0] — 2026-08-07

### Ajouté
- Script Windows `scripts/start-dev.ps1` (Docker + health + verify-api)
- Documentation Oracle Cloud Always Free (`docs/ORACLE_CLOUD.md`)
- Manuel utilisateur (`docs/MANUEL_UTILISATEUR.md`)
- Endpoint `POST /auth/change-password`
- UI notifications patient : marquer lu / tout marquer lu
- Paramètres admin : changement de mot de passe
- Indexes recherche Prisma (`doctors.specialtyId`, `establishments.cityId` / `type`)
- Compression HTTP Express (`compression`)
- Tests verify-api étendus (notifications, register, logout, transitions RDV, users)

### Documenté
- Périmètre v1.0.0 = plateforme RDV (pas de DPI / ordonnances)
- Stack React + Node + MySQL, déploiement Oracle + SSL

### Sécurité (déjà en place, confirmé)
- JWT + refresh cookie, rôles, rate limiting, Helmet, validation Zod
