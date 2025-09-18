// src/config/environment.js - Configuration centralisée des variables d'environnement
require('dotenv').config();

const environment = {
  // Configuration serveur
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT),
  
  // Configuration base de données
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
    encryptionKey: process.env.DB_ENCRYPTION_KEY,
  },

  // Configuration Monty eSIM
  monty: {
    apiBaseUrl: process.env.MONTY_API_BASE_URL,
    timeout: parseInt(process.env.MONTY_API_TIMEOUT),
  },

  // Configuration sécurité
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(','),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    jwtSecret: process.env.JWT_SECRET || 'simwego-jwt-secret-change-in-production'
  },

  // Configuration des clients par défaut
  clients: {
    client1: {
      montyUsername: process.env.CLIENT1_MONTY_USERNAME,
      montyPassword: process.env.CLIENT1_MONTY_PASSWORD
    },
    client2: {
      montyUsername: process.env.CLIENT2_MONTY_USERNAME,
      montyPassword: process.env.CLIENT2_MONTY_PASSWORD
    }
  },

  // Configuration logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '10MB'
  },

  // Configuration Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1
  }
};

// Validation des variables critiques
function validateEnvironment() {
  const required = [
    'database.password',
    'database.encryptionKey',
    'clients.client1.montyUsername',
    'clients.client1.montyPassword',
    'clients.client2.montyUsername',
    'clients.client2.montyPassword'
  ];

  const missing = [];

  required.forEach(path => {
    const keys = path.split('.');
    let value = environment;
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    if (!value) {
      missing.push(path);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Avertissements pour les valeurs par défaut en production
  if (environment.NODE_ENV === 'production') {
    const warnings = [];
    
    if (environment.database.encryptionKey === 'simwego-default-key') {
      warnings.push('Using default encryption key in production');
    }
    
    if (environment.security.jwtSecret === 'simwego-jwt-secret-change-in-production') {
      warnings.push('Using default JWT secret in production');
    }
    
    if (warnings.length > 0) {
      console.warn('SECURITY WARNINGS:', warnings.join(', '));
    }
  }
}

// Fonction helper pour vérifier si on est en développement
function isDevelopment() {
  return environment.NODE_ENV === 'development';
}

// Fonction helper pour vérifier si on est en production
function isProduction() {
  return environment.NODE_ENV === 'production';
}

// Fonction helper pour vérifier si on est en test
function isTest() {
  return environment.NODE_ENV === 'test';
}

// Valider au chargement du module
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

module.exports = {
  ...environment,
  isDevelopment,
  isProduction,
  isTest,
  validateEnvironment
};