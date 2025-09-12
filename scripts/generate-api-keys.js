#!/usr/bin/env node
// scripts/generate-api-keys.js - Générateur de clés API sécurisées

require('dotenv').config();
const crypto = require('crypto');
const { initializeDatabase } = require('../src/config/database');
const { initClient } = require('../src/models/Client');

/**
 * Génère une API key sécurisée
 * @param {string} clientId - Identifiant du client
 * @returns {string} API key sécurisée
 */
function generateSecureApiKey(clientId = null) {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(32).toString('hex');
  
  if (clientId) {
    return `swg_${clientId}_${timestamp}_${randomBytes.substring(0, 16)}`;
  }
  
  return `swg_${timestamp}_${randomBytes}`;
}

/**
 * Génère des clés de chiffrement sécurisées
 */
function generateEncryptionKeys() {
  return {
    dbEncryptionKey: crypto.randomBytes(32).toString('base64'),
    jwtSecret: crypto.randomBytes(32).toString('base64'),
    apiSecret: crypto.randomBytes(64).toString('hex')
  };
}

/**
 * Met à jour l'API key d'un client dans la base
 */
async function updateClientApiKey(clientId, newApiKey) {
  let sequelize;
  
  try {
    sequelize = await initializeDatabase();
    const Client = initClient(sequelize);
    
    const client = await Client.findByPk(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }
    
    client.api_key = newApiKey;
    await client.save();
    
    console.log(`✅ API key updated for client ${clientId}: ${newApiKey}`);
    return newApiKey;
    
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

/**
 * Génère de nouvelles API keys pour tous les clients
 */
async function regenerateAllApiKeys() {
  let sequelize;
  
  try {
    console.log('🔄 Regenerating all API keys...\n');
    
    sequelize = await initializeDatabase();
    const Client = initClient(sequelize);
    
    const clients = await Client.findAll();
    const newKeys = {};
    
    for (const client of clients) {
      const newApiKey = generateSecureApiKey(client.id);
      client.api_key = newApiKey;
      await client.save();
      
      newKeys[client.id] = newApiKey;
      console.log(`✅ ${client.name} (${client.id}): ${newApiKey}`);
    }
    
    console.log('\n📝 Update your .env file with these new keys:');
    Object.entries(newKeys).forEach(([clientId, apiKey], index) => {
      const envVar = `CLIENT${index + 1}_API_KEY`;
      console.log(`${envVar}=${apiKey}`);
    });
    
    return newKeys;
    
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  
  try {
    switch (args[0]) {
      case 'generate':
        const clientId = args[1];
        if (clientId) {
          const apiKey = generateSecureApiKey(clientId);
          console.log(`Generated API key for ${clientId}: ${apiKey}`);
        } else {
          const apiKey = generateSecureApiKey();
          console.log(`Generated API key: ${apiKey}`);
        }
        break;
        
      case 'update':
        const updateClientId = args[1];
        if (!updateClientId) {
          console.error('❌ Client ID required for update');
          process.exit(1);
        }
        const newApiKey = generateSecureApiKey(updateClientId);
        await updateClientApiKey(updateClientId, newApiKey);
        break;
        
      case 'regenerate':
        await regenerateAllApiKeys();
        break;
        
      case 'keys':
        const keys = generateEncryptionKeys();
        console.log('🔐 Generated encryption keys:\n');
        console.log(`DB_ENCRYPTION_KEY=${keys.dbEncryptionKey}`);
        console.log(`JWT_SECRET=${keys.jwtSecret}`);
        console.log(`API_SECRET=${keys.apiSecret}`);
        console.log('\n⚠️  Save these keys securely and update your .env file');
        break;
        
      case 'security':
        console.log('🛡️  Security configuration:');
        console.log('RATE_LIMIT_MAX=50');
        console.log('RATE_LIMIT_WINDOW_MS=900000  # 15 minutes');
        console.log('LOG_LEVEL=warn');
        console.log('NODE_ENV=production');
        console.log('DB_SSL=true');
        break;
        
      default:
        console.log(`
🔐 SimWeGo API Key Generator

Usage:
  node generate-api-keys.js <command> [options]

Commands:
  generate [clientId]     Generate a new API key
  update <clientId>       Update API key for specific client
  regenerate              Regenerate all client API keys
  keys                    Generate encryption keys (DB, JWT)
  security               Show security configuration

Examples:
  node generate-api-keys.js generate client1
  node generate-api-keys.js update client1
  node generate-api-keys.js regenerate
  node generate-api-keys.js keys
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export des fonctions pour usage programmatique
module.exports = {
  generateSecureApiKey,
  generateEncryptionKeys,
  updateClientApiKey,
  regenerateAllApiKeys
};

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}