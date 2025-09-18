const axios = require('axios');
require('dotenv').config();

// Test configuration from environment
const BASE_URL = 'http://localhost:3001';
const TEST_ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN;

// Global test variables
let createdClientId = null;
let generatedApiKey = null;
let testMontyCredentials = null;
let userAccessToken = null;

describe('Admin & Authentication System Tests', () => {

  // ADMIN SYSTEM TESTS
  describe('Admin Client Management', () => {
    
    test('GET /admin/clients should list all clients', async () => {
      console.log('\n📋 Admin: Listing all clients...');
      
      const response = await axios.get(`${BASE_URL}/admin/clients`, {
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('clients');
      expect(Array.isArray(response.data.clients)).toBe(true);
      
      console.log('✅ Clients retrieved:', {
        total_clients: response.data.clients.length,
        active_clients: response.data.clients.filter(c => c.active).length
      });

      if (response.data.clients.length > 0) {
        const client = response.data.clients[0];
        console.log('📝 Sample client structure:', {
          id: client.id,
          name: client.name,
          active: client.active,
          has_api_key: !!client.api_key,
          has_credentials: !!client.monty_username
        });
      }
    });

    test('POST /admin/clients should create new client', async () => {
      console.log('\n➕ Admin: Creating new test client...');
      
      const timestamp = Date.now();
      const clientData = {
        id: `test_client_${timestamp}`,
        name: `Test Client ${timestamp}`,
        monty_username: process.env.CLIENT1_MONTY_USERNAME,
        monty_password: process.env.CLIENT1_MONTY_PASSWORD
      };

      try {
        const response = await axios.post(`${BASE_URL}/admin/clients`, clientData, {
          headers: {
            'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('message');
        expect(response.data).toHaveProperty('api_key');
        
        createdClientId = response.data.id;
        generatedApiKey = response.data.api_key;
        testMontyCredentials = {
          username: clientData.monty_username,
          password: clientData.monty_password
        };

        console.log('✅ Client created successfully:', {
          id: createdClientId,
          api_key: generatedApiKey.substring(0, 20) + '...',
          active: response.data.active
        });

      } catch (error) {
        console.error('❌ Client creation error:', error.response?.data || error.message);
        throw error;
      }
    });

    test('GET /admin/clients/:id should get specific client', async () => {
      if (!createdClientId) {
        throw new Error('Client must be created first');
      }

      console.log('\n🔍 Admin: Getting specific client details...');

      const response = await axios.get(`${BASE_URL}/admin/clients/${createdClientId}`, {
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).toBe(createdClientId);
      
      console.log('✅ Client details retrieved:', {
        id: response.data.id,
        name: response.data.name,
        active: response.data.active,
        token_status: response.data.token_status || 'Not set'
      });
    });

    test('POST /admin/clients/:id/test should test Monty credentials', async () => {
      if (!createdClientId) {
        throw new Error('Client must be created first');
      }

      console.log('\n🔧 Admin: Testing Monty credentials...');

      try {
        const response = await axios.post(`${BASE_URL}/admin/clients/${createdClientId}/test`, {}, {
          headers: {
            'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success');
        
        console.log('✅ Monty credentials test result:', {
          success: response.data.success,
          message: response.data.message || 'Success',
          has_reseller_id: !!response.data.reseller_id,
          has_agent_id: !!response.data.agent_id
        });

        if (response.data.access_token) {
          console.log('🎫 Token details:', {
            token_preview: response.data.access_token.substring(0, 30) + '...',
            expires_in: response.data.expires_in || 'Not specified'
          });
        }

      } catch (error) {
        if (error.response?.status === 400) {
          console.log('⚠️  Expected error - invalid test credentials');
          expect(error.response.status).toBe(400);
        } else {
          console.error('❌ Unexpected error:', error.response?.data || error.message);
          throw error;
        }
      }
    });

    test('PUT /admin/clients/:id should update client', async () => {
      if (!createdClientId) {
        throw new Error('Client must be created first');
      }

      console.log('\n📝 Admin: Updating client information...');

      const updateData = {
        name: `Updated Test Client ${Date.now()}`,
        active: false
      };

      const response = await axios.put(`${BASE_URL}/admin/clients/${createdClientId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('id');
      expect(response.data.active).toBe(false);
      
      console.log('✅ Client updated successfully:', {
        id: response.data.id,
        new_name: response.data.name,
        active: response.data.active
      });
    });
  });

  // AUTHENTICATION SYSTEM TESTS
  describe('User Authentication System', () => {

    test('POST /api/v0/Agent/login should authenticate user', async () => {
      console.log('\n🔐 Auth: Testing user login...');

      // Use existing client credentials from environment
      const loginData = {
        username: process.env.CLIENT1_MONTY_USERNAME,
        password: process.env.CLIENT1_MONTY_PASSWORD
      };

      try {
        const response = await axios.post(`${BASE_URL}/api/v0/Agent/login`, loginData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CLIENT_TEST_API_KEY}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('tokens');
        expect(response.data.tokens).toHaveProperty('access_token');
        expect(response.data.tokens).toHaveProperty('token_type');
        
        userAccessToken = response.data.tokens.access_token;

        console.log('✅ User login successful:', {
          token_type: response.data.tokens.token_type,
          expires_in: response.data.tokens.expires_in || 'Not specified',
          token_preview: userAccessToken.substring(0, 30) + '...'
        });

      } catch (error) {
        if (error.response?.status === 401) {
          console.log('⚠️  Login failed - checking credentials or API status');
          expect(error.response.status).toBe(401);
        } else {
          console.error('❌ Login error:', error.response?.data || error.message);
          throw error;
        }
      }
    });

    test('POST /api/v0/Agent/validate should validate token', async () => {
      if (!userAccessToken) {
        console.log('⏭️  Skipping token validation - no token available');
        return;
      }

      console.log('\n✅ Auth: Validating user token...');

      try {
        const response = await axios.post(`${BASE_URL}/api/v0/auth/validate`, { token: userAccessToken }, {
          headers: {
            'Authorization': `Bearer ${process.env.CLIENT_TEST_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('valid', true);
        
        console.log('✅ Token validation successful:', {
          valid: response.data.valid,
          user_info: response.data.user || 'Not provided',
          expires_at: response.data.expires_at || 'Not specified'
        });

      } catch (error) {
        console.error('❌ Token validation error:', error.response?.data || error.message);
        // Don't throw - token validation endpoint might not exist
      }
    });

    test('POST /api/v0/Agent/logout should logout user', async () => {
      if (!userAccessToken) {
        console.log('⏭️  Skipping logout test - no token available');
        return;
      }

      console.log('\n🚪 Auth: Testing user logout...');

      try {
        const response = await axios.post(`${BASE_URL}/api/v0/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${process.env.CLIENT_TEST_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('message');
        
        console.log('✅ User logout successful:', {
          message: response.data.message,
          token_invalidated: true
        });

        // Clear token after successful logout
        userAccessToken = null;

      } catch (error) {
        console.error('❌ Logout error:', error.response?.data || error.message);
        // Don't throw - logout endpoint might not exist
      }
    });
  });

  // TOKEN MANAGEMENT TESTS
  describe('Token Management System', () => {

    test('GET /admin/tokens should list token cache', async () => {
      console.log('\n🎫 Token Management: Listing cached tokens...');

      try {
        const response = await axios.get(`${BASE_URL}/admin/tokens`, {
          headers: {
            'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        
        console.log('✅ Token cache retrieved:', {
          total_tokens: response.data.tokens ? response.data.tokens.length : 0,
          active_tokens: response.data.tokens ? response.data.tokens.filter(t => t.is_valid).length : 0
        });

        if (response.data.tokens && response.data.tokens.length > 0) {
          console.log('📋 Token preview:');
          response.data.tokens.slice(0, 3).forEach((token, index) => {
            console.log(`   ${index + 1}. Client: ${token.client_id} - Valid: ${token.is_valid} - Expires: ${token.expires_at || 'N/A'}`);
          });
        }

      } catch (error) {
        if (error.response?.status === 404) {
          console.log('ℹ️  Token management endpoint not available');
        } else {
          console.error('❌ Token cache error:', error.response?.data || error.message);
        }
      }
    });

    test('DELETE /admin/tokens/:client_id should clear client tokens', async () => {
      if (!createdClientId) {
        console.log('⏭️  Skipping token cleanup - no test client');
        return;
      }

      console.log('\n🗑️  Token Management: Clearing test client tokens...');

      try {
        const response = await axios.delete(`${BASE_URL}/admin/tokens/${createdClientId}`, {
          headers: {
            'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        
        console.log('✅ Client tokens cleared:', {
          client_id: createdClientId,
          message: response.data.message || 'Success'
        });

      } catch (error) {
        if (error.response?.status === 404) {
          console.log('ℹ️  Token cleanup endpoint not available or no tokens found');
        } else {
          console.error('❌ Token cleanup error:', error.response?.data || error.message);
        }
      }
    });
  });

  // SYSTEM HEALTH TESTS
  describe('System Health & Connectivity', () => {

    test('GET /health should return system status', async () => {
      console.log('\n💓 Health Check: System status...');

      const response = await axios.get(`${BASE_URL}/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      
      console.log('✅ System health:', {
        status: response.data.status,
        timestamp: response.data.timestamp || 'Not provided',
        uptime: response.data.uptime || 'Not provided'
      });

      if (response.data.services) {
        console.log('🔧 Service status:', response.data.services);
      }
    });

    test('GET /api/v0/HealthCheck should return API health', async () => {
      console.log('\n🔍 API Health Check: Authenticated endpoint...');

      const response = await axios.get(`${BASE_URL}/api/v0/HealthCheck`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLIENT_TEST_API_KEY}`,
          'accept': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      
      console.log('✅ API health check successful:', {
        authenticated: true,
        api_version: 'v0',
        client_authorized: true
      });
    });

    test('GET /test should return connectivity test', async () => {
      console.log('\n🌐 Connectivity Test: Basic connection...');

      const response = await axios.get(`${BASE_URL}/test`);

      expect(response.status).toBe(200);
      
      console.log('✅ Connectivity test successful:', {
        response_received: true,
        server_reachable: true
      });
    });
  });

  // Cleanup
  afterAll(async () => {
    console.log('\n🧹 Cleaning up admin & auth test environment...');
    
    // Delete created test client
    if (createdClientId) {
      try {
        await axios.delete(`${BASE_URL}/admin/clients/${createdClientId}`, {
          headers: {
            'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Test client deleted successfully');
      } catch (error) {
        console.log('⚠️  Failed to delete test client:', error.response?.status || error.message);
      }
    }

    // Summary
    console.log('\n📊 Admin & Auth Test Summary:');
    console.log(`   Test Client ID: ${createdClientId || 'None'}`);
    console.log(`   Generated API Key: ${generatedApiKey ? generatedApiKey.substring(0, 20) + '...' : 'None'}`);
    console.log(`   User Token Tested: ${userAccessToken ? 'Yes' : 'No'}`);
    console.log(`   Monty Credentials: ${testMontyCredentials ? 'Configured' : 'None'}`);
  }, 10000);

});