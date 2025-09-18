# SimWeGo Admin Dashboard

Dashboard d'administration pour l'API SimWeGo.

## Démarrage rapide

```bash
npm install
npm run dev
```

## Configuration

Créez un fichier `.env.local` avec :

```
NEXT_PUBLIC_API_URL=https://simwego-w8jpu.ondigitalocean.app
```

## Déploiement

Ce projet est configuré pour être déployé sur DigitalOcean App Platform.

### Variables d'environnement en production

- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL` - URL de l'API SimWeGo
- `PORT=3000`

## Structure

- `/src/app/login` - Page de connexion
- `/src/app/` - Dashboard principal
- `/src/components` - Composants réutilisables
