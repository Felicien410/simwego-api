// migrations/002-create-token-cache.js - Création de la table token_cache
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_cache', {
      client_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
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
    });

    // Créer les index
    await queryInterface.addIndex('token_cache', ['expires_at'], {
      name: 'token_cache_expires_at_index'
    });

    await queryInterface.addIndex('token_cache', ['client_id', 'expires_at'], {
      name: 'token_cache_client_expires_index'
    });

    // Ajouter la contrainte de clé étrangère
    await queryInterface.addConstraint('token_cache', {
      fields: ['client_id'],
      type: 'foreign key',
      name: 'token_cache_client_id_fkey',
      references: {
        table: 'clients',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('token_cache');
  }
};