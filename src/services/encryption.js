// src/services/encryption.js - Service de chiffrement centralisé
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.salt = 'salt';
  }

  /**
   * Génère la clé de chiffrement à partir de la clé d'environnement
   * @returns {Buffer} Clé de chiffrement
   */
  getEncryptionKey() {
    return crypto.scryptSync(
      process.env.DB_ENCRYPTION_KEY || 'simwego-default-key', 
      this.salt, 
      32
    );
  }

  /**
   * Chiffre un mot de passe
   * @param {string} password - Mot de passe en clair
   * @returns {string} Mot de passe chiffré au format iv:encrypted
   */
  encryptPassword(password) {
    if (!password) {
      throw new Error('Password cannot be empty');
    }

    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Déchiffre un mot de passe
   * @param {string} encryptedPassword - Mot de passe chiffré au format iv:encrypted
   * @returns {string} Mot de passe en clair
   */
  decryptPassword(encryptedPassword) {
    if (!encryptedPassword || !encryptedPassword.includes(':')) {
      throw new Error('Invalid encrypted password format');
    }
    
    const key = this.getEncryptionKey();
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Génère une clé API sécurisée
   * @param {string} clientId - Identifiant UUID du client
   * @returns {string} Clé API sécurisée
   */
  generateApiKey(clientId) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('hex');
    // Use a hash of the clientId to avoid exposing the UUID
    const clientHash = crypto.createHash('sha256').update(clientId).digest('hex').substring(0, 8);
    return `swg_${clientHash}_${timestamp}_${random}`;
  }
}

// Export singleton
module.exports = new EncryptionService();