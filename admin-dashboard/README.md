# 🎛️ SimWeGo Admin Dashboard

Dashboard d'administration moderne pour l'API SimWeGo avec intégration Monty eSIM.

## 🚀 Fonctionnalités

### 📊 Dashboard Principal
- **Vue d'ensemble** avec statistiques en temps réel
- **Cartes métriques** : Total clients, tokens valides/expirés, status API
- **Interface moderne** avec shadcn/ui et Tailwind CSS

### 👥 Gestion des Clients
- **CRUD complet** : Créer, lire, modifier, supprimer des clients
- **Table interactive** avec actions contextuelles
- **Détails clients** avec informations Monty (Agent ID, Reseller ID)
- **Status en temps réel** : Actif/Inactif, Token valide/expiré

### ➕ Ajout de Clients avec Validation Monty
- **Formulaire intuitif** avec validation en temps réel
- **Test automatique** des credentials Monty lors de la création
- **Feedback visuel** du processus de validation
- **Gestion d'erreurs** avec cleanup automatique en cas d'échec

### ⚙️ Actions Administratives
- **Test de connexion Monty** pour chaque client
- **Modification sécurisée** des informations client
- **Suppression avec confirmation** et cleanup des tokens
- **Rafraîchissement des données** en un clic

### 🎨 Interface Utilisateur
- **Design moderne** avec shadcn/ui components
- **Floating Action Button** pour l'ajout rapide de clients
- **Notifications toast** pour le feedback utilisateur
- **Responsive design** pour mobile et desktop
- **Modales et panels** pour les détails et éditions

## 🛠️ Technologies

- **Next.js 15** avec App Router et TypeScript
- **shadcn/ui** pour les composants UI modernes
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **API REST** avec le backend SimWeGo

## 📦 Installation

```bash
# Dans le dossier admin-dashboard
npm install

# Démarrer le serveur de développement
npm run dev
```

## 🔧 Configuration

Le dashboard se connecte automatiquement à l'API SimWeGo :

- **API URL** : `http://localhost:3001`
- **Token Admin** : Configuré dans `.env.local`
- **CORS** : Assurez-vous que l'API accepte les requêtes depuis le dashboard

## 🎯 Utilisation

1. **Démarrez l'API SimWeGo** : `npm run dev` dans le projet principal
2. **Lancez le dashboard** : `npm run dev` dans `admin-dashboard/`
3. **Ouvrez** `http://localhost:3000` dans votre navigateur

### Actions Disponibles

#### 📋 Vue Liste
- Visualisez tous les clients avec leur status
- Filtrez par status de token ou activité
- Actions rapides via menu contextuel

#### ➕ Ajouter un Client
1. Cliquez sur le bouton **+** (flottant en bas à droite)
2. Remplissez le formulaire avec :
   - Nom du client
   - Username Monty
   - Password Monty
3. Le système valide automatiquement les credentials Monty
4. Le client est créé avec son token si la validation réussit

#### ✏️ Modifier un Client
- Cliquez sur "Modifier" dans le menu d'actions
- Modifiez les informations nécessaires
- Le mot de passe Monty est optionnel (laissez vide pour conserver)

#### 🔍 Voir les Détails
- Cliquez sur "Voir détails" pour un panel complet
- Informations complètes : API keys, IDs Monty, historique
- Actions directes depuis le panel

#### 🧪 Tester la Connexion Monty
- Test en temps réel de la connexion avec Monty eSIM
- Mise à jour automatique du status des tokens
- Feedback immédiat sur le résultat

## 🎨 Composants Créés

- **`ClientTable`** : Table interactive avec actions
- **`AddClientDialog`** : Modal de création avec validation Monty
- **`EditClientDialog`** : Modal d'édition des clients
- **`ClientDetailsSheet`** : Panel de détails complets
- **`api.ts`** : Client API TypeScript avec tous les endpoints

## 🔐 Sécurité

- Token admin JWT intégré
- Validation côté client et serveur
- Cleanup automatique en cas d'erreur
- Gestion sécurisée des mots de passe (pas de pré-remplissage)

## 📱 Responsive

Le dashboard est entièrement responsive :
- **Desktop** : Vue complète avec toutes les fonctionnalités
- **Tablet** : Layout adaptatif pour écrans moyens
- **Mobile** : Interface optimisée pour tactile

Ce dashboard offre une expérience d'administration complète et moderne pour la gestion de vos clients SimWeGo ! 🚀
