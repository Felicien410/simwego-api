// migrations/001-create-clients.js - Création de la table clients
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
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
    });

    // Créer les index
    await queryInterface.addIndex('clients', ['api_key'], {
      unique: true,
      name: 'clients_api_key_unique'
    });

    await queryInterface.addIndex('clients', ['active'], {
      name: 'clients_active_index'
    });

    await queryInterface.addIndex('clients', ['created_at'], {
      name: 'clients_created_at_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clients');
  }
};