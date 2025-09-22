#!/usr/bin/env node
// scripts/start-production.js - Script de démarrage production simplifié

async function startProduction() {
  console.log('🚀 Starting SimWeGo API in production mode...');
  
  try {
    // Démarrer l'application directement
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