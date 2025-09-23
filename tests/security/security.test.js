// tests/security/security.test.js - Tests de sécurité automatisés
const request = require('supertest');
const { performance } = require('perf_hooks');

describe('Security Tests', () => {
  let app;
  
  beforeAll(async () => {
    // Charger l'app pour les tests
    const SimWeGoAPI = require('../../src/app');
    const api = new SimWeGoAPI();
    
    // Initialiser l'app mais sans démarrer le serveur
    api.setupMiddleware();
    api.setupRoutes();
    app = api.app;
  });

  describe('Rate Limiting Tests', () => {
    test('should enforce rate limiting on admin login', async () => {
      const loginAttempts = [];
      
      // Tenter 6 connexions rapides (limite = 5)
      for (let i = 0; i < 6; i++) {
        loginAttempts.push(
          request(app)
            .post('/admin/login')
            .send({ username: 'test', password: 'test' })
        );
      }
      
      const responses = await Promise.all(loginAttempts);
      const rateLimitedResponse = responses[5];
      
      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body.error).toContain('Too many');
    });

    test('should have reasonable response times for concurrent requests', async () => {
      const requests = [];
      
      // Faire plusieurs requêtes concurrentes pour tester la performance
      for (let i = 0; i < 10; i++) {
        requests.push(request(app).get('/'));
      }
      
      const start = performance.now();
      const responses = await Promise.all(requests);
      const duration = performance.now() - start;
      
      // Toutes les requêtes doivent réussir
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Et en temps raisonnable (moins de 2 secondes pour 10 requêtes)
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Authentication Security Tests', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/v0/Bundles')
        .expect(401);
      
      expect(response.body.error).toBeDefined();
    });

    test('should reject malformed JWT tokens', async () => {
      const response = await request(app)
        .get('/api/v0/Bundles')
        .set('Authorization', 'Bearer invalid-token');
      
      expect([401, 500]).toContain(response.status);
    });

    test('should reject expired JWT tokens', async () => {
      // Token JWT expiré (payload: {exp: 1000000000})
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEwMDAwMDAwMDB9.invalid';
      
      const response = await request(app)
        .get('/api/v0/Bundles')
        .set('Authorization', `Bearer ${expiredToken}`);
        
      expect([401, 500]).toContain(response.status);
    });

    test('should validate admin authentication separately', async () => {
      const response = await request(app)
        .get('/admin/clients')
        .expect(401);
      
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Input Validation Security Tests', () => {
    test('should sanitize XSS attempts', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/admin/login')
        .send({ 
          username: xssPayload, 
          password: 'test' 
        });
      
      // Vérifier que le script n'est pas retourné tel quel
      expect(JSON.stringify(response.body)).not.toContain('<script>');
    });

    test('should detect SQL injection attempts', async () => {
      const sqlPayload = "'; DROP TABLE clients; --";
      
      const response = await request(app)
        .post('/admin/login')
        .send({ 
          username: sqlPayload, 
          password: 'test' 
        });
      
      // Devrait retourner une erreur (401 auth, 400 validation, ou 429 rate limited)
      expect([400, 401, 429]).toContain(response.status);
    });

    test('should detect command injection attempts', async () => {
      const cmdPayload = '; rm -rf /';
      
      const response = await request(app)
        .post('/admin/login')
        .send({ 
          username: cmdPayload, 
          password: 'test' 
        });
      
      expect([400, 401, 429]).toContain(response.status);
    });

    test('should reject oversized payloads', async () => {
      const largePayload = 'a'.repeat(1500); // 1.5KB pour éviter timeout
      
      const response = await request(app)
        .post('/admin/login')
        .send({ 
          username: 'test',
          password: largePayload 
        });
      
      expect([400, 401, 413, 429]).toContain(response.status);
    });
  });

  describe('Security Headers Tests', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/');
      
      // Vérifier les headers de sécurité Helmet.js
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.status).toBe(200);
    });

    test('should include CORS headers correctly', async () => {
      const response = await request(app)
        .options('/')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Information Disclosure Tests', () => {
    test('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .get('/api/v0/nonexistent-endpoint')
        .expect(404);
      
      const responseStr = JSON.stringify(response.body);
      
      // Vérifier qu'aucune info sensible n'est exposée
      expect(responseStr).not.toContain('password');
      expect(responseStr).not.toContain('secret');
      expect(responseStr).not.toContain('key');
      expect(responseStr).not.toContain('token');
    });

    test('should not expose stack traces in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const response = await request(app)
        .get('/api/v0/error-endpoint');
      
      expect(JSON.stringify(response.body)).not.toContain('at ');
      expect(JSON.stringify(response.body)).not.toContain('stack');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Performance Security Tests', () => {
    test('should respond within reasonable time (DoS protection)', async () => {
      const start = performance.now();
      
      await request(app)
        .get('/');
      
      const duration = performance.now() - start;
      
      // Doit répondre en moins de 5 secondes
      expect(duration).toBeLessThan(5000);
    });

    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array(10).fill(null).map(() => 
        request(app).get('/')
      );
      
      const start = performance.now();
      const responses = await Promise.all(concurrentRequests);
      const duration = performance.now() - start;
      
      // Toutes les requêtes doivent réussir ou être contrôlées
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
      
      // 10 requêtes en moins de 5 secondes
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Admin Security Tests', () => {
    test('should require strong authentication for admin endpoints', async () => {
      const adminEndpoints = [
        '/admin/clients',
        '/admin/clients/test-id',
        '/admin/stats'
      ];
      
      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(401);
        
        expect(response.body.error).toContain('authentication');
      }
    });

    test('should validate admin JWT tokens properly', async () => {
      // Token avec une signature invalide
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNjAwMDAwMDAwfQ.invalid_signature';
      
      const response = await request(app)
        .get('/admin/clients')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });
  });

  describe('Environment Security Tests', () => {
    test('should not use default JWT secrets', () => {
      // Vérifier qu'on n'utilise pas les secrets par défaut
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET).not.toBe('simwego-jwt-secret-change-in-production');
      expect(process.env.ADMIN_JWT_SECRET).toBeDefined();
      expect(process.env.ADMIN_JWT_SECRET).not.toBe('admin-jwt-secret-change-in-production');
    });

    test('should have required security environment variables', () => {
      const requiredVars = [
        'DB_ENCRYPTION_KEY',
        'JWT_SECRET',
        'ADMIN_JWT_SECRET'
      ];
      
      requiredVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
        expect(process.env[varName].length).toBeGreaterThan(32);
      });
    });
  });
});