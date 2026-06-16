# Mise en ligne — Guide pas à pas (VPS + domaine)

Ce guide couvre les phases **1 et 2** du plan de déploiement. À faire **une seule fois** avant d'exécuter `scripts/vps-first-install.sh` sur le serveur.

## Phase 1 — Créer un VPS

### Hetzner (recommandé, ~5 €/mois)

1. Créer un compte sur [hetzner.com/cloud](https://www.hetzner.com/cloud)
2. **New Project** → **Add Server**
3. Paramètres :
   - **Location** : Falkenstein ou Nuremberg (Allemagne) — bonne latence depuis le Tchad
   - **Image** : Ubuntu 22.04
   - **Type** : CX22 (2 vCPU, 4 GB RAM)
   - **SSH key** : ajoutez votre clé publique (ou mot de passe root)
4. Noter l'**IPv4 publique** (ex. `95.217.xxx.xxx`)
5. Tester depuis Windows :

```powershell
ssh root@95.217.xxx.xxx
```

### OVH (alternative)

1. [ovhcloud.com](https://www.ovhcloud.com) → VPS → VPS-1 ou Essential
2. Ubuntu 22.04, région Europe
3. Noter l'IP et tester SSH

---

## Phase 2 — Acheter un domaine et DNS

### Acheter le domaine

| Registrar | Extension | Prix indicatif |
|-----------|-----------|----------------|
| Namecheap | `.com` | ~12 $/an |
| Cloudflare | `.com` | prix coûtant |
| OVH | `.com` / `.fr` | ~10 €/an |

Exemple : `medicare-tchad.com`

### Configurer le DNS

Chez le registrar, zone DNS :

| Type | Nom | Contenu | TTL |
|------|-----|---------|-----|
| A | `@` | `IP_DU_VPS` | 300 |
| A | `www` | `IP_DU_VPS` | 300 |

Vérifier la propagation (depuis Windows ou le VPS) :

```powershell
nslookup medicare-tchad.com
```

Attendre 5 min à 48 h si le résultat ne correspond pas encore à l'IP du VPS.

---

## Phase 3 — Pousser le code sur GitHub

Sur votre PC Windows :

```powershell
cd C:\Users\daoud\medicare-tchad
powershell -ExecutionPolicy Bypass -File scripts\init-github.ps1
```

Puis connectez-vous à GitHub si demandé :

```powershell
gh auth login
```

Relancez le script ou poussez manuellement :

```powershell
git push -u origin main
```

---

## Phase 4 — Installation automatique sur le VPS

Une fois VPS + DNS + GitHub prêts, sur le **VPS** (SSH) :

```bash
curl -fsSL https://raw.githubusercontent.com/VOTRE_COMPTE/medicare-tchad/main/scripts/vps-first-install.sh | bash -s -- \
  --repo https://github.com/VOTRE_COMPTE/medicare-tchad.git \
  --domain medicare-tchad.com \
  --email admin@medicare-tchad.com
```

Ou après clone manuel :

```bash
git clone https://github.com/VOTRE_COMPTE/medicare-tchad.git /opt/medicare-tchad
cd /opt/medicare-tchad
chmod +x scripts/*.sh
./scripts/vps-first-install.sh --domain medicare-tchad.com --email admin@medicare-tchad.com
```

Ce script unique exécute : Docker, pare-feu, `.env`, déploiement, seed, SSL, cron, validation.

---

## Résultat attendu

- Site : `https://medicare-tchad.com`
- API : `https://medicare-tchad.com/api/v1/health` → `{"status":"ok"}`
- Tests : 34/34 `verify-api.js`

## Budget mensuel

| Poste | Coût |
|-------|------|
| VPS Hetzner CX22 | ~5 €/mois |
| Domaine .com | ~1 €/mois (amorti) |
| SSL Let's Encrypt | Gratuit |
