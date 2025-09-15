// src/models/Client.js - Modèle Client avec Sequelize
const { DataTypes, Model } = require('sequelize');
const encryptionService = require('../services/encryption');

class Client extends Model {
  // Méthode pour chiffrer le mot de passe
  static encryptPassword(password) {
    return encryptionService.encryptPassword(password);
  }

  // Méthode pour déchiffrer le mot de passe
  static decryptPassword(encryptedPassword) {
    return encryptionService.decryptPassword(encryptedPassword);
  }

  // Méthode d'instance pour obtenir les credentials Monty déchiffrés
  getMontyCredentials() {
    return {
      username: this.monty_username,
      password: Client.decryptPassword(this.monty_password_encrypted)
    };
  }

  // Méthode d'instance pour mettre à jour le mot de passe Monty
  async updateMontyPassword(newPassword) {
    this.monty_password_encrypted = Client.encryptPassword(newPassword);
    await this.save();
  }

  // Méthode pour générer une nouvelle clé API
  static generateApiKey(clientId) {
    return encryptionService.generateApiKey(clientId);
  }

  // Méthode pour formater la réponse (sans données sensibles)
  toSafeJSON() {
    return {
      id: this.id,
      name: this.name,
      api_key: this.api_key,
      active: this.active,
      monty_username: this.monty_username,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

}

// Fonction d'initialisation du modèle
function initClient(sequelize) {
  Client.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    api_key: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 100]
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    monty_username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    monty_password_encrypted: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Champ virtuel pour le mot de passe en clair (utilisé temporairement)
    monty_password: {
      type: DataTypes.VIRTUAL,
      set(value) {
        this.setDataValue('monty_password', value);
      }
    }
  }, {
    sequelize,
    modelName: 'Client',
    tableName: 'clients',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['api_key']
      },
      {
        fields: ['active']
      },
      {
        fields: ['created_at']
      }
    ],
  });

  return Client;
}

module.exports = { Client, initClient };