// src/services/tokenCleanupScheduler.js - Service de nettoyage programmé des tokens
const { TokenCache } = require('../models/TokenCache');
const { logger } = require('../config/database');

class TokenCleanupScheduler {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    // Nettoyer toutes les heures par défaut
    this.intervalMs = 60 * 60 * 1000; // 1 heure
  }

  // Démarrer le nettoyage programmé
  start(intervalMs = this.intervalMs) {
    if (this.isRunning) {
      logger.warn('Token cleanup scheduler is already running');
      return;
    }

    this.intervalMs = intervalMs;
    this.intervalId = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        logger.error('Error during scheduled token cleanup:', error);
      }
    }, this.intervalMs);

    this.isRunning = true;
    logger.info(`Token cleanup scheduler started (interval: ${Math.round(intervalMs / 1000 / 60)} minutes)`);
  }

  // Arrêter le nettoyage programmé
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Token cleanup scheduler stopped');
  }

  // Effectuer le nettoyage
  async cleanup() {
    try {
      const deletedCount = await TokenCache.cleanExpiredTokens();
      if (deletedCount > 0) {
        logger.info(`Scheduled cleanup removed ${deletedCount} expired tokens`);
      }
      return deletedCount;
    } catch (error) {
      logger.error('Error during token cleanup:', error);
      throw error;
    }
  }

  // Obtenir le statut du scheduler
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: Math.round(this.intervalMs / 1000 / 60)
    };
  }
}

// Instance singleton
const tokenCleanupScheduler = new TokenCleanupScheduler();

module.exports = { TokenCleanupScheduler, tokenCleanupScheduler };