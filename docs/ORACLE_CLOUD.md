# Oracle Cloud Always Free — MediCare Tchad

Guide dédié au déploiement **gratuit** sur Oracle Cloud Infrastructure (OCI), avec la stack **React + Node.js + MySQL** (Docker).

## Pourquoi Oracle

| Besoin | Oracle Always Free |
|--------|--------------------|
| Coût | 0 €/mois (quota Always Free) |
| Docker Compose | Oui |
| API Express + frontend React | Oui |
| MySQL 8 | Oui (conteneur) |
| HTTPS | Let's Encrypt |

GitHub Pages / Vercel seuls ne suffisent pas (pas d'API Node + MySQL durables).

## Checklist rapide

1. Compte OCI + région Always Free
2. Instance Ubuntu 22.04 (shape **A1.Flex** Ampere de préférence)
3. Clé SSH ajoutée à la création
4. Security List : TCP **22, 80, 443**
5. SSH : `ssh ubuntu@IP_PUBLIQUE`
6. Déploiement : `scripts\vps-deploy-all.ps1 -VpsHost IP -SshUser ubuntu`
7. DNS : domaine `.com` **ou** `x-x-x-x.sslip.io`

## Détails Security List

Chemin console typique :

**Networking → Virtual Cloud Networks → VCN → Security Lists → Default Security List → Add Ingress Rules**

Exemples de règles :

```text
Source CIDR: 0.0.0.0/0   IP Protocol: TCP   Destination Port: 22
Source CIDR: 0.0.0.0/0   IP Protocol: TCP   Destination Port: 80
Source CIDR: 0.0.0.0/0   IP Protocol: TCP   Destination Port: 443
```

Pour durcir SSH, limitez le port 22 à votre IP publique personnelle.

## Pare-feu local sur la VM

Après connexion `ubuntu@...` :

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT
sudo apt-get install -y iptables-persistent || true
sudo netfilter-persistent save || true
```

`vps-first-install.sh` active aussi **UFW** (22/80/443).

## Architecture sur Oracle

```
Internet
  → IP publique Oracle (Security List 80/443)
    → Nginx (Docker)
      ├── /*     → Frontend React (build Vite)
      └── /api/* → API Node.js Express :4000
                    → MySQL (réseau Docker interne)
```

Le code reste sur GitHub ; la VM clone ou reçoit l'archive via SCP.

## Shapes Always Free utiles

| Shape | Notes |
|-------|-------|
| **VM.Standard.A1.Flex** (Ampere) | Meilleur choix : plus de RAM pour Docker + MySQL |
| VM.Standard.E2.1.Micro | 1 Go RAM — possible mais étroit ; préférer A1 |

Images Docker `node:20-alpine` et `mysql:8.0` existent en **arm64** (A1).

## Scripts Windows associés

| Script | Rôle |
|--------|------|
| [`scripts/vps-oracle-create.ps1`](../scripts/vps-oracle-create.ps1) | Guide création instance + clé SSH |
| [`scripts/vps-setup-ssh.ps1`](../scripts/vps-setup-ssh.ps1) | Affiche la clé (`ubuntu@IP`) |
| [`scripts/vps-deploy-all.ps1`](../scripts/vps-deploy-all.ps1) | SSH → domaine → install → verify |
| [`scripts/vps-remote-install.ps1`](../scripts/vps-remote-install.ps1) | Envoi code + `vps-first-install.sh` |
| [`scripts/vps-verify.ps1`](../scripts/vps-verify.ps1) | DNS + HTTPS + `/api/v1/health` |

## Limites Always Free

- Quotas CPU/RAM/IP réservée par région (A1 parfois « out of capacity »)
- IP épéphémère peut changer après arrêt/recréation → mettre à jour le DNS
- Ne pas exposer le port MySQL **3306** sur Internet

## Documentation liée

- [VPS_ONBOARDING.md](VPS_ONBOARDING.md) — parcours complet
- [DEPLOYMENT.md](DEPLOYMENT.md) — Docker prod, SSL, backup, monitoring
