# Mise en ligne — Guide pas à pas (Oracle Cloud + domaine)

Ce guide couvre la création du serveur **gratuit** (Oracle Cloud Always Free), le DNS, GitHub, puis l'installation MediCare Tchad.

Stack inchangée : **React (frontend) + Node.js/Express (backend) + MySQL** via Docker.

## Phase 1 — Créer une VM Oracle Cloud (gratuit)

### Compte Oracle Cloud Always Free

1. Créer un compte sur [cloud.oracle.com](https://cloud.oracle.com) (région **Always Free eligible**, ex. Frankfurt `eu-frankfurt-1`)
2. Une carte bancaire est souvent demandée pour vérification, puis **0 €/mois** sur le tier Always Free
3. Ouvrir la console : [cloud.oracle.com](https://cloud.oracle.com) → **Compute** → **Instances**

### Créer l'instance

| Paramètre | Valeur recommandée |
|-----------|-------------------|
| Name | `medicare-tchad` |
| Image | **Canonical Ubuntu 22.04** |
| Shape | **VM.Standard.A1.Flex** (Ampere ARM) Always Free — ex. 2 OCPU / 12 Go RAM (idéalement 4 OCPU / 24 Go si dispo) |
| Réseau | VCN par défaut + **Assign a public IPv4 address** |
| SSH keys | Coller votre clé publique (`scripts\vps-setup-ssh.ps1`) |

Si A1 (Ampere) est saturé dans la région, essayez une autre région Always Free, ou en dernier recours `VM.Standard.E2.1.Micro` (1 Go RAM — serré pour MySQL+API).

### Ouvrir les ports (obligatoire)

**Ingress** de la subnet (VCN → Security Lists ou Network Security Groups) :

| Direction | Protocol | Port | Source |
|-----------|----------|------|--------|
| Ingress | TCP | 22 | Votre IP (ou 0.0.0.0/0 en démo) |
| Ingress | TCP | 80 | 0.0.0.0/0 |
| Ingress | TCP | 443 | 0.0.0.0/0 |

Sans ces règles, le site et le SSH restent inaccessibles même si la VM tourne.

### Connexion SSH (utilisateur Ubuntu, pas root)

Sur Ubuntu Oracle Cloud, l'utilisateur SSH est **`ubuntu`** :

```powershell
# Afficher / générer la clé
powershell -ExecutionPolicy Bypass -File scripts\vps-setup-ssh.ps1 -VpsHost VOTRE_IP_PUBLIQUE

# Test
ssh ubuntu@VOTRE_IP_PUBLIQUE
```

Noter l'**IPv4 publique** affichée sur l'instance.

### Script guide Oracle

```powershell
powershell -ExecutionPolicy Bypass -File scripts\vps-oracle-create.ps1
# Puis, une fois l'IP connue :
powershell -ExecutionPolicy Bypass -File scripts\vps-oracle-create.ps1 -NewVpsHost VOTRE_IP
```

---

## Phase 2 — Domaine et DNS

### Option A — Domaine payant (recommandé en production)

| Registrar | Extension | Prix indicatif |
|-----------|-----------|----------------|
| Namecheap | `.com` | ~12 $/an |
| Cloudflare | `.com` | prix coûtant |
| OVH | `.com` / `.fr` | ~10 €/an |

Enregistrements DNS :

| Type | Nom | Contenu | TTL |
|------|-----|---------|-----|
| A | `@` | `IP_ORACLE` | 300 |
| A | `www` | `IP_ORACLE` | 300 |

### Option B — Gratuit temporaire (sslip.io)

Sans domaine acheté, utilisez :

```text
IP-avec-tirets.sslip.io
```

Exemple : IP `129.146.10.20` → `129-146-10-20.sslip.io`

Les scripts Windows choisissent automatiquement sslip.io si `medicare-tchad.com` n'est pas configuré :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\vps-resolve-domain.ps1 -VpsHost VOTRE_IP
```

---

## Phase 3 — Pousser le code sur GitHub

```powershell
cd C:\Users\daoud\medicare-tchad
gh auth login
git push -u origin main
```

Dépôt attendu : `https://github.com/daoudsouleymanedjibrine060-prog/medicare-tchad.git`

---

## Phase 4 — Installation sur la VM Oracle

Depuis **Windows** (après SSH `ubuntu@IP` OK) :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\vps-deploy-all.ps1 -VpsHost VOTRE_IP -SshUser ubuntu
```

Ou manuellement en SSH :

```bash
ssh ubuntu@VOTRE_IP
sudo apt update && sudo apt install -y git
sudo git clone https://github.com/daoudsouleymanedjibrine060-prog/medicare-tchad.git /opt/medicare-tchad
cd /opt/medicare-tchad
sudo chmod +x scripts/*.sh
# Domaine réel ou sslip.io
sudo ./scripts/vps-first-install.sh --domain VOTRE_DOMAINE --email admin@medicare-tchad.com
```

Le script installe Docker, ouvre UFW, génère `.env`, déploie (API Node + frontend React + MySQL), seed, SSL.

---

## Résultat attendu

- Site : `https://VOTRE_DOMAINE`
- API : `https://VOTRE_DOMAINE/api/v1/health` → `{"status":"ok"}`
- Vérif : `npm run verify:api -- https://VOTRE_DOMAINE/api/v1`

## Budget

| Poste | Coût |
|-------|------|
| VM Oracle Cloud Always Free | **0 €/mois** |
| Domaine .com (optionnel) | ~1 €/mois amorti |
| SSL Let's Encrypt | Gratuit |
| sslip.io (sans domaine) | Gratuit |

## Alternative payante (hors scope Always Free)

Hetzner / OVH restent possibles si vous préférez un VPS Europe payant (~5 €/mois). Les mêmes scripts Docker fonctionnent ; l'utilisateur SSH est alors souvent `root`. Voir l'historique dans les scripts `vps-hetzner-create.ps1` (déprécié, redirige vers Oracle).
