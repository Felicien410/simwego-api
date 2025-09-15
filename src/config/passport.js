// src/config/passport.js - Configuration des stratégies Passport
const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;

const { logger } = require('./database');
const montyAuthService = require('../services/montyAuth');

// Lazy load models to avoid circular dependencies
function getModels() {
  const { Client } = require('../models/Client');
  const { TokenCache } = require('../models/TokenCache');
  return { Client, TokenCache };
}

/**
 * Stratégie SimWeGo API Key (Bearer Token)
 * Utilisée pour authentifier les clients avec leur API key
 */
passport.use('simwego-apikey', new BearerStrategy(
  async (apiKey, done) => {
    try {
      const { Client } = getModels();
      
      const client = await Client.findOne({
        where: { api_key: apiKey, active: true }
      });

      if (!client) {
        logger.warn('Authentication failed: Invalid API key', { 
          apiKey: apiKey.substring(0, 10) + '...'
        });
        return done(null, false, { message: 'Invalid SimWeGo API key' });
      }

      if (!client.active) {
        logger.warn('Authentication failed: Client account suspended', { 
          clientId: client.id,
          clientName: client.name
        });
        return done(null, false, { message: 'Client account suspended' });
      }

      logger.info('Client authenticated successfully via API key', {
        clientId: client.id,
        clientName: client.name
      });

      // Convert Sequelize instance to plain object to avoid serialization issues
      const clientData = {
        id: client.id,
        name: client.name,
        api_key: client.api_key,
        active: client.active,
        monty_username: client.monty_username,
        monty_password_encrypted: client.monty_password_encrypted,
        created_at: client.createdAt,
        updated_at: client.updatedAt
      };

      return done(null, clientData, { scope: 'client' });

    } catch (error) {
      logger.error('API Key authentication error', {
        error: error.message,
        stack: error.stack
      });
      return done(error);
    }
  }
));

/**
 * Stratégie Monty Authentication
 * Utilisée pour authentifier les utilisateurs via Monty eSIM
 */
passport.use('monty-login', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  try {
    if (!req.user || !req.user.id) {
      return done(null, false, { message: 'Client authentication required first' });
    }

    const { Client, TokenCache } = getModels();
    const client = await Client.findByPk(req.user.id);

    if (!client) {
      return done(null, false, { message: 'Client not found' });
    }

    // Créer un client temporaire avec les credentials fournis pour l'authentification Monty
    const tempClient = {
      ...client.toJSON(),
      getMontyCredentials: () => ({ username, password })
    };

    // Authentifier avec Monty
    const tokenData = await montyAuthService.authenticateWithMonty(tempClient);

    // Sauvegarder le token en cache
    await TokenCache.upsert({
      client_id: client.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(tokenData.expires_in),
      agent_id: tokenData.agent_id,
      reseller_id: tokenData.reseller_id
    });

    logger.info('User authenticated successfully via Monty', {
      clientId: client.id,
      username: username,
      agentId: tokenData.agent_id,
      resellerId: tokenData.reseller_id
    });

    const userInfo = {
      clientId: client.id,
      username: username,
      agentId: tokenData.agent_id,
      resellerId: tokenData.reseller_id,
      tokenData
    };

    return done(null, userInfo, { scope: 'user' });

  } catch (error) {
    logger.error('Monty login error', {
      username: username,
      error: error.message
    });

    if (error.message.includes('Invalid') || error.message.includes('credentials')) {
      return done(null, false, { message: 'Invalid username or password' });
    }

    return done(error);
  }
}));

/**
 * Stratégie Admin JWT
 * Utilisée pour authentifier les administrateurs
 */
passport.use('admin-jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    if (!payload || payload.role !== 'admin') {
      return done(null, false, { message: 'Admin access required' });
    }

    const admin = {
      id: payload.id,
      username: payload.username,
      role: payload.role
    };

    logger.info('Admin authenticated successfully via JWT', {
      adminId: admin.id,
      username: admin.username
    });

    return done(null, admin, { scope: 'admin' });

  } catch (error) {
    logger.error('Admin JWT authentication error', {
      error: error.message,
      stack: error.stack
    });
    return done(error);
  }
}));

/**
 * Sérialisation/Désérialisation pour les sessions (si nécessaire)
 * Principalement utilisé pour les sessions web
 */
passport.serializeUser((user, done) => {
  if (user.id) {
    // Client
    done(null, { type: 'client', id: user.id });
  } else if (user.clientId) {
    // User via Monty
    done(null, { type: 'user', clientId: user.clientId, username: user.username });
  } else {
    // Admin
    done(null, { type: 'admin', id: user.id });
  }
});

passport.deserializeUser(async (serialized, done) => {
  try {
    if (serialized.type === 'client') {
      const { Client } = getModels();
      const client = await Client.findByPk(serialized.id);
      done(null, client);
    } else if (serialized.type === 'user') {
      const userInfo = {
        clientId: serialized.clientId,
        username: serialized.username
      };
      done(null, userInfo);
    } else if (serialized.type === 'admin') {
      const admin = { id: serialized.id, role: 'admin' };
      done(null, admin);
    } else {
      done(new Error('Unknown user type'));
    }
  } catch (error) {
    done(error);
  }
});

/**
 * Middleware pour obtenir automatiquement un token Monty valide
 */
async function ensureMontyToken(req, res, next) {
  if (!req.user || !req.user.id) {
    return next();
  }

  // Skip pour les routes de login
  const isLoginRoute = req.method === 'POST' && req.originalUrl.includes('/Agent/login');
  if (isLoginRoute) {
    return next();
  }

  try {
    const { Client, TokenCache } = getModels();
    const client = await Client.findByPk(req.user.id);
    
    if (client) {
      const montyToken = await montyAuthService.getValidToken(client, TokenCache);
      req.montyToken = montyToken;
      
      logger.debug('Monty token added to request', {
        clientId: client.id,
        hasToken: !!req.montyToken
      });
    }
  } catch (error) {
    logger.error('Failed to get Monty token', {
      clientId: req.user?.id,
      error: error.message
    });
    
    return res.status(500).json({
      error: 'Backend authentication failed',
      message: 'Unable to authenticate with eSIM service. Please try again or contact support.',
      code: 'MONTY_AUTH_FAILED'
    });
  }

  next();
}

module.exports = {
  passport,
  ensureMontyToken,
  
  // Utility functions
  requireAuth: (strategy = 'simwego-apikey') => passport.authenticate(strategy, { session: false }),
  requireAuthWithSession: (strategy = 'simwego-apikey') => passport.authenticate(strategy, { session: true }),
  
  // Pre-configured middleware combinations
  authenticateClient: [
    passport.authenticate('simwego-apikey', { session: false }),
    ensureMontyToken
  ],
  
  authenticateAdmin: passport.authenticate('admin-jwt', { session: false }),
  
  authenticateClientOnly: passport.authenticate('simwego-apikey', { session: false }),
  
  authenticateMontyUser: [
    passport.authenticate('simwego-apikey', { session: false }),
    passport.authenticate('monty-login', { session: false })
  ]
};