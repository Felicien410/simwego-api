// src/app.js - Application Express avec Architecture Modulaire Complète
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

// Sentry monitoring - must be imported first
const Sentry = require("@sentry/node");

// Security middleware - standard libraries
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');

// Imports locaux
const environment = require('./config/environment');
const { initializeDatabase, closeDatabase, logger } = require('./config/database');
const { passport } = require('./config/passport');
const { initClient } = require('./models/Client');
const { initTokenCache } = require('./models/TokenCache');
// Middleware d'authentification importé mais pas utilisé directement dans app.js

// NOUVEAU: Import des routes modulaires au lieu du proxy générique
const apiRoutes = require('./api/v0/routes/index');

class SimWeGoAPI {
  constructor() {
    this.app = express();
    this.sequelize = null;
    this.models = {};
    
    // Initialize Sentry monitoring if DSN is configured
    this.initializeSentry();
  }

  // Initialize Sentry monitoring
  initializeSentry() {
    if (environment.sentry.dsn) {
      Sentry.init({
        dsn: environment.sentry.dsn,
        environment: environment.sentry.environment,
        sendDefaultPii: true, // Send IP addresses and user data
        integrations: [
          Sentry.httpIntegration(),
          Sentry.expressIntegration({ app: this.app }),
        ],
        tracesSampleRate: environment.sentry.tracesSampleRate,
      });

      // Setup Sentry middleware - no additional setup needed
      // Error handler will be added in setupErrorHandling()

      logger.info('Sentry monitoring initialized', {
        environment: environment.sentry.environment,
        tracesSampleRate: environment.sentry.tracesSampleRate
      });
    } else {
      logger.info('Sentry DSN not configured - monitoring disabled');
    }
  }

  // Initialisation de la base de données et des modèles
  async initializeDatabase() {
    try {
      this.sequelize = await initializeDatabase();
      
      // Initialiser les modèles
      this.models.Client = initClient(this.sequelize);
      this.models.TokenCache = initTokenCache(this.sequelize);
      
      // Définir les associations
      this.models.Client.hasOne(this.models.TokenCache, {
        foreignKey: 'client_id',
        as: 'tokenCache'
      });
      
      this.models.TokenCache.belongsTo(this.models.Client, {
        foreignKey: 'client_id',
        as: 'client'
      });

      // Rendre les modèles disponibles pour toutes les routes
      this.app.set('models', this.models);

      logger.info('Database and models initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Configuration des middlewares globaux
  setupMiddleware() {
    // Trust proxy for Digital Ocean deployment
    this.app.set('trust proxy', true);
    
    // Rate limiting global (skip in test environment)
    if (!environment.isTest()) {
      const limiter = rateLimit({
        windowMs: environment.security.rateLimitWindow,
        max: environment.security.rateLimitMax,
        message: { error: 'Too many requests', retryAfter: Math.ceil(environment.security.rateLimitWindow / 1000) },
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use(limiter);

      // Slow down repeated requests
      const speedLimiter = slowDown({
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 100, // allow 100 requests per 15 minutes, then...
        delayMs: () => 500 // Fixed for v2 compatibility
      });
      this.app.use(speedLimiter);
    }

    // HTTP Parameter Pollution attacks
    this.app.use(hpp());

    // Sécurité
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors({
      origin: environment.security.allowedOrigins,
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Parsing JSON avec limite généreuse pour les gros payloads
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Configuration Passport.js
    this.app.use(passport.initialize());
    // Note: passport.session() n'est pas nécessaire pour une API stateless avec tokens

    // Logging global des requêtes avec détails
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request processed', {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: `${duration}ms`,
          contentLength: res.get('content-length') || 0,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          client: req.client?.name || null,
          clientId: req.client?.id || null
        });
      });
      
      next();
    });

    // Créer le dossier logs s'il n'existe pas
    const fs = require('fs');
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  // Configuration des routes avec architecture modulaire
  setupRoutes() {
    // Routes publiques (sans authentification)
    this.setupPublicRoutes();
    
    // Routes authentifiées d'administration
    this.setupAdminRoutes();
    
    // Routes d'administration avancées
    this.setupAdvancedAdminRoutes();
    
    // Documentation Swagger UI (AVANT les routes API pour éviter les conflits)
    this.setupSwaggerUI();
    
    // PRINCIPAL: Routes API modulaires (82 endpoints organisés) - APRÈS Swagger
    this.app.use('/api/v0', apiRoutes);
    
    // Gestion des erreurs et 404
    this.setupErrorHandling();
  }

  // Routes publiques (sans authentification)
  setupPublicRoutes() {
    // Route racine - Documentation API
    this.app.get('/', (req, res) => {
      res.json({
        name: 'SimWeGo API',
        description: 'Multi-client proxy to Monty eSIM API with modular architecture',
        version: '1.0.0',
        environment: environment.NODE_ENV,
        database: 'PostgreSQL',
        
        architecture: {
          type: 'Modular',
          controllers: 10,
          routeFiles: 10,
          totalEndpoints: 82,
          pattern: 'Controller → Service → Monty eSIM'
        },
        
        endpoints: {
          domains: {
            'Agent': '10 endpoints - Authentication, user management',
            'Bundles': '18 endpoints - eSIM packages and offers', 
            'Orders': '12 endpoints - Purchase history and management',
            'Reseller': '11 endpoints - Reseller account management',
            'Branch': '5 endpoints - Branch/location management',
            'Role': '6 endpoints - Permissions and roles',
            'NetworkList': '6 endpoints - Mobile network configurations',
            'IssueReport': '6 endpoints - Support and issue tracking',
            'Voucher': '5 endpoints - Promotional codes',
            'Utilities': '3 endpoints - Health, tokens, affiliate'
          }
        },
        
        usage: {
          authentication: 'Bearer [your_simwego_api_key]',
          baseUrl: '/api/v0/',
          examples: {
            login: 'POST /api/v0/Agent/login',
            bundles: 'GET /api/v0/Bundles',
            reserve: 'POST /api/v0/Bundles/Reserve',
            dashboard: 'GET /api/v0/Orders/Dashboard'
          }
        },
        
        documentation: {
          swaggerUI: '/api/ui/',
          openAPIJson: '/api/swagger.json',
          description: 'Complete API documentation with Swagger UI'
        },
        
        support: {
          health: '/health',
          clientInfo: '/client/info (auth required)',
          diagnostics: '/client/diagnostics (auth required)', 
          statistics: '/api/v0/stats/endpoints (auth required)'
        }
      });
    });

    // Health check détaillé avec architecture info
    this.app.get('/health', async (req, res) => {
      try {
        await this.sequelize.authenticate();
        
        const stats = await this.models.TokenCache.getCacheStats();
        const clientCount = await this.models.Client.count({ where: { active: true } });

        // Test de connectivité Monty (timeout court)
        let montyHealth = 'unknown';
        try {
          const montyAuthService = require('./services/montyAuth');
          const isHealthy = await Promise.race([
            montyAuthService.checkMontyAPIHealth(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]);
          montyHealth = isHealthy ? 'healthy' : 'unhealthy';
        } catch (error) {
          montyHealth = error.message === 'timeout' ? 'timeout' : 'error';
        }

        res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: environment.NODE_ENV,
          
          services: {
            database: 'connected',
            montyApi: {
              endpoint: environment.monty.apiBaseUrl,
              status: montyHealth,
              timeout: '3000ms'
            }
          },
          
          architecture: {
            type: 'Modular',
            controllers: ['agent', 'bundles', 'orders', 'reseller', 'branch', 'role', 'network', 'issue', 'voucher', 'utils'],
            endpoints: {
              total: 82,
              authenticated: 82,
              public: 3
            },
            pattern: 'Express → Auth → Controller → ProxyService → Monty → Response'
          },
          
          stats: {
            activeClients: clientCount,
            tokenCache: stats,
            uptime: Math.floor(process.uptime()),
            memory: {
              used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
              total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
            }
          }
        });
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          error: 'Service unavailable',
          services: {
            database: 'disconnected',
            montyApi: 'unknown'
          }
        });
      }
    });

    // Test de connectivité public
    this.app.get('/test', async (req, res) => {
      try {
        const montyAuthService = require('./services/montyAuth');
        const startTime = Date.now();
        const isHealthy = await Promise.race([
          montyAuthService.checkMontyAPIHealth(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        const responseTime = Date.now() - startTime;
        
        res.json({
          simwegoApi: 'OK',
          montyConnection: isHealthy ? 'OK' : 'FAILED',
          responseTime: `${responseTime}ms`,
          architecture: 'Modular (10 controllers)',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          simwegoApi: 'OK',
          montyConnection: 'ERROR',
          error: error.message,
          architecture: 'Modular (10 controllers)',
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Routes d'administration authentifiées
  setupAdminRoutes() {
    // Client info route - direct access for compatibility
    const { clientAuth } = require('./middleware/passportAuth');
    this.app.get('/client/info', clientAuth, require('./api/v0/controllers/clientController').getInfo);

    // Client diagnostics functionality moved to API v0 routes with Passport auth
  }


  // Routes d'administration avancées
  setupAdvancedAdminRoutes() {
    const adminRoutes = require('./admin/routes/index');
    
    // Monter les routes admin avec le préfixe /admin
    this.app.use('/admin', adminRoutes);
    
    logger.info('Advanced admin routes configured', {
      prefix: '/admin',
      endpoints: [
        'GET /admin/clients',
        'POST /admin/clients',
        'GET /admin/clients/:id',
        'PUT /admin/clients/:id',
        'DELETE /admin/clients/:id',
        'POST /admin/clients/:id/test',
        'GET /admin/stats'
      ]
    });
  }

  // Configuration de Swagger UI
  setupSwaggerUI() {
    try {
      const swaggerDocument = require('../docs/swagger-final.json');
      
      // Simple Swagger UI setup
      this.app.use('/api/v0/ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'SimWeGo API Documentation'
      }));

      logger.info('Swagger UI configured at /api/v0/ui');

    } catch (error) {
      logger.error('Failed to setup Swagger UI:', error.message);
    }
  }

  // Gestion des erreurs avec détails d'architecture
  setupErrorHandling() {
    // Route 404 avec aide à la navigation
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist in the modular API structure',
        
        availableRoutes: {
          public: [
            '/ (API documentation)',
            '/health (System health)',
            '/test (Connectivity test)',
            '/api/ui/ (Swagger UI documentation)'
          ],
          authenticated: [
            '/client/info (Client information)', 
            '/client/diagnostics (Advanced diagnostics)',
            '/api/v0/* (82 API endpoints)',
            '/api/swagger.json (OpenAPI specification)'
          ]
        },
        
        apiStructure: {
          '/api/v0/Agent/*': 'Authentication & user management (10 endpoints)',
          '/api/v0/Bundles/*': 'eSIM packages & offers (18 endpoints)',
          '/api/v0/Orders/*': 'Purchase history & management (12 endpoints)',
          '/api/v0/Reseller/*': 'Reseller management (11 endpoints)',
          '/api/v0/Branch/*': 'Branch management (5 endpoints)',
          '/api/v0/Role/*': 'Permissions & roles (6 endpoints)',
          '/api/v0/NetworkList*': 'Network configurations (6 endpoints)',
          '/api/v0/IssueReport*': 'Support & issues (6 endpoints)',
          '/api/v0/Voucher*': 'Promotional codes (5 endpoints)',
          '/api/v0/{Affiliate,Token,HealthCheck}': 'Utilities (3 endpoints)'
        },
        
        examples: [
          'POST /api/v0/Agent/login',
          'GET /api/v0/Bundles',
          'POST /api/v0/Bundles/Reserve',
          'GET /api/v0/Orders/Dashboard'
        ],
        
        timestamp: new Date().toISOString()
      });
    });

    // Sentry error handler (must be before other error handlers)
    if (environment.sentry.dsn) {
      this.app.use((req, res, next) => {
        res.locals.sentryRequestId = res.sentry;
        next();
      });
    }

    // Gestionnaire d'erreur global avec contexte d'architecture
    this.app.use((error, req, res, next) => {
      const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      // Capture error with Sentry if configured
      let sentryId = 'monitoring-disabled';
      if (environment.sentry.dsn) {
        Sentry.withScope((scope) => {
          scope.setTag('errorId', errorId);
          scope.setUser({
            id: req.client?.id || 'unknown',
            username: req.client?.name || 'anonymous'
          });
          scope.setContext('request', {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
          });
          sentryId = Sentry.captureException(error);
        });
      }
      
      // Log error with Sentry context if available
      logger.error('Unhandled application error:', {
        errorId,
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        client: req.client?.id || 'unknown',
        architecture: 'modular',
        sentryId
      });
      
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          message: environment.isDevelopment() 
            ? error.message 
            : 'An internal error occurred. Please contact SimWeGo support.',
          errorId,
          architecture: 'Modular API with 10 controllers',
          support: {
            logs: 'Check server logs for error ID: ' + errorId,
            contact: 'support@simwego.com',
            sentryId: sentryId
          },
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Démarrage du serveur avec informations d'architecture
  async start() {
    try {
      await this.initializeDatabase();
      
      this.setupMiddleware();
      this.setupRoutes();

      const server = this.app.listen(environment.PORT, '0.0.0.0', () => {
        // Logs structurés pour monitoring
        logger.info('SimWeGo API started successfully', {
          port: environment.PORT,
          environment: environment.NODE_ENV,
          architecture: 'modular',
          controllers: 10,
          endpoints: 82,
          montyTarget: environment.monty.apiBaseUrl,
          database: 'PostgreSQL'
        });

        // Console output pour développement
        console.log('\n🚀 SimWeGo API - Modular Architecture Started');
        console.log('================================================');
        console.log(`📡 Port: ${environment.PORT}`);
        console.log(`🏗️  Architecture: Modular (10 controllers)`);
        console.log(`🎯 Endpoints: 82 organized endpoints`);
        console.log(`🎯 Target: ${environment.monty.apiBaseUrl}`);
        console.log(`💾 Database: PostgreSQL`);
        console.log(`🌍 Environment: ${environment.NODE_ENV}`);
        console.log('\n📋 Quick Links:');
        console.log(`   API Docs: http://localhost:${environment.PORT}/`);
        console.log(`   Health: http://localhost:${environment.PORT}/health`);
        console.log(`   Client Info: http://localhost:${environment.PORT}/client/info`);
        console.log(`   Test: http://localhost:${environment.PORT}/test`);
        console.log('\n🎯 Example Endpoints:');
        console.log(`   POST /api/v0/Agent/login`);
        console.log(`   GET /api/v0/Bundles`);
        console.log(`   GET /api/v0/Orders/Dashboard`);
        console.log(`   GET /api/v0/stats/endpoints\n`);
      });

      // Gestion propre de l'arrêt
      const shutdown = async (signal) => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        
        server.close(async () => {
          logger.info('HTTP server closed');
          await closeDatabase();
          logger.info('Database connections closed');
          process.exit(0);
        });

        // Force shutdown après 30 secondes
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));

      return server;
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Démarrer l'application si ce fichier est exécuté directement
if (require.main === module) {
  const api = new SimWeGoAPI();
  api.start().catch(console.error);
}

module.exports = SimWeGoAPI;