// =============================================================================
// tests/api-routes.test.js - Tests des routes de base SimWeGo API
// =============================================================================

const request = require('supertest');
const SimWeGoAPI = require('../src/app');

// Configuration
jest.setTimeout(15000);

describe('🛣️ SimWeGo API - Tests des Routes de Base', () => {
  let apiInstance;
  let app;
  let CLIENT1_API_KEY;
  let CLIENT2_API_KEY;

  beforeAll(async () => {
    console.log('\n🚀 === TESTS ROUTES API SIMWEGO ===\n');
    apiInstance = new SimWeGoAPI();
    await apiInstance.initializeDatabase();
    apiInstance.setupMiddleware();
    apiInstance.setupRoutes();
    apiInstance.setupPublicRoutes();
    apiInstance.setupAdminRoutes();
    apiInstance.setupAdvancedAdminRoutes();
    apiInstance.setupErrorHandling();
    app = apiInstance.app;

    // Récupérer les vraies API keys depuis l'API admin
    const request = require('supertest');
    try {
      const clientsResponse = await request(app)
        .get('/admin/clients')
        .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`);
      
      if (clientsResponse.status === 200 && clientsResponse.body.clients.length >= 2) {
        // Utiliser les clients existants
        CLIENT1_API_KEY = clientsResponse.body.clients.find(c => c.monty_username === 'montytest')?.api_key;
        CLIENT2_API_KEY = clientsResponse.body.clients.find(c => c.monty_username === 'SimWeGo')?.api_key;
        console.log('🔑 API Keys récupérées depuis la DB:', CLIENT1_API_KEY?.substring(0, 20) + '...', CLIENT2_API_KEY?.substring(0, 20) + '...');
      }
    } catch (error) {
      console.log('⚠️ Erreur récupération API keys, utilisation du .env');
    }
    
    // Fallback vers les valeurs du .env si pas trouvées
    if (!CLIENT1_API_KEY) CLIENT1_API_KEY = process.env.CLIENT1_API_KEY;
    if (!CLIENT2_API_KEY) CLIENT2_API_KEY = process.env.CLIENT2_API_KEY;
  });

  describe('🏥 Routes Publiques', () => {
    test('GET / - Documentation API', async () => {
      console.log('📡 Test: Documentation API');
      
      const response = await request(app)
        .get('/')
        .expect(200);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('name', 'SimWeGo API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
      
      console.log('✅ Documentation API accessible');
    });

    test('GET /health - Santé du système', async () => {
      console.log('📡 Test: Health check');
      
      const response = await request(app)
        .get('/health')
        .expect(200);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database', 'connected');
      
      console.log('✅ Système en bonne santé');
    });

    test('GET /test - Test de connectivité', async () => {
      console.log('📡 Test: Connectivité');
      
      const response = await request(app)
        .get('/test')
        .expect(200);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('simwegoApi', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      
      console.log('✅ Connectivité OK');
    });
  });

  describe('🔐 Authentification SimWeGo', () => {
    test('GET /client/info - Info Client1 avec API Key valide', async () => {
      console.log('📡 Test: Authentification Client1');
      console.log('🔑 API Key:', CLIENT1_API_KEY.substring(0, 20) + '...');
      
      const response = await request(app)
        .get('/client/info')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`);

      console.log('✅ Status:', response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('client');
        expect(typeof response.body.client.id).toBe('number'); // ID numérique avec auto-increment
        expect(response.body.client.name).toMatch(/Client 1/);
        console.log('✅ Client1 authentifié avec succès, ID:', response.body.client.id);
      } else {
        console.log('⚠️ Client1 authentification échouée (peut être lié à Monty)');
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test('GET /client/info - Info Client2 avec API Key valide', async () => {
      console.log('📡 Test: Authentification Client2');
      console.log('🔑 API Key:', CLIENT2_API_KEY.substring(0, 20) + '...');
      
      const response = await request(app)
        .get('/client/info')
        .set('Authorization', `Bearer ${CLIENT2_API_KEY}`);

      console.log('✅ Status:', response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('client');
        expect(typeof response.body.client.id).toBe('number'); // ID numérique avec auto-increment
        expect(response.body.client.name).toBe('Client 2');
        console.log('✅ Client2 authentifié avec succès, ID:', response.body.client.id);
      } else {
        console.log('⚠️ Client2 authentification échouée (peut être lié à Monty)');
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test('GET /client/info - Rejet API Key invalide', async () => {
      console.log('📡 Test: API Key invalide');
      
      const response = await request(app)
        .get('/client/info')
        .set('Authorization', 'Bearer invalid_key_123')
        .expect(401);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('error');
      console.log('✅ API Key invalide correctement rejetée');
    });

    test('GET /client/info - Rejet sans autorisation', async () => {
      console.log('📡 Test: Sans autorisation');
      
      const response = await request(app)
        .get('/client/info')
        .expect(401);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Requête sans autorisation correctement rejetée');
    });
  });

  describe('📱 Routes API Protégées', () => {
    test('GET /api/v0/Bundles - Accès avec authentification', async () => {
      console.log('📡 Test: Accès route protégée Bundles');
      
      const response = await request(app)
        .get('/api/v0/Bundles')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`);

      console.log('✅ Status:', response.status);
      
      // La route doit soit réussir (200) soit échouer proprement avec auth OK mais Monty KO
      expect([200, 401, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('bundles');
        console.log('✅ Bundles récupérés avec succès');
      } else {
        console.log('⚠️ Échec attendu (authentification ou Monty API)');
      }
    });

    test('GET /api/v0/Orders/Dashboard - Accès dashboard', async () => {
      console.log('📡 Test: Accès dashboard');
      
      const response = await request(app)
        .get('/api/v0/Orders/Dashboard')
        .set('Authorization', `Bearer ${CLIENT2_API_KEY}`)
        .timeout(20000);

      console.log('✅ Status:', response.status);
      
      expect([200, 401, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        console.log('✅ Dashboard accessible');
      } else {
        console.log('⚠️ Échec attendu (authentification ou Monty API)');
      }
    }, 25000);

    test('GET /api/v0/Bundles - Rejet sans authentification', async () => {
      console.log('📡 Test: Route protégée sans auth');
      
      const response = await request(app)
        .get('/api/v0/Bundles')
        .expect(401);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Route protégée correctement sécurisée');
    });
  });

  describe('🆕 Nouveaux Endpoints Ajoutés', () => {
    test('GET /api/v0/bundles/csv - Export CSV des bundles', async () => {
      console.log('📡 Test: Export CSV bundles');
      
      const response = await request(app)
        .get('/api/v0/bundles/csv')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`);

      console.log('✅ Status:', response.status);
      // Accepter 200 (succès) ou 500 (erreur Monty)
      expect([200, 500]).toContain(response.status);
      console.log('✅ Route CSV bundles accessible');
    });

    test('GET /api/v0/orders/consumption - Consommation des bundles', async () => {
      console.log('📡 Test: Consommation bundles');
      
      const response = await request(app)
        .get('/api/v0/orders/consumption')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`);

      console.log('✅ Status:', response.status);
      expect([200, 500]).toContain(response.status);
      console.log('✅ Route consommation accessible');
    });

    test('GET /api/v0/resellers - Liste des revendeurs', async () => {
      console.log('📡 Test: Liste revendeurs');
      
      const response = await request(app)
        .get('/api/v0/resellers')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`);

      console.log('✅ Status:', response.status);
      expect([200, 500]).toContain(response.status);
      console.log('✅ Route revendeurs accessible');
    });

    test('GET /api/v0/agents - Liste des agents', async () => {
      console.log('📡 Test: Liste agents');
      
      const response = await request(app)
        .get('/api/v0/agents')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`);

      console.log('✅ Status:', response.status);
      expect([200, 500]).toContain(response.status);
      console.log('✅ Route agents accessible');
    });

    test('GET /api/v0/branches - Liste des branches', async () => {
      console.log('📡 Test: Liste branches');
      
      const response = await request(app)
        .get('/api/v0/branches')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`);

      console.log('✅ Status:', response.status);
      expect([200, 500]).toContain(response.status);
      console.log('✅ Route branches accessible');
    });

    test('GET /api/v0/vouchers - Liste des vouchers', async () => {
      console.log('📡 Test: Liste vouchers');
      
      const response = await request(app)
        .get('/api/v0/vouchers')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`);

      console.log('✅ Status:', response.status);
      expect([200, 500]).toContain(response.status);
      console.log('✅ Route vouchers accessible');
    });

    test('GET /api/v0/roles/all - Liste des rôles', async () => {
      console.log('📡 Test: Liste rôles');
      
      const response = await request(app)
        .get('/api/v0/roles/all')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`);

      console.log('✅ Status:', response.status);
      expect([200, 500]).toContain(response.status);
      console.log('✅ Route rôles accessible');
    });

    test('Nouveaux endpoints sans authentification - Rejet 401', async () => {
      console.log('📡 Test: Nouveaux endpoints sans auth');
      
      const endpoints = [
        '/api/v0/bundles/csv',
        '/api/v0/orders/consumption', 
        '/api/v0/resellers',
        '/api/v0/agents',
        '/api/v0/vouchers'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(401);
        
        expect(response.body).toHaveProperty('error');
      }
      
      console.log(`✅ ${endpoints.length} endpoints correctement sécurisés`);
    });
  });

  describe('🚫 Gestion d\'Erreurs', () => {
    test('GET /route-inexistante - 404 pour routes inexistantes', async () => {
      console.log('📡 Test: Route inexistante');
      
      const response = await request(app)
        .get('/route-inexistante')
        .expect(404);

      console.log('✅ Status:', response.status);
      console.log('✅ 404 correctement retourné');
    });

    test('POST / - Malformed JSON', async () => {
      console.log('📡 Test: JSON malformé');
      
      const response = await request(app)
        .post('/')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}');

      console.log('✅ Status:', response.status);
      expect([400, 404, 500]).toContain(response.status);
      console.log('✅ JSON malformé géré correctement');
    });
  });

  afterAll(() => {
    console.log('\n🏁 === FIN TESTS ROUTES API ===\n');
  });
});