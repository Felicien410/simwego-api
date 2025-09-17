// src/models/TokenCache.js - Modèle Cache des tokens Monty
const { DataTypes, Model } = require('sequelize');

class TokenCache extends Model {
  // Vérifier si le token est encore valide
  isValid(marginSeconds = 60) {
    const now = new Date();
    const expiryWithMargin = new Date(this.expires_at - (marginSeconds * 1000));
    return now < expiryWithMargin;
  }

  // Obtenir le temps restant avant expiration (en secondes)
  getTimeToExpiry() {
    const now = new Date();
    const expiryTime = new Date(this.expires_at);
    return Math.max(0, Math.floor((expiryTime - now) / 1000));
  }

  // Méthode pour formater la réponse
  toJSON() {
    return {
      client_id: this.client_id,
      agent_id: this.agent_id,
      reseller_id: this.reseller_id,
      expires_at: this.expires_at,
      is_valid: this.isValid(),
      time_to_expiry: this.getTimeToExpiry(),
      updated_at: this.updatedAt
    };
  }

  // Méthode statique pour nettoyer les tokens expirés
  static async cleanExpiredTokens() {
    const now = new Date();
    const deletedCount = await this.destroy({
      where: {
        expires_at: {
          [require('sequelize').Op.lt]: now
        }
      }
    });
    
    if (deletedCount > 0) {
      console.log(`Cleaned ${deletedCount} expired tokens from cache`);
    }
    
    return deletedCount;
  }

  // Méthode statique pour obtenir les statistiques du cache
  static async getCacheStats() {
    const totalTokens = await this.count();
    const validTokens = await this.count({
      where: {
        expires_at: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });
    
    return {
      total: totalTokens,
      valid: validTokens,
      expired: totalTokens - validTokens
    };
  }
}

// Fonction d'initialisation du modèle
function initTokenCache(sequelize) {
  TokenCache.init({
    client_id: {
      type: DataTypes.UUID,
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
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: {
          args: new Date().toISOString(),
          msg: 'Expiry date must be in the future'
        }
      }
    },
    agent_id: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 50]
      }
    },
    reseller_id: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 50]
      }
    }
  }, {
    sequelize,
    modelName: 'TokenCache',
    tableName: 'token_cache',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['expires_at']
      },
      {
        fields: ['client_id', 'expires_at']
      }
    ],
    hooks: {
      // Hook pour nettoyer automatiquement les tokens expirés lors de la création
      afterCreate: async () => {
        // Nettoyer les tokens expirés de façon asynchrone
        setImmediate(() => {
          TokenCache.cleanExpiredTokens().catch(console.error);
        });
      }
    }
  });

  return TokenCache;
}

module.exports = { TokenCache, initTokenCache };