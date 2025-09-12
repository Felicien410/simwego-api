// =============================================================================
// tests/integration.test.js - Tests d'intégration réels SimWeGo API
// =============================================================================

const request = require('supertest');
const SimWeGoAPI = require('../src/app');

// Configuration des tests avec timeout étendu pour les vraies API calls
jest.setTimeout(30000);

// Global variables for all test suites
let apiInstance;
let app;
const CLIENT1_API_KEY = process.env.CLIENT1_API_KEY;
const CLIENT2_API_KEY = process.env.CLIENT2_API_KEY;
const ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN;

describe('🚀 SimWeGo API - Tests d\'Intégration Réels', () => {

  // Démarrage de l'API avant les tests
  beforeAll(async () => {
    apiInstance = new SimWeGoAPI();
    await apiInstance.initializeDatabase();
    apiInstance.setupMiddleware();
    apiInstance.setupRoutes();
    apiInstance.setupPublicRoutes();
    apiInstance.setupAdminRoutes();
    apiInstance.setupAdvancedAdminRoutes();
    apiInstance.setupErrorHandling();
    app = apiInstance.app;
  });

  // Note: Database cleanup moved to global afterAll at end of file

  describe('🏥 Santé et Status de l\'API', () => {
    test('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('stats');
    });

    test('should respond to root endpoint', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'SimWeGo API');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('🔐 Authentification et Client Info', () => {
    test('should authenticate client1 and get real info', async () => {
      console.log('📋 Curl equivalent:');
      console.log(`curl -H "Authorization: Bearer ${CLIENT1_API_KEY}" http://localhost:3001/client/info`);
      console.log('');
      
      const response = await request(app)
        .get('/client/info')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`)
        .expect(200);

      expect(response.body).toHaveProperty('client');
      expect(response.body.client.id).toBe('client1');
      expect(['Client 1', 'Client 1 Modified']).toContain(response.body.client.name);
      expect(response.body.client.monty_username).toBe('montytest');
      expect(response.body.client.active).toBe(true);

      // Vérification de la connexion Monty
      expect(response.body).toHaveProperty('montyConnection');
      expect(response.body.montyConnection.authenticated).toBe(true);
      expect(response.body.montyConnection).toHaveProperty('agentId');
      expect(response.body.montyConnection).toHaveProperty('resellerId');
      
      console.log('✅ Client1 - Agent ID:', response.body.montyConnection.agentId);
      console.log('✅ Client1 - Reseller ID:', response.body.montyConnection.resellerId);
    });

    test('should authenticate client2 and get real info', async () => {
      console.log('📋 Curl equivalent:');
      console.log(`curl -H "Authorization: Bearer ${CLIENT2_API_KEY}" http://localhost:3001/client/info`);
      console.log('');
      
      const response = await request(app)
        .get('/client/info')
        .set('Authorization', `Bearer ${CLIENT2_API_KEY}`)
        .expect(200);

      expect(response.body).toHaveProperty('client');
      expect(response.body.client.id).toBe('client2');
      expect(response.body.client.name).toBe('Client 2');
      expect(response.body.client.monty_username).toBe('SimWeGo');
      expect(response.body.client.active).toBe(true);

      // Vérification de la connexion Monty
      expect(response.body).toHaveProperty('montyConnection');
      expect(response.body.montyConnection.authenticated).toBe(true);
      expect(response.body.montyConnection).toHaveProperty('agentId');
      expect(response.body.montyConnection).toHaveProperty('resellerId');
      
      console.log('✅ Client2 - Agent ID:', response.body.montyConnection.agentId);
      console.log('✅ Client2 - Reseller ID:', response.body.montyConnection.resellerId);
    });

    test('should reject invalid API key', async () => {
      const response = await request(app)
        .get('/client/info')
        .set('Authorization', 'Bearer invalid_key')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('📦 Bundles - Données Réelles Monty', () => {
    test('should get real bundles from Monty for client1', async () => {
      console.log('📋 Curl equivalent:');
      console.log(`curl -H "Authorization: Bearer ${CLIENT1_API_KEY}" http://localhost:3001/api/v0/Bundles`);
      console.log('');
      
      const response = await request(app)
        .get('/api/v0/Bundles')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`)
        .expect(200);

      expect(response.body).toHaveProperty('bundles');
      expect(Array.isArray(response.body.bundles)).toBe(true);
      expect(response.body.bundles.length).toBeGreaterThan(0);

      // Vérification de la structure des bundles
      const bundle = response.body.bundles[0];
      expect(bundle).toHaveProperty('bundle_code');
      expect(bundle).toHaveProperty('bundle_name');
      expect(bundle).toHaveProperty('country_code');
      expect(bundle).toHaveProperty('reseller_retail_price');
      expect(bundle).toHaveProperty('subscriber_price');
      
      console.log(`✅ Client1 - ${response.body.bundles.length} bundles disponibles`);
      console.log(`✅ Exemple: ${bundle.bundle_name} - ${bundle.reseller_retail_price}USD`);
    });

    test('should get real bundles from Monty for client2', async () => {
      console.log('📋 Curl equivalent:');
      console.log(`curl -H "Authorization: Bearer ${CLIENT2_API_KEY}" http://localhost:3001/api/v0/Bundles`);
      console.log('');
      
      const response = await request(app)
        .get('/api/v0/Bundles')
        .set('Authorization', `Bearer ${CLIENT2_API_KEY}`)
        .expect(200);

      expect(response.body).toHaveProperty('bundles');
      expect(Array.isArray(response.body.bundles)).toBe(true);
      expect(response.body.bundles.length).toBeGreaterThan(0);

      console.log(`✅ Client2 - ${response.body.bundles.length} bundles disponibles`);
    });
  });

  describe('💰 Sales Dashboard - Données Réelles', () => {
    test('should get real sales dashboard for client1', async () => {
      console.log('📋 Curl equivalent:');
      console.log(`curl -H "Authorization: Bearer ${CLIENT1_API_KEY}" http://localhost:3001/api/v0/Orders/Dashboard`);
      console.log('');
      
      const response = await request(app)
        .get('/api/v0/Orders/Dashboard')
        .set('Authorization', `Bearer ${CLIENT1_API_KEY}`)
        .expect(200);

      expect(response.body).toHaveProperty('response_code', '0200');
      expect(response.body).toHaveProperty('title', 'Success');
      expect(response.body).toHaveProperty('bundles_sold');
      expect(response.body).toHaveProperty('top_five_bundles');
      expect(Array.isArray(response.body.bundles_sold)).toBe(true);
      expect(Array.isArray(response.body.top_five_bundles)).toBe(true);
      
      console.log('✅ Client1 Sales Dashboard:', {
        gross_sales_usd: response.body.gross_sales_volume_usd,
        net_sales_usd: response.body.net_sales_volume_usd,
        bundles_sold_months: response.body.bundles_sold.length,
        top_bundles: response.body.top_five_bundles.length
      });
    });

    test('should get real sales dashboard for client2', async () => {
      console.log('📋 Curl equivalent:');
      console.log(`curl -H "Authorization: Bearer ${CLIENT2_API_KEY}" http://localhost:3001/api/v0/Orders/Dashboard`);
      console.log('');
      
      const response = await request(app)
        .get('/api/v0/Orders/Dashboard')
        .set('Authorization', `Bearer ${CLIENT2_API_KEY}`)
        .expect(200);

      expect(response.body).toHaveProperty('response_code', '0200');
      expect(response.body).toHaveProperty('title', 'Success');
      expect(response.body).toHaveProperty('bundles_sold');
      expect(response.body).toHaveProperty('top_five_bundles');
      
      console.log('✅ Client2 Sales Dashboard:', {
        gross_sales_usd: response.body.gross_sales_volume_usd,
        net_sales_usd: response.body.net_sales_volume_usd,
        bundles_sold_months: response.body.bundles_sold.length,
        top_bundles: response.body.top_five_bundles.length
      });
    });
  });


});

describe('🛡️ Admin API - Tests d\'Intégration', () => {
  
  describe('📊 Admin Stats', () => {
    test('should get admin statistics', async () => {
      console.log('📋 Curl equivalent:');
      console.log(`curl -H \"Authorization: Bearer ${ADMIN_TOKEN}\" http://localhost:3001/admin/stats`);
      console.log('');
      
      const response = await request(app)
        .get('/admin/stats')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(response.body).toHaveProperty('clients');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body).toHaveProperty('system');
      
      console.log('✅ Admin Stats:', {
        total_clients: response.body.clients.total,
        active_clients: response.body.clients.active,
        environment: response.body.system.environment
      });
    });
  });

  describe('👥 Admin Client Management', () => {
    test('should list all clients', async () => {
      const response = await request(app)
        .get('/admin/clients')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(response.body).toHaveProperty('clients');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.clients)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);

      console.log(`✅ Admin - ${response.body.total} clients listés`);
      
      response.body.clients.forEach(client => {
        console.log(`  - ${client.id}: ${client.name} (${client.active ? 'active' : 'inactive'})`);
      });
    });

    test('should test Monty connection for client1', async () => {
      const response = await request(app)
        .post('/admin/clients/client1/test')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('client_id', 'client1');
      expect(response.body).toHaveProperty('agent_id');
      expect(response.body).toHaveProperty('reseller_id');

      console.log('✅ Admin Test Client1:', {
        success: response.body.success,
        agent_id: response.body.agent_id,
        reseller_id: response.body.reseller_id
      });
    });
  });
});


describe('🚦 Performance et Charge', () => {
  test('should handle concurrent requests', async () => {
    console.log('📋 Curl equivalent (run 5 times simultaneously):');
    console.log(`curl -H "Authorization: Bearer ${CLIENT1_API_KEY}" http://localhost:3001/client/info`);
    console.log('');
    
    const promises = [];
    const concurrentRequests = 5;

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request(app)
          .get('/client/info')
          .set('Authorization', `Bearer ${CLIENT1_API_KEY}`)
      );
    }

    const responses = await Promise.all(promises);
    
    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body.client.id).toBe('client1');
    });

    console.log(`✅ ${concurrentRequests} requêtes concurrentes réussies`);
  });

  test('should handle bundles requests performance', async () => {
    console.log('📋 Curl equivalent:');
    console.log(`curl -H "Authorization: Bearer ${CLIENT1_API_KEY}" http://localhost:3001/api/v0/Bundles`);
    console.log('');
    
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/api/v0/Bundles')
      .set('Authorization', `Bearer ${CLIENT1_API_KEY}`)
      .expect(200);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.body.bundles.length).toBeGreaterThan(0);
    expect(responseTime).toBeLessThan(5000); // Moins de 5 secondes

    console.log(`✅ Bundles récupérés en ${responseTime}ms`);
  });
});

// Global cleanup after all tests
afterAll(async () => {
  if (apiInstance && apiInstance.sequelize) {
    await apiInstance.sequelize.close();
  }
});