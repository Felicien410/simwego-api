#!/usr/bin/env node
// scripts/start-production.js - Script de démarrage production avec migrations automatiques

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function startProduction() {
  console.log('🚀 Starting SimWeGo API in production mode...');
  
  try {
    // Attendre que la base soit prête
    console.log('⏳ Waiting for database...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Lancer les migrations
    console.log('🔄 Running database migrations...');
    try {
      const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate');
      console.log('✅ Migrations completed:', stdout);
      if (stderr) console.log('Migration warnings:', stderr);
    } catch (migrationError) {
      console.log('⚠️ Migration skipped (likely already applied):', migrationError.message);
    }
    
    // Seeder les clients si nécessaire
    console.log('🌱 Seeding clients...');
    try {
      const { stdout: seedStdout } = await execAsync('node scripts/seed-clients.js');
      console.log('✅ Seeding completed:', seedStdout);
    } catch (seedError) {
      console.log('⚠️ Seeding skipped (likely already done):', seedError.message);
    }
    
    // Démarrer l'application
    console.log('🚀 Starting application...');
    require('../src/app.js');
    
  } catch (error) {
    console.error('❌ Production startup failed:', error);
    process.exit(1);
  }
}

startProduction();