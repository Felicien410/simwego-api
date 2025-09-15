// =============================================================================
// src/controllers/admin/clientController.js - Contrôleur admin des clients
// =============================================================================
const { logger } = require('../../config/database');
const montyAuthService = require('../../services/montyAuth');
const encryptionService = require('../../services/encryption');

class AdminClientController {
  // GET /admin/clients - Lister tous les clients
  async listClients(req, res) {
    try {
      const models = req.app.get('models');
      
      const clients = await models.Client.findAll({
        include: [{
          model: models.TokenCache,
          as: 'tokenCache',
          required: false
        }],
        order: [['created_at', 'DESC']]
      });

      const clientsWithStatus = clients.map(client => {
        const tokenCache = client.tokenCache;
        let tokenStatus = 'none';
        
        if (tokenCache) {
          tokenStatus = tokenCache.isValid() ? 'valid' : 'expired';
        }

        return {
          id: client.id,
          name: client.name,
          api_key: client.api_key,
          active: client.active,
          monty_username: client.monty_username,
          token_status: tokenStatus,
          created_at: client.createdAt,
          updated_at: client.updatedAt,
          agent_id: tokenCache?.agent_id || null,
          reseller_id: tokenCache?.reseller_id || null
        };
      });

      res.json({
        clients: clientsWithStatus,
        total: clientsWithStatus.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to list clients', {
        error: error.message,
        adminId: req.admin.id
      });

      res.status(500).json({
        error: 'Failed to retrieve clients',
        message: error.message
      });
    }
  }

  // GET /admin/clients/:id - Détail d'un client
  async getClient(req, res) {
    try {
      const models = req.app.get('models');
      const clientId = req.params.id;

      const client = await models.Client.findByPk(clientId);

      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          message: `No client found with ID: ${clientId}`
        });
      }

      const tokenStatus = client.tokenCache 
        ? (client.tokenCache.isValid() ? 'valid' : 'expired')
        : 'none';

      res.json({
        id: client.id,
        name: client.name,
        api_key: client.api_key,
        active: client.active,
        monty_username: client.monty_username,
        token_status: tokenStatus,
        token_expires_at: client.tokenCache?.expires_at,
        agent_id: client.tokenCache?.agent_id,
        reseller_id: client.tokenCache?.reseller_id,
        created_at: client.createdAt,
        updated_at: client.updatedAt
      });

    } catch (error) {
      logger.error('Failed to get client', {
        error: error.message,
        clientId: req.params.id,
        adminId: req.admin.id
      });

      res.status(500).json({
        error: 'Failed to retrieve client',
        message: error.message
      });
    }
  }

  // POST /admin/clients - Créer un nouveau client
  async createClient(req, res) {
    try {
      const models = req.app.get('models');
      const { name, monty_username, monty_password, active = true } = req.body;

      // Validation des données
      if (!name || !monty_username || !monty_password) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'name, monty_username, and monty_password are required'
        });
      }

      // Chiffrer le mot de passe
      const encryptedPassword = encryptionService.encryptPassword(monty_password);

      // Créer le client avec une API key temporaire (l'ID sera généré automatiquement)
      const tempApiKey = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const clientData = {
        name,
        api_key: tempApiKey,
        monty_username,
        monty_password_encrypted: encryptedPassword,
        active
      };

      const client = await models.Client.create(clientData);
      
      // Générer l'API key définitive avec l'ID auto-généré
      const finalApiKey = encryptionService.generateApiKey(client.id);
      await client.update({ api_key: finalApiKey });

      logger.info('Client created successfully', {
        clientId: client.id,
        adminId: req.admin.id
      });

      res.status(201).json({
        id: client.id,
        name: client.name,
        api_key: client.api_key,
        active: client.active,
        monty_username: client.monty_username,
        created_at: client.createdAt,
        message: 'Client created successfully'
      });

    } catch (error) {
      logger.error('Failed to create client', {
        error: error.message,
        adminId: req.admin.id,
        clientData: req.body
      });

      res.status(500).json({
        error: 'Failed to create client',
        message: error.message
      });
    }
  }

  // PUT /admin/clients/:id - Modifier un client
  async updateClient(req, res) {
    try {
      const models = req.app.get('models');
      const clientId = req.params.id;
      const { name, monty_username, monty_password, active } = req.body;

      const client = await models.Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          message: `No client found with ID: ${clientId}`
        });
      }

      // Préparer les données de mise à jour
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (monty_username !== undefined) updateData.monty_username = monty_username;
      if (monty_password !== undefined) {
        // Chiffrer le mot de passe
        updateData.monty_password_encrypted = encryptionService.encryptPassword(monty_password);
      }
      if (active !== undefined) updateData.active = active;

      // Mettre à jour le client
      await client.update(updateData);

      // Si le client est désactivé, supprimer son cache de token
      if (active === false) {
        // await models.TokenCache.destroy({ where: { client_id: clientId } });
      }

      logger.info('Client updated successfully', {
        clientId: clientId,
        adminId: req.admin.id,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        id: client.id,
        name: client.name,
        api_key: client.api_key,
        active: client.active,
        monty_username: client.monty_username,
        updated_at: client.updatedAt,
        message: 'Client updated successfully'
      });

    } catch (error) {
      logger.error('Failed to update client', {
        error: error.message,
        clientId: req.params.id,
        adminId: req.admin.id
      });

      res.status(500).json({
        error: 'Failed to update client',
        message: error.message
      });
    }
  }

  // DELETE /admin/clients/:id - Supprimer un client
  async deleteClient(req, res) {
    try {
      const models = req.app.get('models');
      const clientId = req.params.id;

      const client = await models.Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          message: `No client found with ID: ${clientId}`
        });
      }

      // Supprimer le cache des tokens d'abord (cascade devrait le faire mais on s'assure)
      // await models.TokenCache.destroy({ where: { client_id: clientId } });
      
      // Supprimer le client
      await client.destroy();

      logger.info('Client deleted successfully', {
        clientId: clientId,
        clientName: client.name,
        adminId: req.admin.id
      });

      res.json({
        message: `Client '${clientId}' deleted successfully`,
        deleted_client: {
          id: client.id,
          name: client.name
        }
      });

    } catch (error) {
      logger.error('Failed to delete client', {
        error: error.message,
        clientId: req.params.id,
        adminId: req.admin.id
      });

      res.status(500).json({
        error: 'Failed to delete client',
        message: error.message
      });
    }
  }

  // POST /admin/clients/:id/test - Tester la connexion Monty
  async testMontyConnection(req, res) {
    try {
      const models = req.app.get('models');
      const clientId = req.params.id;

      const client = await models.Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          message: `No client found with ID: ${clientId}`
        });
      }

      // Invalider le cache pour forcer une nouvelle connexion
      // await models.TokenCache.destroy({ where: { client_id: clientId } });

      // Tester la connexion réelle avec Monty
      try {
        const token = await montyAuthService.getValidToken(client, models.TokenCache);
        
        // Récupérer les informations du token
        const tokenInfo = await models.TokenCache.findByPk(clientId);
        
        logger.info('Monty connection test successful', {
          clientId: clientId,
          adminId: req.admin.id,
          agentId: tokenInfo?.agent_id,
          resellerId: tokenInfo?.reseller_id
        });

        res.json({
          success: true,
          message: 'Monty connection successful',
          client_id: clientId,
          agent_id: tokenInfo?.agent_id || null,
          reseller_id: tokenInfo?.reseller_id || null,
          expires_at: tokenInfo?.expires_at || null,
          token_created_at: new Date().toISOString()
        });
      } catch (montyError) {
        logger.warn('Monty connection test failed', {
          clientId: clientId,
          adminId: req.admin.id,
          error: montyError.message
        });
        
        res.status(400).json({
          success: false,
          message: 'Failed to connect to Monty',
          error: montyError.message,
          client_id: clientId
        });
      }

    } catch (error) {
      logger.error('Monty connection test failed', {
        error: error.message,
        clientId: req.params.id,
        adminId: req.admin.id
      });

      res.status(500).json({
        success: false,
        error: 'Monty connection test failed',
        message: error.message
      });
    }
  }

  // POST /admin/clients/:id/activate - Activer un client
  async activateClient(req, res) {
    return this.toggleClientStatus(req, res, true);
  }

  // POST /admin/clients/:id/deactivate - Désactiver un client
  async deactivateClient(req, res) {
    return this.toggleClientStatus(req, res, false);
  }

  // Fonction utilitaire pour activer/désactiver
  async toggleClientStatus(req, res, active) {
    try {
      const models = req.app.get('models');
      const clientId = req.params.id;

      const client = await models.Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          message: `No client found with ID: ${clientId}`
        });
      }

      await client.update({ active });

      // Si désactivé, invalider le cache des tokens
      if (!active) {
        // await models.TokenCache.destroy({ where: { client_id: clientId } });
      }

      logger.info(`Client ${active ? 'activated' : 'deactivated'} successfully`, {
        clientId: clientId,
        adminId: req.admin.id
      });

      res.json({
        id: client.id,
        name: client.name,
        active: active,
        message: `Client ${active ? 'activated' : 'deactivated'} successfully`
      });

    } catch (error) {
      logger.error(`Failed to ${active ? 'activate' : 'deactivate'} client`, {
        error: error.message,
        clientId: req.params.id,
        adminId: req.admin.id
      });

      res.status(500).json({
        error: `Failed to ${active ? 'activate' : 'deactivate'} client`,
        message: error.message
      });
    }
  }

}

module.exports = new AdminClientController();