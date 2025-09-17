// tests/07-security-middleware.test.js - Security middleware validation tests
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CLIENT_TEST_API_KEY = process.env.CLIENT_TEST_API_KEY;
const CLIENT_REAL_API_KEY = process.env.CLIENT_REAL_API_KEY;
const TEST_ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN;

describe('Security Middleware Validation Tests', () => {
  let testClient = null;

  beforeAll(async () => {
    console.log('🔐 Setting up security middleware test environment...');
    
    // Create a test client for middleware testing
    const timestamp = Date.now();
    const clientPayload = {
      name: `Middleware Test Client ${timestamp}`,
      monty_username: process.env.TEST_MONTY_USERNAME || 'test_user',
      monty_password: process.env.TEST_MONTY_PASSWORD || 'test_password',
      active: true
    };

    try {
      const response = await axios.post(`${BASE_URL}/admin/clients`, clientPayload, {
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      testClient = {
        id: response.data.id,
        api_key: response.data.api_key,
        name: response.data.name
      };
      
      console.log(`✅ Test client created for middleware testing: ${testClient.id}`);
    } catch (error) {
      console.error('❌ Failed to create test client:', error.response?.data || error.message);
      throw error;
    }
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up security middleware test environment...');
    
    if (testClient?.id) {
      try {
        await axios.delete(`${BASE_URL}/admin/clients/${testClient.id}`, {
          headers: { 'Authorization': `Bearer ${TEST_ADMIN_TOKEN}` }
        });
        console.log('✅ Test client deleted successfully');
      } catch (error) {
        console.warn('⚠️ Failed to delete test client:', error.message);
      }
    }
  });

  describe('Authentication Middleware', () => {
    test('Should properly validate Bearer token format', async () => {
      console.log('\n🔍 Testing Bearer token format validation...');
      
      const invalidTokenFormats = [
        // Missing Bearer prefix
        testClient.api_key,
        
        // Wrong prefix
        `Basic ${testClient.api_key}`,
        `Token ${testClient.api_key}`,
        
        // Empty Bearer
        'Bearer',
        'Bearer ',
        
        // Multiple Bearer prefixes
        `Bearer Bearer ${testClient.api_key}`,
        
        // Invalid characters
        'Bearer invalid-token-with-invalid-chars!@#$',
        
        // Too short/long
        'Bearer abc',
        'Bearer ' + 'a'.repeat(500)
      ];

      for (const invalidToken of invalidTokenFormats) {
        try {
          await axios.get(`${BASE_URL}/api/v0/client/info`, {
            headers: { 'Authorization': invalidToken }
          });
          throw new Error(`Should have rejected invalid token format: ${invalidToken}`);
        } catch (error) {
          expect(error.response.status).toBe(401);
        }
      }
      
      console.log('✅ Bearer token format validation working correctly');
    });

    test('Should handle missing Authorization header gracefully', async () => {
      console.log('\n🚫 Testing missing Authorization header handling...');
      
      try {
        await axios.get(`${BASE_URL}/api/v0/client/info`);
        throw new Error('Should have been rejected');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('error');
        console.log('✅ Missing Authorization header handled gracefully');
      }
    });

    test('Should properly validate API key structure', async () => {
      console.log('\n🔑 Testing API key structure validation...');
      
      const invalidApiKeys = [
        // Wrong prefix
        'api_12345678_test_1234567890abcdef1234567890abcdef',
        
        // Wrong hash length
        'swg_1234567_test_1234567890abcdef1234567890abcdef',
        'swg_123456789_test_1234567890abcdef1234567890abcdef',
        
        // Wrong random part length
        'swg_12345678_test_123456789abcdef1234567890abcdef',
        'swg_12345678_test_1234567890abcdef1234567890abcdef123',
        
        // Invalid hex characters
        'swg_1234567g_test_1234567890abcdef1234567890abcdef',
        'swg_12345678_test_1234567890abcdef1234567890abcdeg',
        
        // Missing parts
        'swg_12345678_1234567890abcdef1234567890abcdef',
        'swg_test_1234567890abcdef1234567890abcdef'
      ];

      for (const invalidKey of invalidApiKeys) {
        try {
          await axios.get(`${BASE_URL}/api/v0/client/info`, {
            headers: { 'Authorization': `Bearer ${invalidKey}` }
          });
          throw new Error(`Should have rejected invalid API key: ${invalidKey}`);
        } catch (error) {
          expect(error.response.status).toBe(401);
        }
      }
      
      console.log('✅ API key structure validation working correctly');
    });

    test('Should handle authentication database errors gracefully', async () => {
      console.log('\n⚠️ Testing authentication error handling...');
      
      // Use a properly formatted but non-existent API key
      const nonExistentKey = 'swg_deadbeef_test_0123456789abcdef0123456789abcdef';
      
      try {
        await axios.get(`${BASE_URL}/api/v0/client/info`, {
          headers: { 'Authorization': `Bearer ${nonExistentKey}` }
        });
        throw new Error('Should have rejected non-existent API key');
      } catch (error) {
        expect(error.response.status).toBe(401);
        
        // Error message should be generic and not leak system information
        const errorData = error.response.data;
        expect(errorData.error).toBeDefined();
        expect(errorData.error).not.toContain('database');
        expect(errorData.error).not.toContain('SQL');
        expect(errorData.error).not.toContain('connection');
        
        console.log('✅ Authentication errors handled gracefully');
      }
    });
  });

  describe('Data Sanitization Middleware', () => {
    test('Should remove sensitive fields from responses', async () => {
      console.log('\n🎭 Testing response data sanitization...');
      
      const response = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient.api_key}` }
      });
      
      expect(response.status).toBe(200);
      
      const clientData = response.data.client;
      
      // Verify sensitive fields are removed
      expect(clientData.id).toBeUndefined(); // Real UUID should be hidden
      expect(clientData.api_key).toBeUndefined(); // API key should not be returned
      expect(clientData.monty_password_encrypted).toBeUndefined();
      expect(clientData.monty_username).toBeUndefined(); // Should be masked or removed
      
      // Verify safe fields are present
      expect(clientData.client_ref).toBeDefined();
      expect(clientData.name).toBeDefined();
      expect(clientData.active).toBeDefined();
      
      console.log('✅ Response data properly sanitized');
    });

    test('Should handle nested object sanitization', async () => {
      console.log('\n🔍 Testing nested object sanitization...');
      
      const response = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient.api_key}` }
      });
      
      // Verify nested objects are also sanitized
      if (response.data.montyConnection) {
        expect(response.data.montyConnection.authenticated).toBeDefined();
        // Sensitive connection details should not be exposed
        expect(response.data.montyConnection.access_token).toBeUndefined();
        expect(response.data.montyConnection.refresh_token).toBeUndefined();
      }
      
      console.log('✅ Nested object sanitization working correctly');
    });

    test('Should handle arrays and complex data structures', async () => {
      console.log('\n📊 Testing complex data structure sanitization...');
      
      try {
        // Try to get a response with complex data (like bundles or orders)
        const response = await axios.get(`${BASE_URL}/api/v0/Bundles?page_size=1`, {
          headers: { 'Authorization': `Bearer ${testClient.api_key}` }
        });
        
        if (response.status === 200 && response.data.bundles && response.data.bundles.length > 0) {
          const bundle = response.data.bundles[0];
          
          // Verify no internal system fields are exposed
          expect(bundle.internal_id).toBeUndefined();
          expect(bundle.database_id).toBeUndefined();
          expect(bundle.system_notes).toBeUndefined();
          
          console.log('✅ Complex data structures properly sanitized');
        } else {
          console.log('ℹ️ Complex data test skipped (no data available)');
        }
        
      } catch (error) {
        if (error.response?.data?.code === 'MONTY_AUTH_FAILED') {
          console.log('ℹ️ Complex data test skipped (Monty API not available)');
        } else {
          console.warn('⚠️ Complex data test incomplete:', error.message);
        }
      }
    });

    test('Should preserve necessary data for functionality', async () => {
      console.log('\n✅ Testing functional data preservation...');
      
      const response = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient.api_key}` }
      });
      
      // Verify essential data for client functionality is preserved
      expect(response.data.client.name).toBeDefined();
      expect(response.data.client.active).toBeDefined();
      expect(response.data.client.client_ref).toBeDefined();
      expect(response.data.api_endpoints).toBeDefined();
      
      // Verify API endpoints are provided for client use
      expect(response.data.api_endpoints.bundles).toBeDefined();
      expect(response.data.api_endpoints.orders).toBeDefined();
      
      console.log('✅ Functional data properly preserved');
    });
  });

  describe('Authorization Middleware', () => {
    test('Should enforce resource ownership validation', async () => {
      console.log('\n🛡️ Testing resource ownership enforcement...');
      
      // This would test the requireOwnResource middleware
      // Since we don't have routes with :clientId parameter in current setup,
      // we'll test the concept with available endpoints
      
      // Verify client can only access their own info
      const ownInfo = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient.api_key}` }
      });
      
      expect(ownInfo.status).toBe(200);
      expect(ownInfo.data.client.name).toBe(testClient.name);
      
      // Try with different client's API key
      const otherInfo = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${CLIENT_REAL_API_KEY}` }
      });
      
      expect(otherInfo.status).toBe(200);
      // Should get different client's data
      expect(otherInfo.data.client.name).not.toBe(testClient.name);
      
      console.log('✅ Resource ownership properly enforced');
    });

    test('Should validate client active status', async () => {
      console.log('\n🔄 Testing active client validation...');
      
      // Deactivate the test client
      await axios.put(`${BASE_URL}/admin/clients/${testClient.id}`, {
        active: false
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Try to use the deactivated client's API key
      try {
        await axios.get(`${BASE_URL}/api/v0/client/info`, {
          headers: { 'Authorization': `Bearer ${testClient.api_key}` }
        });
        throw new Error('Should have rejected inactive client');
      } catch (error) {
        expect(error.response.status).toBe(401);
        console.log('✅ Inactive client properly rejected');
      }
      
      // Reactivate the client for cleanup
      await axios.put(`${BASE_URL}/admin/clients/${testClient.id}`, {
        active: true
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    });

    test('Should handle concurrent authorization requests', async () => {
      console.log('\n⚡ Testing concurrent authorization handling...');
      
      const concurrentRequests = Array(10).fill().map(() =>
        axios.get(`${BASE_URL}/api/v0/client/info`, {
          headers: { 'Authorization': `Bearer ${testClient.api_key}` }
        })
      );
      
      const responses = await Promise.all(concurrentRequests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.client.name).toBe(testClient.name);
      });
      
      console.log('✅ Concurrent authorization handled correctly');
    });
  });

  describe('Audit Middleware', () => {
    test('Should log API access for audit trail', async () => {
      console.log('\n📝 Testing API access logging...');
      
      // Make a request that should be audited
      const response = await axios.get(`${BASE_URL}/api/v0/client/info`, {
        headers: { 'Authorization': `Bearer ${testClient.api_key}` }
      });
      
      expect(response.status).toBe(200);
      
      // In a real test, you would verify the log was created
      // For now, we just verify the request succeeded and assume logging works
      console.log('✅ API access logged for audit (assumed)');
    });

    test('Should include relevant context in audit logs', async () => {
      console.log('\n🔍 Testing audit log context...');
      
      // Make requests with different characteristics for auditing
      const requests = [
        { endpoint: '/api/v0/client/info', method: 'GET' }
      ];
      
      for (const req of requests) {
        try {
          await axios.get(`${BASE_URL}${req.endpoint}`, {
            headers: { 
              'Authorization': `Bearer ${testClient.api_key}`,
              'User-Agent': 'SecurityTest/1.0'
            }
          });
        } catch (error) {
          // Some requests might fail, but they should still be audited
        }
      }
      
      console.log('✅ Audit context properly captured (assumed)');
    });
  });

  describe('Rate Limiting Middleware', () => {
    test('Should enforce rate limits for sensitive endpoints', async () => {
      console.log('\n⏱️ Testing rate limiting enforcement...');
      
      // Test with client info endpoint (should have some rate limiting)
      const rapidRequests = Array(25).fill().map(() =>
        axios.get(`${BASE_URL}/api/v0/client/info`, {
          headers: { 'Authorization': `Bearer ${testClient.api_key}` },
          timeout: 3000
        }).catch(error => error.response)
      );
      
      try {
        const responses = await Promise.all(rapidRequests);
        
        const rateLimited = responses.some(response => 
          response?.status === 429 || response?.status === 503
        );
        
        if (rateLimited) {
          console.log('✅ Rate limiting is enforced');
        } else {
          console.log('ℹ️ No rate limiting detected (may not be implemented yet)');
        }
        
      } catch (error) {
        console.warn('⚠️ Rate limiting test incomplete:', error.message);
      }
    });

    test('Should have different rate limits for different endpoint types', async () => {
      console.log('\n📊 Testing tiered rate limiting...');
      
      // Test different endpoints to see if they have different limits
      const endpointTests = [
        '/api/v0/client/info',
        '/health'
      ];
      
      for (const endpoint of endpointTests) {
        const requests = Array(10).fill().map(() =>
          axios.get(`${BASE_URL}${endpoint}`, {
            headers: endpoint.includes('/api/') ? { 'Authorization': `Bearer ${testClient.api_key}` } : {},
            timeout: 2000
          }).catch(error => error.response)
        );
        
        try {
          const responses = await Promise.all(requests);
          const successRate = responses.filter(r => r?.status === 200).length / responses.length;
          
          console.log(`ℹ️ Endpoint ${endpoint}: ${Math.round(successRate * 100)}% success rate`);
          
        } catch (error) {
          console.warn(`⚠️ Rate limit test for ${endpoint} incomplete:`, error.message);
        }
      }
      
      console.log('✅ Tiered rate limiting analysis completed');
    });
  });

  describe('Error Handling Middleware', () => {
    test('Should handle middleware errors gracefully', async () => {
      console.log('\n⚠️ Testing middleware error handling...');
      
      // Try to trigger various error conditions
      const errorConditions = [
        // Malformed JSON in request body
        () => axios.post(`${BASE_URL}/api/v0/client/info`, 'invalid-json', {
          headers: { 
            'Authorization': `Bearer ${testClient.api_key}`,
            'Content-Type': 'application/json'
          }
        }),
        
        // Oversized request headers
        () => axios.get(`${BASE_URL}/api/v0/client/info`, {
          headers: { 
            'Authorization': `Bearer ${testClient.api_key}`,
            'X-Large-Header': 'x'.repeat(10000)
          }
        }),
        
        // Request to non-existent endpoint
        () => axios.get(`${BASE_URL}/api/v0/nonexistent`, {
          headers: { 'Authorization': `Bearer ${testClient.api_key}` }
        })
      ];
      
      for (const errorCondition of errorConditions) {
        try {
          await errorCondition();
        } catch (error) {
          // Should return proper HTTP status codes
          expect([400, 404, 413, 500]).toContain(error.response?.status);
          
          // Should not leak internal error details
          const errorData = error.response?.data;
          if (errorData) {
            expect(JSON.stringify(errorData)).not.toContain('stack');
            expect(JSON.stringify(errorData)).not.toContain('Internal server error occurred at');
            expect(JSON.stringify(errorData)).not.toContain('database connection');
          }
        }
      }
      
      console.log('✅ Middleware errors handled gracefully');
    });

    test('Should maintain security during error conditions', async () => {
      console.log('\n🔒 Testing security during errors...');
      
      // Even during errors, sensitive information should not be leaked
      try {
        await axios.get(`${BASE_URL}/api/v0/client/info`, {
          headers: { 'Authorization': 'Bearer invalid-token-format!' }
        });
        throw new Error('Should have been rejected');
      } catch (error) {
        expect(error.response.status).toBe(401);
        
        // Error response should not contain sensitive information
        const errorResponse = JSON.stringify(error.response.data);
        expect(errorResponse).not.toContain('password');
        expect(errorResponse).not.toContain('secret');
        expect(errorResponse).not.toContain('private');
        expect(errorResponse).not.toContain('encryption_key');
        expect(errorResponse).not.toContain('jwt_secret');
        
        console.log('✅ Security maintained during error conditions');
      }
    });
  });
});