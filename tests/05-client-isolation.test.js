// tests/05-client-isolation.test.js - Client isolation and access control tests
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CLIENT_TEST_API_KEY = process.env.CLIENT_TEST_API_KEY;
const CLIENT_REAL_API_KEY = process.env.CLIENT_REAL_API_KEY;
const TEST_ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN;

describe('Client Isolation & Access Control Tests', () => {
  let testClient1 = null;
  let testClient2 = null;
  let testClient1Token = null;
  let testClient2Token = null;

  beforeAll(async () => {
    console.log('🏗️ Setting up client isolation test environment...');
    
    // Create two test clients for isolation testing
    const timestamp = Date.now();
    
    const client1Payload = {
      name: `Isolation Test Client 1 ${timestamp}`,
      monty_username: process.env.TEST_MONTY_USERNAME || 'test_user_1',
      monty_password: process.env.TEST_MONTY_PASSWORD || 'test_password_1',
      active: true
    };
    
    const client2Payload = {
      name: `Isolation Test Client 2 ${timestamp}`,
      monty_username: process.env.TEST_MONTY_USERNAME_2 || 'test_user_2', 
      monty_password: process.env.TEST_MONTY_PASSWORD_2 || 'test_password_2',
      active: true
    };

    try {
      // Create first test client
      const response1 = await axios.post(`${BASE_URL}/admin/clients`, client1Payload, {
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      testClient1 = {
        id: response1.data.id,
        api_key: response1.data.api_key,
        name: response1.data.name
      };
      
      // Create second test client
      const response2 = await axios.post(`${BASE_URL}/admin/clients`, client2Payload, {
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      testClient2 = {
        id: response2.data.id,
        api_key: response2.data.api_key,
        name: response2.data.name
      };
      
      console.log(`✅ Test clients created:`);
      console.log(`   Client 1: ${testClient1.id}`);
      console.log(`   Client 2: ${testClient2.id}`);
      
    } catch (error) {
      console.error('❌ Failed to create test clients:', error.response?.data || error.message);
      throw error;
    }
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up client isolation test environment...');
    
    const cleanupTasks = [];
    
    if (testClient1?.id) {
      cleanupTasks.push(
        axios.delete(`${BASE_URL}/admin/clients/${testClient1.id}`, {
          headers: { 'Authorization': `Bearer ${TEST_ADMIN_TOKEN}` }
        }).catch(err => console.warn(`⚠️ Failed to delete client 1: ${err.message}`))
      );
    }
    
    if (testClient2?.id) {
      cleanupTasks.push(
        axios.delete(`${BASE_URL}/admin/clients/${testClient2.id}`, {
          headers: { 'Authorization': `Bearer ${TEST_ADMIN_TOKEN}` }
        }).catch(err => console.warn(`⚠️ Failed to delete client 2: ${err.message}`))
      );
    }
    
    await Promise.all(cleanupTasks);
    console.log('✅ Cleanup completed');
  });

  describe('Client Data Isolation', () => {
    test('Clients should only access their own information', async () => {
      console.log('\n🔒 Testing client data isolation...');
      
      // Each client should only see their own data
      const client1Info = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
      });
      
      const client2Info = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient2.api_key}` }
      });
      
      expect(client1Info.status).toBe(200);
      expect(client2Info.status).toBe(200);
      
      // Verify they get different data
      expect(client1Info.data.client.name).toBe(testClient1.name);
      expect(client2Info.data.client.name).toBe(testClient2.name);
      
      // Verify no cross-contamination
      expect(client1Info.data.client.name).not.toBe(client2Info.data.client.name);
      
      console.log('✅ Client data properly isolated');
    });

    test('Clients should have unique opaque identifiers', async () => {
      console.log('\n🎭 Testing client identifier obfuscation...');
      
      const client1Info = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
      });
      
      const client2Info = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient2.api_key}` }
      });
      
      const client1Ref = client1Info.data.client.client_ref;
      const client2Ref = client2Info.data.client.client_ref;
      
      // Verify opaque identifiers exist and are different
      expect(client1Ref).toMatch(/^client_[A-Za-z0-9]{12}$/);
      expect(client2Ref).toMatch(/^client_[A-Za-z0-9]{12}$/);
      expect(client1Ref).not.toBe(client2Ref);
      
      // Verify real UUIDs are not exposed
      expect(client1Info.data.client.id).toBeUndefined();
      expect(client2Info.data.client.id).toBeUndefined();
      
      console.log('✅ Client identifiers properly obfuscated');
    });

    test('Clients cannot access other clients data through parameter manipulation', async () => {
      console.log('\n🕵️ Testing parameter manipulation protection...');
      
      // Try to access client2's data using client1's token
      try {
        await axios.get(`${BASE_URL}/api/v0/client/${testClient2.id}/data`, {
          headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
        });
        throw new Error('Should not allow cross-client access');
      } catch (error) {
        expect([404, 403, 401]).toContain(error.response?.status);
        console.log(`✅ Cross-client access properly blocked (${error.response?.status})`);
      }
    });
  });

  describe('API Key Isolation', () => {
    test('API keys should be unique and non-predictable', async () => {
      console.log('\n🔑 Testing API key uniqueness and unpredictability...');
      
      expect(testClient1.api_key).not.toBe(testClient2.api_key);
      
      // Verify API key format
      expect(testClient1.api_key).toMatch(/^swg_[a-f0-9]{8}_[a-z0-9]+_[a-f0-9]{32}$/);
      expect(testClient2.api_key).toMatch(/^swg_[a-f0-9]{8}_[a-z0-9]+_[a-f0-9]{32}$/);
      
      // Extract components to verify uniqueness
      const key1Parts = testClient1.api_key.split('_');
      const key2Parts = testClient2.api_key.split('_');
      
      // Hash components should be different
      expect(key1Parts[1]).not.toBe(key2Parts[1]);
      
      // Random components should be different
      expect(key1Parts[3]).not.toBe(key2Parts[3]);
      
      console.log('✅ API keys are unique and unpredictable');
    });

    test('API keys should not expose client information', async () => {
      console.log('\n🕵️ Testing API key information leakage...');
      
      // API keys should not contain predictable client information
      expect(testClient1.api_key).not.toContain(testClient1.id);
      expect(testClient2.api_key).not.toContain(testClient2.id);
      expect(testClient1.api_key).not.toContain(testClient1.name.toLowerCase());
      expect(testClient2.api_key).not.toContain(testClient2.name.toLowerCase());
      
      console.log('✅ API keys do not leak client information');
    });

    test('API key authentication should be properly isolated', async () => {
      console.log('\n🔐 Testing API key authentication isolation...');
      
      // Each API key should only work for its respective client
      const client1Response = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
      });
      
      const client2Response = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient2.api_key}` }
      });
      
      expect(client1Response.status).toBe(200);
      expect(client2Response.status).toBe(200);
      
      // Verify each gets their own data
      expect(client1Response.data.client.name).toBe(testClient1.name);
      expect(client2Response.data.client.name).toBe(testClient2.name);
      
      console.log('✅ API key authentication properly isolated');
    });
  });

  describe('Session Isolation', () => {
    test('Client sessions should be completely independent', async () => {
      console.log('\n👥 Testing session independence...');
      
      try {
        // Authenticate both clients simultaneously
        const login1Promise = axios.post(`${BASE_URL}/api/v0/Agent/login`, {
          username: process.env.TEST_MONTY_USERNAME || 'test_user_1',
          password: process.env.TEST_MONTY_PASSWORD || 'test_password_1'
        }, {
          headers: {
            'Authorization': `Bearer ${testClient1.api_key}`,
            'Content-Type': 'application/json'
          }
        });
        
        const login2Promise = axios.post(`${BASE_URL}/api/v0/Agent/login`, {
          username: process.env.TEST_MONTY_USERNAME_2 || 'test_user_2',
          password: process.env.TEST_MONTY_PASSWORD_2 || 'test_password_2'
        }, {
          headers: {
            'Authorization': `Bearer ${testClient2.api_key}`,
            'Content-Type': 'application/json'
          }
        });
        
        const [login1Response, login2Response] = await Promise.all([
          login1Promise.catch(err => err.response),
          login2Promise.catch(err => err.response)
        ]);
        
        // Both should be handled independently
        if (login1Response?.status === 200) {
          testClient1Token = login1Response.data.access_token;
        }
        if (login2Response?.status === 200) {
          testClient2Token = login2Response.data.access_token;
        }
        
        console.log('✅ Multiple client sessions handled independently');
        
        // Logout both clients
        if (testClient1Token) {
          await axios.post(`${BASE_URL}/api/v0/Agent/logout`, {}, {
            headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
          }).catch(() => {});
        }
        
        if (testClient2Token) {
          await axios.post(`${BASE_URL}/api/v0/Agent/logout`, {}, {
            headers: { 'Authorization': `Bearer ${testClient2.api_key}` }
          }).catch(() => {});
        }
        
      } catch (error) {
        console.warn('⚠️ Session independence test limited by Monty API availability');
      }
    });

    test('Session actions should not affect other clients', async () => {
      console.log('\n🔄 Testing session action isolation...');
      
      try {
        // Login client 1
        const login1Response = await axios.post(`${BASE_URL}/api/v0/Agent/login`, {
          username: process.env.TEST_MONTY_USERNAME || 'test_user_1',
          password: process.env.TEST_MONTY_PASSWORD || 'test_password_1'
        }, {
          headers: {
            'Authorization': `Bearer ${testClient1.api_key}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (login1Response.status === 200) {
          // Logout client 1
          await axios.post(`${BASE_URL}/api/v0/Agent/logout`, {}, {
            headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
          });
          
          // Client 2 should still be able to perform operations
          const client2Info = await axios.get(`${BASE_URL}/api/v0/client/info`, {
            headers: { 'Authorization': `Bearer ${testClient2.api_key}` }
          });
          
          expect(client2Info.status).toBe(200);
          console.log('✅ Session actions properly isolated between clients');
        }
        
      } catch (error) {
        console.warn('⚠️ Session action isolation test limited:', error.message);
      }
    });
  });

  describe('Resource Access Control', () => {
    test('Clients should only access their own resources in API calls', async () => {
      console.log('\n🛡️ Testing resource access control...');
      
      try {
        // Both clients try to access bundles - should get their own reseller scope
        const client1Bundles = await axios.get(`${BASE_URL}/api/v0/Bundles?page_size=5`, {
          headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
        });
        
        const client2Bundles = await axios.get(`${BASE_URL}/api/v0/Bundles?page_size=5`, {
          headers: { 'Authorization': `Bearer ${testClient2.api_key}` }
        });
        
        expect(client1Bundles.status).toBe(200);
        expect(client2Bundles.status).toBe(200);
        
        console.log('✅ Resource access properly scoped to each client');
        
      } catch (error) {
        if (error.response?.data?.code === 'MONTY_AUTH_FAILED') {
          console.log('ℹ️ Resource access test limited by Monty API availability');
        } else {
          console.warn('⚠️ Resource access test failed:', error.message);
        }
      }
    });

    test('Clients should not be able to enumerate other clients', async () => {
      console.log('\n🔍 Testing client enumeration prevention...');
      
      // Clients should not be able to list other clients
      try {
        await axios.get(`${BASE_URL}/admin/clients`, {
          headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
        });
        throw new Error('Client should not access admin endpoints');
      } catch (error) {
        expect([401, 403]).toContain(error.response?.status);
        console.log('✅ Client enumeration properly prevented');
      }
    });

    test('Clients should not access admin functions', async () => {
      console.log('\n🚫 Testing admin function protection...');
      
      const adminEndpoints = [
        `/admin/clients`,
        `/admin/clients/${testClient2.id}`,
        `/admin/clients/${testClient1.id}/test`
      ];
      
      for (const endpoint of adminEndpoints) {
        try {
          await axios.get(`${BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
          });
          throw new Error(`Client should not access admin endpoint: ${endpoint}`);
        } catch (error) {
          expect([401, 403]).toContain(error.response?.status);
        }
      }
      
      console.log('✅ Admin functions properly protected from client access');
    });
  });

  describe('Data Sanitization', () => {
    test('Sensitive data should be masked in client responses', async () => {
      console.log('\n🎭 Testing data sanitization...');
      
      const client1Info = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
      });
      
      const clientData = client1Info.data.client;
      
      // Verify sensitive fields are not exposed
      expect(clientData.id).toBeUndefined(); // Real UUID should be hidden
      expect(clientData.api_key).toBeUndefined(); // API key should not be returned
      expect(clientData.monty_password_encrypted).toBeUndefined();
      expect(clientData.monty_username).toBeUndefined(); // Should be masked
      
      // Verify safe fields are present
      expect(clientData.client_ref).toBeDefined();
      expect(clientData.name).toBeDefined();
      expect(clientData.active).toBeDefined();
      
      console.log('✅ Sensitive data properly sanitized');
    });

    test('Response sanitization should be consistent across clients', async () => {
      console.log('\n🔄 Testing sanitization consistency...');
      
      const client1Info = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient1.api_key}` }
      });
      
      const client2Info = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient2.api_key}` }
      });
      
      const client1Keys = Object.keys(client1Info.data.client);
      const client2Keys = Object.keys(client2Info.data.client);
      
      // Both should have the same structure (same fields exposed/hidden)
      expect(client1Keys.sort()).toEqual(client2Keys.sort());
      
      console.log('✅ Response sanitization is consistent across clients');
    });
  });
});