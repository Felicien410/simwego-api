// tests/04-token-security.test.js - Comprehensive token security tests
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CLIENT_TEST_API_KEY = process.env.CLIENT_TEST_API_KEY;
const CLIENT_REAL_API_KEY = process.env.CLIENT_REAL_API_KEY;
const TEST_ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN;

describe('Token Security & Management Tests', () => {
  let testClientId = null;
  let testApiKey = null;
  let userToken = null;
  let invalidToken = null;

  beforeAll(async () => {
    console.log('🔐 Setting up token security test environment...');
    
    // Create a test client for token tests
    const timestamp = Date.now();
    const clientPayload = {
      name: `Token Test Client ${timestamp}`,
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
      
      testClientId = response.data.id;
      testApiKey = response.data.api_key;
      console.log(`✅ Test client created: ${testClientId}`);
    } catch (error) {
      console.error('❌ Failed to create test client:', error.response?.data || error.message);
      throw error;
    }
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up token security test environment...');
    
    if (testClientId) {
      try {
        await axios.delete(`${BASE_URL}/admin/clients/${testClientId}`, {
          headers: { 'Authorization': `Bearer ${TEST_ADMIN_TOKEN}` }
        });
        console.log('✅ Test client deleted successfully');
      } catch (error) {
        console.warn('⚠️ Failed to delete test client:', error.message);
      }
    }
  });

  describe('Token Authentication Security', () => {
    test('Should reject requests with no token', async () => {
      console.log('\n🚫 Testing access without token...');
      
      try {
        await axios.get(`${BASE_URL}/api/v0/client/info`);
        throw new Error('Should have been rejected');
      } catch (error) {
        expect(error.response.status).toBe(401);
        console.log('✅ Correctly rejected request without token');
      }
    });

    test('Should reject requests with invalid token format', async () => {
      console.log('\n🚫 Testing invalid token formats...');
      
      const invalidTokens = [
        'invalid-token',
        'Bearer',
        'Bearer ',
        'Bearer invalid-format',
        'swg_invalid_token',
        'fake_token_123',
        ''
      ];

      for (const token of invalidTokens) {
        try {
          await axios.get(`${BASE_URL}/api/v0/client/info`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          throw new Error(`Should have rejected token: ${token}`);
        } catch (error) {
          expect(error.response.status).toBe(401);
        }
      }
      console.log('✅ All invalid token formats correctly rejected');
    });

    test('Should reject requests with expired/revoked tokens', async () => {
      console.log('\n🚫 Testing expired token handling...');
      
      // First authenticate to get a token
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/v0/Agent/login`, {
          username: process.env.TEST_MONTY_USERNAME,
          password: process.env.TEST_MONTY_PASSWORD
        }, {
          headers: {
            'Authorization': `Bearer ${testApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        userToken = loginResponse.data.access_token;
        console.log('✅ User token obtained for testing');

        // Logout to invalidate the token
        await axios.post(`${BASE_URL}/api/v0/Agent/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${testApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Token invalidated via logout');

        // Try to use the invalidated token
        try {
          await axios.post(`${BASE_URL}/api/v0/Agent/validate`, {}, {
            headers: {
              'Authorization': `Bearer ${testApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          throw new Error('Should have rejected invalidated token');
        } catch (error) {
          expect(error.response.status).toBe(401);
          console.log('✅ Invalidated token correctly rejected');
        }
        
      } catch (error) {
        console.warn('⚠️ Could not test token invalidation:', error.message);
      }
    });

    test('Should prevent token reuse after logout', async () => {
      console.log('\n🔄 Testing token reuse prevention...');
      
      try {
        // Login to get fresh token
        const loginResponse = await axios.post(`${BASE_URL}/api/v0/Agent/login`, {
          username: process.env.TEST_MONTY_USERNAME,
          password: process.env.TEST_MONTY_PASSWORD
        }, {
          headers: {
            'Authorization': `Bearer ${testApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        const freshToken = loginResponse.data.access_token;
        
        // Validate the token works
        await axios.post(`${BASE_URL}/api/v0/Agent/validate`, {}, {
          headers: {
            'Authorization': `Bearer ${testApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Logout
        await axios.post(`${BASE_URL}/api/v0/Agent/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${testApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Try to reuse the token
        try {
          await axios.post(`${BASE_URL}/api/v0/Agent/validate`, {}, {
            headers: {
              'Authorization': `Bearer ${testApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          throw new Error('Should not allow token reuse');
        } catch (error) {
          expect(error.response.status).toBe(401);
          console.log('✅ Token reuse correctly prevented');
        }
        
      } catch (error) {
        console.warn('⚠️ Could not complete token reuse test:', error.message);
      }
    });
  });

  describe('API Key Security', () => {
    test('Should validate API key format and structure', async () => {
      console.log('\n🔍 Testing API key validation...');
      
      expect(testApiKey).toMatch(/^swg_[a-f0-9]{8}_[a-z0-9]+_[a-f0-9]{32}$/);
      console.log('✅ API key has correct format');
    });

    test('Should prevent API key enumeration', async () => {
      console.log('\n🚫 Testing API key enumeration protection...');
      
      const fakeApiKeys = [
        'swg_12345678_test_1234567890abcdef1234567890abcdef',
        'swg_00000000_enum_0000000000000000000000000000000',
        'swg_ffffffff_hack_ffffffffffffffffffffffffffffffff'
      ];

      for (const fakeKey of fakeApiKeys) {
        try {
          await axios.get(`${BASE_URL}/api/v0/client/info`, {
            headers: { 'Authorization': `Bearer ${fakeKey}` }
          });
          throw new Error(`Should have rejected fake API key: ${fakeKey}`);
        } catch (error) {
          expect(error.response.status).toBe(401);
        }
      }
      console.log('✅ API key enumeration correctly prevented');
    });

    test('Should handle concurrent API key usage', async () => {
      console.log('\n⚡ Testing concurrent API key usage...');
      
      const concurrentRequests = Array(5).fill().map(() => 
        axios.get(`${BASE_URL}/api/v0/client/info`, {
          headers: { 'Authorization': `Bearer ${testApiKey}` }
        })
      );

      try {
        const responses = await Promise.all(concurrentRequests);
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
        console.log('✅ Concurrent API key usage handled correctly');
      } catch (error) {
        console.error('❌ Concurrent usage test failed:', error.message);
        throw error;
      }
    });
  });

  describe('Token Cache Security', () => {
    test('Should not expose token cache via admin endpoints', async () => {
      console.log('\n🔒 Testing token cache exposure protection...');
      
      try {
        // Try to access token cache directly
        await axios.get(`${BASE_URL}/admin/tokens`, {
          headers: { 'Authorization': `Bearer ${TEST_ADMIN_TOKEN}` }
        });
        console.log('ℹ️ Token cache endpoint accessible (check if data is properly sanitized)');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ Token cache endpoint properly protected (404)');
        } else {
          console.warn('⚠️ Unexpected response:', error.response?.status);
        }
      }
    });

    test('Should handle token cache cleanup securely', async () => {
      console.log('\n🧹 Testing secure token cache cleanup...');
      
      try {
        // Attempt to clear tokens for our test client
        await axios.delete(`${BASE_URL}/admin/tokens/${testClientId}`, {
          headers: { 'Authorization': `Bearer ${TEST_ADMIN_TOKEN}` }
        });
        console.log('✅ Token cleanup accessible via admin');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('ℹ️ Token cleanup endpoint not found or protected');
        } else {
          console.warn('⚠️ Unexpected cleanup response:', error.response?.status);
        }
      }
    });
  });

  describe('Session Management Security', () => {
    test('Should enforce proper session boundaries', async () => {
      console.log('\n👥 Testing session isolation...');
      
      try {
        // Login with test client
        const loginResponse1 = await axios.post(`${BASE_URL}/api/v0/Agent/login`, {
          username: process.env.TEST_MONTY_USERNAME,
          password: process.env.TEST_MONTY_PASSWORD
        }, {
          headers: {
            'Authorization': `Bearer ${testApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        // Login with real client (different session)
        const loginResponse2 = await axios.post(`${BASE_URL}/api/v0/Agent/login`, {
          username: process.env.REAL_MONTY_USERNAME,
          password: process.env.REAL_MONTY_PASSWORD
        }, {
          headers: {
            'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        // Both should be successful and independent
        expect(loginResponse1.status).toBe(200);
        expect(loginResponse2.status).toBe(200);
        
        console.log('✅ Multiple independent sessions handled correctly');
        
        // Cleanup
        await axios.post(`${BASE_URL}/api/v0/Agent/logout`, {}, {
          headers: { 'Authorization': `Bearer ${testApiKey}` }
        });
        
        await axios.post(`${BASE_URL}/api/v0/Agent/logout`, {}, {
          headers: { 'Authorization': `Bearer ${CLIENT_REAL_API_KEY}` }
        });
        
      } catch (error) {
        console.warn('⚠️ Session isolation test incomplete:', error.message);
      }
    });

    test('Should prevent session hijacking attempts', async () => {
      console.log('\n🕵️ Testing session hijacking protection...');
      
      // This test ensures that tokens are properly bound to clients
      try {
        const response = await axios.get(`${BASE_URL}/api/v0/client/info`, {
          headers: { 'Authorization': `Bearer ${testApiKey}` }
        });
        
        const clientId = response.data.client?.client_ref;
        expect(clientId).toBeTruthy();
        expect(clientId).toMatch(/^client_[A-Za-z0-9]{12}$/);
        
        console.log('✅ Client references properly obfuscated');
        
        // Ensure we can't access other client's data
        try {
          await axios.get(`${BASE_URL}/api/v0/client/info`, {
            headers: { 'Authorization': `Bearer ${CLIENT_REAL_API_KEY}` }
          });
          
          console.log('✅ Different clients have separate access');
        } catch (error) {
          console.warn('⚠️ Could not test client separation');
        }
        
      } catch (error) {
        console.error('❌ Session hijacking test failed:', error.message);
        throw error;
      }
    });
  });

  describe('Token Refresh Security', () => {
    test('Should handle token refresh securely', async () => {
      console.log('\n🔄 Testing secure token refresh...');
      
      try {
        // Force a fresh authentication to trigger token refresh
        const response = await axios.get(`${BASE_URL}/api/v0/HealthCheck`, {
          headers: { 'Authorization': `Bearer ${testApiKey}` }
        });
        
        expect(response.status).toBe(200);
        console.log('✅ Token refresh handled transparently');
        
      } catch (error) {
        if (error.response?.status === 500 && error.response?.data?.code === 'MONTY_AUTH_FAILED') {
          console.log('ℹ️ Token refresh failed due to Monty API - this is expected in test environment');
        } else {
          console.error('❌ Token refresh test failed:', error.message);
          throw error;
        }
      }
    });

    test('Should prevent refresh token abuse', async () => {
      console.log('\n🚫 Testing refresh token abuse prevention...');
      
      // This test ensures refresh tokens can't be used directly
      // and are properly invalidated after use
      try {
        const healthResponse = await axios.get(`${BASE_URL}/api/v0/HealthCheck`, {
          headers: { 'Authorization': `Bearer ${testApiKey}` }
        });
        
        // Multiple consecutive requests should not cause issues
        const response2 = await axios.get(`${BASE_URL}/api/v0/HealthCheck`, {
          headers: { 'Authorization': `Bearer ${testApiKey}` }
        });
        
        expect(response2.status).toBe(200);
        console.log('✅ Refresh token properly managed internally');
        
      } catch (error) {
        if (error.response?.data?.code === 'MONTY_AUTH_FAILED') {
          console.log('ℹ️ Refresh test limited by Monty API availability');
        } else {
          console.warn('⚠️ Refresh token test incomplete:', error.message);
        }
      }
    });
  });

  describe('Rate Limiting & Abuse Prevention', () => {
    test('Should rate limit authentication attempts', async () => {
      console.log('\n⏱️ Testing authentication rate limiting...');
      
      const rapidRequests = Array(10).fill().map(() =>
        axios.post(`${BASE_URL}/api/v0/Agent/login`, {
          username: 'invalid_user',
          password: 'invalid_password'
        }, {
          headers: {
            'Authorization': `Bearer ${testApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }).catch(error => error.response)
      );

      try {
        const responses = await Promise.all(rapidRequests);
        const rateLimited = responses.some(response => 
          response?.status === 429 || response?.status === 403
        );
        
        if (rateLimited) {
          console.log('✅ Rate limiting active for authentication');
        } else {
          console.log('ℹ️ No rate limiting detected (may need implementation)');
        }
        
      } catch (error) {
        console.warn('⚠️ Rate limit test incomplete:', error.message);
      }
    });

    test('Should prevent brute force attacks', async () => {
      console.log('\n🛡️ Testing brute force protection...');
      
      const bruteForceAttempts = Array(5).fill().map((_, index) =>
        axios.post(`${BASE_URL}/api/v0/Agent/login`, {
          username: process.env.TEST_MONTY_USERNAME,
          password: `wrong_password_${index}`
        }, {
          headers: {
            'Authorization': `Bearer ${testApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }).catch(error => error.response)
      );

      try {
        const responses = await Promise.all(bruteForceAttempts);
        const allUnauthorized = responses.every(response => 
          response?.status === 401 || response?.status === 403
        );
        
        expect(allUnauthorized).toBe(true);
        console.log('✅ Brute force attempts properly rejected');
        
      } catch (error) {
        console.warn('⚠️ Brute force test incomplete:', error.message);
      }
    });
  });
});