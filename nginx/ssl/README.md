# Certificats SSL

Ce dossier contient les certificats Let's Encrypt pour Nginx en production.

Fichiers attendus :
- `fullchain.pem`
- `privkey.pem`

Génération automatique :

```bash
./scripts/setup-ssl.sh votre-domaine.com admin@votre-domaine.com
```

**Ne commitez jamais** les fichiers `.pem` dans Git.
