#!/usr/bin/env node
// scripts/migrate.js - Script de migrations et seeding pour production

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runMigrations() {
  console.log('🚀 Running database migrations and seeding...');
  
  try {
    // Debug: Afficher les variables d'environnement critiques
    console.log('🔍 Environment variables check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('DB_ENCRYPTION_KEY present:', !!process.env.DB_ENCRYPTION_KEY);
    
    // Test de connexion DB basique
    console.log('🔌 Testing database connection...');
    try {
      const { Sequelize } = require('sequelize');
      const sequelize = new Sequelize(process.env.DATABASE_URL, {
        logging: false,
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
      });
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
      await sequelize.close();
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      process.exit(1);
    }
    
    // Lancer les migrations
    console.log('🔄 Running database migrations...');
    try {
      const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate');
      console.log('✅ Migrations completed');
      if (stdout) console.log('Migration output:', stdout);
      if (stderr) console.log('Migration warnings:', stderr);
    } catch (migrationError) {
      console.error('❌ Migration failed:');
      console.error('Error message:', migrationError.message);
      if (migrationError.stdout) console.error('Stdout:', migrationError.stdout);
      if (migrationError.stderr) console.error('Stderr:', migrationError.stderr);
      process.exit(1);
    }
    
    // Seeder les clients si nécessaire
    console.log('🌱 Seeding clients...');
    try {
      const { stdout: seedStdout, stderr: seedStderr } = await execAsync('node scripts/seed-clients.js');
      console.log('✅ Seeding completed');
      if (seedStdout) console.log('Seeding output:', seedStdout);
      if (seedStderr) console.log('Seeding warnings:', seedStderr);
    } catch (seedError) {
      console.error('❌ Seeding failed:');
      console.error('Error message:', seedError.message);
      if (seedError.stdout) console.error('Stdout:', seedError.stdout);
      if (seedError.stderr) console.error('Stderr:', seedError.stderr);
      // Ne pas exit sur erreur de seeding, les données peuvent déjà exister
      console.log('⚠️  Continuing despite seeding error (data may already exist)');
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Lancer si appelé directement
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };