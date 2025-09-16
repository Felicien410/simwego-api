# SimWeGo API Documentation

Ce répertoire contient la documentation complète de l'API SimWeGo.

## Fichiers

### `swagger.json`
Documentation Swagger/OpenAPI simplifiée avec les endpoints principaux et les spécificités SimWeGo.

**Utilisation :**
- Peut être importée dans Swagger UI
- Contient les endpoints essentiels avec documentation complète
- Authentification Bearer Token expliquée

### `swagger-complete.json`
Documentation OpenAPI complète incluant TOUS les endpoints de Monty eSIM adaptés pour SimWeGo.

**Contenu :**
- Tous les 64+ endpoints de l'API Monty
- Schémas complets (170+ définitions)
- Authentification SimWeGo adaptée
- Endpoints administratifs spécifiques

## Visualisation

### Option 1: Swagger UI en ligne
```
https://petstore.swagger.io/
```
Coller le contenu de `swagger.json` ou charger le fichier.

### Option 2: Swagger UI local
```bash
# Installation
npm install -g swagger-ui-serve

# Servir la documentation
swagger-ui-serve docs/swagger.json
```

### Option 3: VS Code
Installer l'extension "Swagger Viewer" et ouvrir les fichiers .json.

## Authentification SimWeGo

### Différences avec Monty API

| Aspect | Monty API | SimWeGo API |
|--------|-----------|-------------|
| **Authentification** | Username/Password puis Bearer token | Bearer API Key unique |
| **Login** | Requis pour chaque session | Optionnel (pour obtenir tokens Monty) |
| **Multi-client** | Un compte = un reseller | Une API key = un client/reseller |
| **Gestion tokens** | Manuelle | Automatique en arrière-plan |

### Utilisation

```bash
# Toutes les requêtes (sauf system endpoints)
curl -H "Authorization: Bearer YOUR_SIMWEGO_API_KEY" \
     https://api.simwego.com/api/v0/Bundles

# Login optionnel pour obtenir tokens Monty
curl -X POST https://api.simwego.com/api/v0/Agent/login \
     -H "Authorization: Bearer YOUR_SIMWEGO_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"username": "monty_user", "password": "monty_pass"}'
```

## Endpoints Spécifiques SimWeGo

### Système (public)
- `GET /` - Documentation API
- `GET /health` - État des services
- `GET /test` - Test connectivité Monty

### Authentification
- `POST /Agent/login` - Login Monty (retourne tokens)
- `POST /Agent/logout` - Déconnexion
- `POST /CheckToken` - Validation token

### Administration (Admin JWT requis)
- `GET /admin/clients` - Liste clients
- `POST /admin/clients` - Créer client
- `PUT /admin/clients/:id` - Modifier client
- `DELETE /admin/clients/:id` - Supprimer client

## Architecture

L'API SimWeGo fonctionne comme une passerelle (gateway) :

```
Client → SimWeGo API → Monty eSIM API
       (API Key)      (Username/Password + Tokens)
```

1. **Client s'authentifie** avec sa clé API SimWeGo
2. **SimWeGo récupère** les credentials Monty du client
3. **SimWeGo gère** l'authentification Monty (tokens, refresh)
4. **Requête proxifiée** vers Monty avec le bon token
5. **Réponse retournée** au client

## Support

- **Technique** : Voir `CLAUDE.md` pour développement
- **API** : Documentation dans ces fichiers Swagger
- **Contact** : support@simwego.com