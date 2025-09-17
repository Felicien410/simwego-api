// migrations/004-convert-ids-to-uuid.js - Convert client IDs from auto-increment integers to UUIDs
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Create temporary table with UUID structure
      await queryInterface.createTable('clients_temp', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        old_id: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        api_key: {
          type: Sequelize.STRING(100),
          unique: true,
          allowNull: false
        },
        active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        monty_username: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        monty_password_encrypted: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // 2. Migrate existing data and generate UUIDs
      const existingClients = await queryInterface.sequelize.query(
        'SELECT * FROM clients ORDER BY id',
        { 
          type: Sequelize.QueryTypes.SELECT,
          transaction 
        }
      );

      console.log(`Migrating ${existingClients.length} clients to UUID format...`);

      const clientIdMapping = new Map();

      for (const client of existingClients) {
        const newUuid = require('crypto').randomUUID();
        clientIdMapping.set(client.id, newUuid);

        await queryInterface.bulkInsert('clients_temp', [{
          id: newUuid,
          old_id: client.id,
          name: client.name,
          api_key: client.api_key,
          active: client.active,
          monty_username: client.monty_username,
          monty_password_encrypted: client.monty_password_encrypted,
          created_at: client.created_at,
          updated_at: client.updated_at
        }], { transaction });
      }

      // 3. Create temporary token_cache table with UUID foreign keys
      await queryInterface.createTable('token_cache_temp', {
        client_id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          references: {
            model: 'clients_temp',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        access_token: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        refresh_token: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        agent_id: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        reseller_id: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // 4. Migrate token_cache data
      const existingTokens = await queryInterface.sequelize.query(
        'SELECT * FROM token_cache',
        { 
          type: Sequelize.QueryTypes.SELECT,
          transaction 
        }
      );

      console.log(`Migrating ${existingTokens.length} token cache entries...`);

      for (const token of existingTokens) {
        const newClientId = clientIdMapping.get(token.client_id);
        if (newClientId) {
          await queryInterface.bulkInsert('token_cache_temp', [{
            client_id: newClientId,
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            expires_at: token.expires_at,
            agent_id: token.agent_id,
            reseller_id: token.reseller_id,
            created_at: token.created_at,
            updated_at: token.updated_at
          }], { transaction });
        }
      }

      // 5. Drop old tables
      await queryInterface.dropTable('token_cache', { transaction });
      await queryInterface.dropTable('clients', { transaction });

      // 6. Rename temporary tables
      await queryInterface.renameTable('clients_temp', 'clients', { transaction });
      await queryInterface.renameTable('token_cache_temp', 'token_cache', { transaction });

      // 7. Remove the old_id column from clients
      await queryInterface.removeColumn('clients', 'old_id', { transaction });

      // 8. Recreate indexes
      await queryInterface.addIndex('clients', ['api_key'], {
        unique: true,
        name: 'clients_api_key_unique',
        transaction
      });

      await queryInterface.addIndex('clients', ['active'], {
        name: 'clients_active_index',
        transaction
      });

      await queryInterface.addIndex('clients', ['created_at'], {
        name: 'clients_created_at_index',
        transaction
      });

      await queryInterface.addIndex('token_cache', ['expires_at'], {
        name: 'token_cache_expires_at_index',
        transaction
      });

      await queryInterface.addIndex('token_cache', ['client_id', 'expires_at'], {
        name: 'token_cache_client_expires_index',
        transaction
      });

      await transaction.commit();
      console.log('Successfully migrated clients and token_cache to UUID format');

    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This is a destructive migration that cannot be easily reversed
    // In production, you should backup your data before running this migration
    throw new Error('This migration cannot be reversed automatically. Please restore from backup if needed.');
  }
};