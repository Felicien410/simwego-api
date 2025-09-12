// scripts/manage-clients.js - Script de gestion des clients via CLI
require('dotenv').config();
const { initializeDatabase, logger } = require('../src/config/database');
const { initClient } = require('../src/models/Client');
const { initTokenCache } = require('../src/models/TokenCache');

class ClientManager {
  constructor() {
    this.sequelize = null;
    this.Client = null;
    this.TokenCache = null;
  }

  async initialize() {
    this.sequelize = await initializeDatabase();
    this.Client = initClient(this.sequelize);
    this.TokenCache = initTokenCache(this.sequelize);
    
    // Définir les associations
    this.Client.hasOne(this.TokenCache, { foreignKey: 'client_id', as: 'tokenCache' });
    this.TokenCache.belongsTo(this.Client, { foreignKey: 'client_id', as: 'client' });
  }

  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
    }
  }

  // Lister tous les clients
  async listClients() {
    try {
      const clients = await this.Client.findAll({
        include: [{
          model: this.TokenCache,
          as: 'tokenCache',
          required: false
        }],
        order: [['created_at', 'DESC']]
      });

      console.log('\n=== Clients SimWeGo ===');
      if (clients.length === 0) {
        console.log('Aucun client trouvé');
        return;
      }

      clients.forEach(client => {
        const tokenStatus = client.tokenCache 
          ? (client.tokenCache.isValid() ? 'Valid' : 'Expired')
          : 'None';

        console.log(`ID: ${client.id}`);
        console.log(`Nom: ${client.name}`);
        console.log(`API Key: ${client.api_key}`);
        console.log(`Statut: ${client.active ? 'Actif' : 'Inactif'}`);
        console.log(`Username Monty: ${client.monty_username}`);
        console.log(`Token Status: ${tokenStatus}`);
        console.log(`Créé le: ${client.createdAt}`);
        console.log('---');
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error.message);
    }
  }

  // Ajouter un nouveau client
  async addClient(id, name, montyUsername, montyPassword, apiKey = null) {
    try {
      // Générer une clé API si non fournie
      if (!apiKey) {
        apiKey = this.Client.generateApiKey(id);
      }

      const clientData = {
        id,
        name,
        api_key: apiKey,
        monty_username: montyUsername,
        monty_password: montyPassword, // Sera chiffré automatiquement
        active: true
      };

      const client = await this.Client.create(clientData);
      
      console.log(`Client créé avec succès:`);
      console.log(`ID: ${client.id}`);
      console.log(`Nom: ${client.name}`);
      console.log(`API Key: ${client.api_key}`);
      console.log(`Username Monty: ${client.monty_username}`);

    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.error('Erreur: ID client ou clé API déjà existant');
      } else {
        console.error('Erreur lors de la création du client:', error.message);
      }
    }
  }

  // Mettre à jour un client
  async updateClient(id, updates) {
    try {
      const client = await this.Client.findByPk(id);
      
      if (!client) {
        console.error(`Client avec l'ID '${id}' non trouvé`);
        return;
      }

      await client.update(updates);
      console.log(`Client '${id}' mis à jour avec succès`);
      
      // Afficher les modifications
      if (updates.name) console.log(`- Nom: ${updates.name}`);
      if (updates.active !== undefined) console.log(`- Statut: ${updates.active ? 'Actif' : 'Inactif'}`);
      if (updates.monty_password) console.log('- Mot de passe Monty mis à jour');

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error.message);
    }
  }

  // Activer/désactiver un client
  async toggleClientStatus(id, active) {
    await this.updateClient(id, { active });
    
    // Invalider le cache des tokens si désactivé
    if (!active) {
      await this.TokenCache.destroy({ where: { client_id: id } });
      console.log('Cache des tokens invalidé');
    }
  }

  // Supprimer un client
  async deleteClient(id, force = false) {
    try {
      if (!force) {
        console.log('ATTENTION: Cette action supprimera définitivement le client et ses données.');
        console.log('Utilisez --force pour confirmer la suppression.');
        return;
      }

      const client = await this.Client.findByPk(id);
      
      if (!client) {
        console.error(`Client avec l'ID '${id}' non trouvé`);
        return;
      }

      // Supprimer le cache des tokens d'abord (cascade devrait le faire mais on s'assure)
      await this.TokenCache.destroy({ where: { client_id: id } });
      
      // Supprimer le client
      await client.destroy();
      
      console.log(`Client '${id}' (${client.name}) supprimé avec succès`);

    } catch (error) {
      console.error('Erreur lors de la suppression:', error.message);
    }
  }

  // Nettoyer les tokens expirés
  async cleanTokens() {
    try {
      const deletedCount = await this.TokenCache.cleanExpiredTokens();
      console.log(`${deletedCount} tokens expirés supprimés`);
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error.message);
    }
  }

  // Statistiques
  async getStats() {
    try {
      const totalClients = await this.Client.count();
      const activeClients = await this.Client.count({ where: { active: true } });
      const tokenStats = await this.TokenCache.getCacheStats();

      console.log('\n=== Statistiques ===');
      console.log(`Clients total: ${totalClients}`);
      console.log(`Clients actifs: ${activeClients}`);
      console.log(`Tokens en cache: ${tokenStats.total}`);
      console.log(`Tokens valides: ${tokenStats.valid}`);
      console.log(`Tokens expirés: ${tokenStats.expired}`);

    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error.message);
    }
  }

  // Tester la connexion Monty pour un client
  async testMontyConnection(id) {
    try {
      const client = await this.Client.findByPk(id);
      
      if (!client) {
        console.error(`Client avec l'ID '${id}' non trouvé`);
        return;
      }

      const montyAuthService = require('../src/services/montyAuth');
      
      console.log(`Test de connexion Monty pour le client '${client.name}'...`);
      
      // Invalider le cache pour forcer une nouvelle connexion
      await this.TokenCache.destroy({ where: { client_id: id } });
      
      const token = await montyAuthService.getValidToken(client, this.TokenCache);
      
      if (token) {
        console.log('Connexion Monty réussie');
        
        const tokenCache = await this.TokenCache.findByPk(id);
        if (tokenCache) {
          console.log(`Agent ID: ${tokenCache.agent_id}`);
          console.log(`Reseller ID: ${tokenCache.reseller_id}`);
          console.log(`Expire le: ${tokenCache.expires_at}`);
        }
      }

    } catch (error) {
      console.error('Erreur de connexion Monty:', error.message);
    }
  }
}

// Interface ligne de commande
async function main() {
  const manager = new ClientManager();
  
  try {
    await manager.initialize();
    
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'list':
        await manager.listClients();
        break;

      case 'add':
        if (args.length < 5) {
          console.log('Usage: node manage-clients.js add <id> <name> <monty_username> <monty_password> [api_key]');
          console.log('Exemple: node manage-clients.js add client3 "Client 3" monty_user3 monty_pass3');
          return;
        }
        await manager.addClient(args[1], args[2], args[3], args[4], args[5]);
        break;

      case 'activate':
        if (args.length < 2) {
          console.log('Usage: node manage-clients.js activate <client_id>');
          return;
        }
        await manager.toggleClientStatus(args[1], true);
        break;

      case 'deactivate':
        if (args.length < 2) {
          console.log('Usage: node manage-clients.js deactivate <client_id>');
          return;
        }
        await manager.toggleClientStatus(args[1], false);
        break;

      case 'update':
        if (args.length < 3) {
          console.log('Usage: node manage-clients.js update <client_id> <field> <value>');
          console.log('Fields: name, monty_password');
          return;
        }
        const updates = {};
        updates[args[2]] = args[3];
        await manager.updateClient(args[1], updates);
        break;

      case 'delete':
        if (args.length < 2) {
          console.log('Usage: node manage-clients.js delete <client_id> [--force]');
          return;
        }
        await manager.deleteClient(args[1], args.includes('--force'));
        break;

      case 'clean':
        await manager.cleanTokens();
        break;

      case 'stats':
        await manager.getStats();
        break;

      case 'test':
        if (args.length < 2) {
          console.log('Usage: node manage-clients.js test <client_id>');
          return;
        }
        await manager.testMontyConnection(args[1]);
        break;

      default:
        console.log('Commandes disponibles:');
        console.log('  list                              - Lister tous les clients');
        console.log('  add <id> <name> <user> <pass>     - Ajouter un client');
        console.log('  activate <id>                     - Activer un client');
        console.log('  deactivate <id>                   - Désactiver un client');
        console.log('  update <id> <field> <value>       - Mettre à jour un client');
        console.log('  delete <id> [--force]             - Supprimer un client');
        console.log('  clean                             - Nettoyer les tokens expirés');
        console.log('  stats                             - Afficher les statistiques');
        console.log('  test <id>                         - Tester la connexion Monty');
    }

  } finally {
    await manager.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ClientManager;