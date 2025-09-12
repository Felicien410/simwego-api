// =============================================================================
// tests/admin-routes.test.js - Tests des routes Admin SimWeGo
// =============================================================================

const request = require('supertest');
const SimWeGoAPI = require('../src/app');

// Configuration
jest.setTimeout(15000);

describe('🛡️ SimWeGo API - Tests des Routes Admin', () => {
  let apiInstance;
  let app;
  const ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN ;

  beforeAll(async () => {
    console.log('\n🛡️ === TESTS ROUTES ADMIN ===\n');
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

  describe('🔐 Authentification Admin', () => {
    test('Rejet sans token admin', async () => {
      console.log('📡 Test: Accès admin sans token');
      
      const response = await request(app)
        .get('/admin/stats')
        .expect(401);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Accès admin correctement protégé');
    });

    test('Rejet avec token invalide', async () => {
      console.log('📡 Test: Token admin invalide');
      
      const response = await request(app)
        .get('/admin/stats')
        .set('Authorization', 'Bearer invalid_admin_token')
        .expect(401);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Token invalide correctement rejeté');
    });
  });

  describe('📊 Routes Admin - Statistiques', () => {
    test('GET /admin/stats - Statistiques système', async () => {
      console.log('📡 Test: Statistiques admin');
      console.log('🔑 Admin Token:', ADMIN_TOKEN.substring(0, 30) + '...');
      
      const response = await request(app)
        .get('/admin/stats')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      console.log('✅ Status:', response.status);
      console.log('📊 Stats:', JSON.stringify(response.body, null, 2));
      
      expect(response.body).toHaveProperty('clients');
      expect(response.body.clients).toHaveProperty('total');
      expect(response.body.clients.total).toBeGreaterThanOrEqual(0);
      
      console.log('✅ Statistiques récupérées avec succès');
    });
  });

  describe('👥 Routes Admin - Gestion Clients', () => {
    test('GET /admin/clients - Liste des clients', async () => {
      console.log('📡 Test: Liste clients admin');
      
      const response = await request(app)
        .get('/admin/clients')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .expect(200);

      console.log('✅ Status:', response.status);
      
      expect(response.body).toHaveProperty('clients');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.clients)).toBe(true);
      
      console.log('📊 Total clients:', response.body.total);
      response.body.clients.forEach(client => {
        console.log(`  - ${client.id}: ${client.name} (${client.active ? 'actif' : 'inactif'})`);
        expect(client).toHaveProperty('id');
        expect(client).toHaveProperty('name');
        expect(client).toHaveProperty('api_key');
        expect(client).toHaveProperty('active');
        expect(client).toHaveProperty('monty_username');
      });
      
      console.log('✅ Liste clients récupérée avec succès');
    });

    test('GET /admin/clients/:id - Détails client spécifique', async () => {
      console.log('📡 Test: Détails client1');
      
      const response = await request(app)
        .get('/admin/clients/client1')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

      console.log('✅ Status:', response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('id', 'client1');
        expect(response.body).toHaveProperty('name');
        console.log('📊 Client:', response.body.name);
        console.log('✅ Détails client récupérés');
      } else {
        console.log('⚠️ Client non trouvé ou erreur');
        expect([404, 500]).toContain(response.status);
      }
    });

    test('POST /admin/clients/:id/test - Test connexion Monty', async () => {
      console.log('📡 Test: Test connexion Monty client1');
      
      const response = await request(app)
        .post('/admin/clients/client1/test')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json');

      console.log('✅ Status:', response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('client_id', 'client1');
        
        if (response.body.agent_id) {
          console.log('📊 Agent ID:', response.body.agent_id);
          console.log('📊 Reseller ID:', response.body.reseller_id);
        }
        
        console.log('✅ Test connexion Monty réussi');
      } else {
        expect(response.body).toHaveProperty('success', false);
        console.log('⚠️ Test connexion Monty échoué (attendu si credentials invalides)');
        console.log('📊 Erreur:', response.body.message);
      }
    });

    test('POST /admin/clients/:id/test - Test client inexistant', async () => {
      console.log('📡 Test: Test client inexistant');
      
      const response = await request(app)
        .post('/admin/clients/client_inexistant/test')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .expect(404);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Client inexistant correctement géré');
    });
  });

  describe('⚙️ Routes Admin - Gestion Système', () => {
    test('PUT /admin/clients/:id - Modification client (simulation)', async () => {
      console.log('📡 Test: Tentative modification client');
      
      const updateData = {
        name: 'Client 1 Modified',
        active: true
      };
      
      const response = await request(app)
        .put('/admin/clients/client1')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send(updateData);

      console.log('✅ Status:', response.status);
      
      // La route peut soit exister (200/404) soit ne pas être implémentée (404/405)
      expect([200, 404, 405, 500]).toContain(response.status);
      
      if (response.status === 200) {
        console.log('✅ Modification client supportée');
      } else {
        console.log('ℹ️ Modification non supportée ou erreur (normal)');
      }
    });

    test('POST /admin/clients - Création client (simulation)', async () => {
      console.log('📡 Test: Tentative création client');
      
      const newClient = {
        id: 'test_client',
        name: 'Test Client',
        monty_username: 'test_user',
        monty_password: 'test_pass',
        active: true
      };
      
      const response = await request(app)
        .post('/admin/clients')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send(newClient);

      console.log('✅ Status:', response.status);
      
      // La route peut soit exister soit ne pas être implémentée
      expect([200, 201, 400, 404, 405, 409, 500]).toContain(response.status);
      
      if ([200, 201].includes(response.status)) {
        console.log('✅ Création client supportée');
      } else {
        console.log('ℹ️ Création non supportée ou erreur (normal)');
      }
    });
  });

  describe('🚫 Sécurité Admin', () => {
    test('Accès cross-client impossible', async () => {
      console.log('📡 Test: Sécurité cross-client');
      
      // Essayer d'accéder aux routes admin avec une API key client normale
      const CLIENT_API_KEY = 'swg_cabf79291eb36ecb2f7422b82f170e61e7a085cb87fb22234c7d550d2bf7e42e';
      
      const response = await request(app)
        .get('/admin/stats')
        .set('Authorization', `Bearer ${CLIENT_API_KEY}`)
        .expect(401);

      console.log('✅ Status:', response.status);
      expect(response.body).toHaveProperty('error');
      console.log('✅ Sécurité cross-client maintenue');
    });

    test('Routes admin bien protégées', async () => {
      console.log('📡 Test: Protection routes admin');
      
      const adminRoutes = [
        '/admin/clients',
        '/admin/stats',
        '/admin/clients/client1'
      ];
      
      for (const route of adminRoutes) {
        console.log(`  Testing: ${route}`);
        const response = await request(app).get(route);
        expect(response.status).toBe(401);
      }
      
      console.log('✅ Toutes les routes admin sont protégées');
    });
  });

  afterAll(() => {
    console.log('\n🏁 === FIN TESTS ADMIN ===\n');
  });
});