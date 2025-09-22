#!/usr/bin/env node
// scripts/start-production.js - Script de démarrage production avec migrations automatiques

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function startProduction() {
  console.log('🚀 Starting SimWeGo API in production mode...');
  
  try {
    // Debug: Afficher les variables d'environnement critiques
    console.log('🔍 Environment variables check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT);
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('DB_PASSWORD present:', !!process.env.DB_PASSWORD);
    console.log('DB_ENCRYPTION_KEY present:', !!process.env.DB_ENCRYPTION_KEY);
    
    // Test de connexion DB basique
    console.log('🔌 Testing database connection...');
    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(process.env.DATABASE_URL, {
        logging: console.log,
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
      });
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
      await sequelize.close();
    } catch (dbError) {
      console.log('❌ Database connection failed:', dbError.message);
    }
    
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
      console.log('❌ Migration failed with details:');
      console.log('Error message:', migrationError.message);
      console.log('Stdout:', migrationError.stdout);
      console.log('Stderr:', migrationError.stderr);
    }
    
    // Seeder les clients si nécessaire
    console.log('🌱 Seeding clients...');
    try {
      const { stdout: seedStdout } = await execAsync('node scripts/seed-clients.js');
      console.log('✅ Seeding completed:', seedStdout);
    } catch (seedError) {
      console.log('❌ Seeding failed with details:');
      console.log('Error message:', seedError.message);
      console.log('Stdout:', seedError.stdout);
      console.log('Stderr:', seedError.stderr);
    }
    
    // Démarrer l'application
    console.log('🚀 Starting application...');
    try {
      console.log('📦 Loading app module...');
      const SimWeGoAPI = require('../src/app.js');
      console.log('🏗️ Creating app instance...');
      const api = new SimWeGoAPI();
      console.log('🚀 Starting server...');
      await api.start();
      console.log('✅ Application started successfully!');
    } catch (appError) {
      console.error('❌ Application startup failed:');
      console.error('Error message:', appError.message);
      console.error('Stack trace:', appError.stack);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Production startup failed:', error);
    process.exit(1);
  }
}

startProduction();