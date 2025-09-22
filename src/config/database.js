// src/config/database.js - Configuration PostgreSQL avec Sequelize
const { Sequelize } = require('sequelize');
const path = require('path');
const winston = require('winston');

// Configuration du logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'simwego-api' },
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') })
  ]
});

// Ajouter console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Configuration de la base de données
const config = {
  development: {
    username: process.env.DB_USER || 'simwego_user',
    password: process.env.DB_PASSWORD || 'simwego_password_2024',
    database: process.env.DB_NAME || 'simwego',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: (sql) => logger.info(sql),
    pool: {
      max: 8,
      min: 1,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 3
    }
  },
  test: {
    username: process.env.DB_USER || 'simwego_user',
    password: process.env.DB_PASSWORD || 'simwego_password_2024',
    database: process.env.DB_NAME || 'simwego_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    ...(process.env.DATABASE_URL ? {
      url: process.env.DATABASE_URL
    } : {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432
    }),
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];


// Initialiser Sequelize - utiliser DATABASE_URL en production
const sequelize = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000,
        evict: 1000
      }
    })
  : new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );

// Fonction de connexion avec retry
async function connectWithRetry(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      logger.info(`✅ Connected to PostgreSQL database: ${dbConfig.database}`);
      return;
    } catch (error) {
      logger.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, error.message);
      
      if (i === retries - 1) {
        throw error;
      }
      
      logger.info(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Fonction d'initialisation de la base de données
async function initializeDatabase() {
  try {
    await connectWithRetry();
    
    // Synchroniser les modèles (uniquement en développement)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('✅ Database models synchronized');
    }
    
    return sequelize;
  } catch (error) {
    logger.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// Fonction de fermeture propre
async function closeDatabase() {
  try {
    await sequelize.close();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
  }
}

// Gestion des signaux d'arrêt
process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

// Exports pour l'application ET Sequelize CLI
module.exports = {
  sequelize,
  connectWithRetry,
  initializeDatabase,
  closeDatabase,
  logger,
  config,
  // Export direct des configs pour Sequelize CLI
  development: config.development,
  test: config.test,
  production: config.production
};