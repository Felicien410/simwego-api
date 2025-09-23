#!/usr/bin/env node
// scripts/start-production.js - Script de démarrage production avec migrations automatiques

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function startProduction() {
  console.log('🚀 Starting SimWeGo API in production mode...');
  
  try {
    // Essayer les migrations avec timeout de sécurité
    console.log('🔄 Running database migrations with timeout...');
    try {
      await Promise.race([
        execAsync('npm run migrate'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Migration timeout')), 30000)
        )
      ]);
      console.log('✅ Database migrations completed successfully');
    } catch (migrationError) {
      console.log('⚠️ Migration failed or timeout, continuing startup...');
      console.log('Migration error:', migrationError.message);
    }
    
    // Démarrer l'application
    console.log('📦 Loading app module...');
    const SimWeGoAPI = require('../src/app.js');
    console.log('🏗️ Creating app instance...');
    const api = new SimWeGoAPI();
    console.log('🚀 Starting server...');
    await api.start();
    console.log('✅ Application started successfully!');
    
  } catch (error) {
    console.error('❌ Production startup failed:', error);
    process.exit(1);
  }
}

startProduction();