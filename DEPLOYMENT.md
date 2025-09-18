# Déploiement Digital Ocean

Guide pour déployer SimWeGo API sur Digital Ocean App Platform.

## Prérequis

1. **Compte Digital Ocean** avec facturation activée
2. **doctl CLI** installé et configuré
3. **Repository Git** public ou privé

### Installation doctl

```bash
# macOS
brew install doctl

# Ubuntu/Debian
snap install doctl

# Configuration
doctl auth init
```

## Configuration

### 1. Repository GitHub

Assurez-vous que votre code est poussé sur GitHub :

```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Configuration App Platform

Modifiez `.do/app.yaml` :
- Changez `github.repo` avec votre repository
- Vérifiez la branche (main/master)

### 3. Base de données PostgreSQL

Digital Ocean créera automatiquement une base PostgreSQL managée selon la config dans `app.yaml`.

## Déploiement

### Déploiement automatique

```bash
./scripts/deploy-do.sh https://github.com/votre-username/simwego-api
```

### Déploiement manuel

```bash
# Créer l'application
doctl apps create .do/app.yaml

# Ou mettre à jour
doctl apps update <APP_ID> --spec .do/app.yaml
```

## Variables d'environnement

Configurez ces variables dans le dashboard DigitalOcean :

### Variables obligatoires
- `DB_ENCRYPTION_KEY` - Clé de chiffrement base de données
- `MONTY_API_BASE_URL` - URL de l'API Monty
- `ADMIN_JWT_SECRET` - Secret pour les tokens JWT admin

### Clients Monty
- `CLIENT1_MONTY_USERNAME` - Username client 1
- `CLIENT1_MONTY_PASSWORD` - Password client 1
- `CLIENT2_MONTY_USERNAME` - Username client 2
- `CLIENT2_MONTY_PASSWORD` - Password client 2

### API Keys
- `CLIENT_TEST_API_KEY` - Clé API client de test
- `CLIENT_REAL_API_KEY` - Clé API client réel

## Post-déploiement

### 1. Migrations

Les migrations se lancent automatiquement au démarrage.

### 2. Vérification

```bash
# Statut de l'application
doctl apps list

# Logs
doctl apps logs <APP_ID>

# Health check
curl https://votre-app.ondigitalocean.app/health
```

### 3. Domaine personnalisé

Dans le dashboard DigitalOcean :
1. Apps > SimWeGo API > Settings
2. Domains
3. Ajouter votre domaine

## Monitoring

- **Logs** : Dashboard DigitalOcean > Apps > Logs
- **Métriques** : Dashboard DigitalOcean > Apps > Insights
- **Health** : `/health` endpoint

## Coûts estimés

- **App Platform** : ~$5/mois (Basic)
- **PostgreSQL** : ~$15/mois (1GB RAM)
- **Total** : ~$20/mois

## Troubleshooting

### Build failed
```bash
# Vérifier les logs
doctl apps logs <APP_ID> --type build
```

### Database connection failed
- Vérifier les variables d'environnement
- Vérifier que la DB est créée et accessible

### Migration failed
```bash
# Voir les logs de démarrage
doctl apps logs <APP_ID> --type run
```