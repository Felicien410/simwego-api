// scripts/seed-clients.js - Script pour initialiser les données clients
require('dotenv').config();
const { initializeDatabase } = require('../src/config/database');
const { initClient } = require('../src/models/Client');
const { initTokenCache } = require('../src/models/TokenCache');

async function seedClients() {
  let sequelize;
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialiser la base de données
    sequelize = await initializeDatabase();
    
    // Initialiser les modèles
    const Client = initClient(sequelize);
    const TokenCache = initTokenCache(sequelize);
    
    // Définir les associations
    Client.hasOne(TokenCache, { foreignKey: 'client_id', as: 'tokenCache' });
    TokenCache.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

    // Vérifier si les clients existent déjà
    const existingClients = await Client.count();
    
    if (existingClients > 0) {
      console.log(`⚠️  Database already contains ${existingClients} clients. Skipping seed.`);
      console.log('Use --force flag to recreate clients');
      return;
    }

    // Données des clients initiaux
    const clientsData = [
      {
        id: 'client1',
        name: 'Client 1',
        api_key: process.env.CLIENT1_API_KEY,
        monty_username: process.env.CLIENT1_MONTY_USERNAME,
        monty_password: process.env.CLIENT1_MONTY_PASSWORD,
        active: true
      },
      {
        id: 'client2', 
        name: 'Client 2',
        api_key: process.env.CLIENT2_API_KEY,
        monty_username: process.env.CLIENT2_MONTY_USERNAME,
        monty_password: process.env.CLIENT2_MONTY_PASSWORD,
        active: true
      }
    ];

    // Valider que les credentials existent
    for (const clientData of clientsData) {
      if (!clientData.monty_username || !clientData.monty_password || !clientData.api_key) {
        throw new Error(`Missing credentials for ${clientData.id}. Check environment variables CLIENT${clientData.id.slice(-1)}_API_KEY, CLIENT${clientData.id.slice(-1)}_MONTY_USERNAME, CLIENT${clientData.id.slice(-1)}_MONTY_PASSWORD.`);
      }
    }

    // Créer les clients
    console.log('📝 Creating clients...');
    
    for (const clientData of clientsData) {
      // Encrypt password manually to ensure it's done
      if (clientData.monty_password) {
        clientData.monty_password_encrypted = Client.encryptPassword(clientData.monty_password);
        delete clientData.monty_password; // Remove plain text password
      }
      
      const client = await Client.create(clientData);
      console.log(`✅ Created client: ${client.name} (${client.id})`);
      console.log(`   API Key: ${client.api_key}`);
      console.log(`   Monty Username: ${client.monty_username}`);
    }

    console.log(`🎉 Successfully seeded ${clientsData.length} clients!`);
    
    // Afficher un résumé
    console.log('\n📊 Summary:');
    const allClients = await Client.findAll({
      attributes: ['id', 'name', 'api_key', 'active', 'monty_username']
    });
    
    allClients.forEach(client => {
      console.log(`- ${client.name}: ${client.api_key} (${client.active ? 'Active' : 'Inactive'})`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Fonction pour forcer la re-création des clients
async function forceReseed() {
  let sequelize;
  
  try {
    console.log('🔄 Force reseeding clients...');
    
    sequelize = await initializeDatabase();
    
    const Client = initClient(sequelize);
    const TokenCache = initTokenCache(sequelize);
    
    // Supprimer tous les clients existants
    await TokenCache.destroy({ where: {}, force: true });
    await Client.destroy({ where: {}, force: true });
    
    console.log('🧹 Cleared existing clients');
    
    // Re-lancer le seed
    await sequelize.close();
    await seedClients();
    
  } catch (error) {
    console.error('❌ Error in force reseed:', error.message);
    process.exit(1);
  }
}

// Vérifier les arguments de ligne de commande
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--force')) {
    await forceReseed();
  } else {
    await seedClients();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { seedClients, forceReseed };