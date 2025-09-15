// migrations/003-modify-clients-id-autoincrement.js - Modifier l'ID pour auto-increment
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Supprimer les contraintes existantes
    await queryInterface.removeConstraint('token_cache', 'token_cache_client_id_fkey');
    
    // Supprimer la table clients existante et la recréer avec ID auto-increment
    await queryInterface.dropTable('clients');
    
    // Recréer la table clients avec ID auto-increment
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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

    // Recréer les index
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

    // Modifier la table token_cache pour utiliser INTEGER au lieu de STRING
    await queryInterface.dropTable('token_cache');
    
    await queryInterface.createTable('token_cache', {
      client_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'clients',
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
    });

    // Recréer les index pour token_cache
    await queryInterface.addIndex('token_cache', ['expires_at'], {
      name: 'token_cache_expires_at_index'
    });

    await queryInterface.addIndex('token_cache', ['client_id', 'expires_at'], {
      name: 'token_cache_client_expires_index'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revenir à l'ancienne structure avec STRING ID
    await queryInterface.dropTable('token_cache');
    await queryInterface.dropTable('clients');
    
    // Recréer avec l'ancienne structure
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

    await queryInterface.createTable('token_cache', {
      client_id: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'clients',
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
    });
  }
};