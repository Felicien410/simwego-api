const axios = require('axios');
require('dotenv').config();

// Test configuration from environment
const BASE_URL = 'http://localhost:3001';
const CLIENT_TEST_API_KEY = process.env.CLIENT_TEST_API_KEY;
const CLIENT_REAL_API_KEY = process.env.CLIENT_REAL_API_KEY;
const TEST_ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN;

// Function to get client configuration from database
async function getClientConfig(apiKey) {
  try {
    const response = await axios.get(`${BASE_URL}/admin/clients`, {
      headers: {
        'Authorization': `Bearer ${TEST_ADMIN_TOKEN}`
      }
    });
    
    const client = response.data.clients.find(c => c.api_key === apiKey);
    if (!client) {
      throw new Error(`Client not found for API key: ${apiKey}`);
    }
    
    return {
      reseller_id: client.reseller_id,
      agent_id: client.agent_id
    };
  } catch (error) {
    console.error('Error fetching client config:', error.message);
    throw error;
  }
}

// Global test variables
let testClientConfig = null;
let realClientConfig = null;
let createdBranchId = null;
let createdAgentId = null;
let testBundleCode = null;
let testBranchId = null;

describe('SimWeGo API Tests', () => {
  
  // Setup - Get client configurations
  beforeAll(async () => {
    console.log('Setting up test configurations...');
    testClientConfig = await getClientConfig(CLIENT_TEST_API_KEY);
    realClientConfig = await getClientConfig(CLIENT_REAL_API_KEY);
    console.log('Test client config:', testClientConfig);
    console.log('Real client config:', realClientConfig);
  });

  // HEALTH CHECK TESTS
  describe('Health Check', () => {
    test('GET /api/v0/HealthCheck should return 200', async () => {
      const response = await axios.get(`${BASE_URL}/api/v0/HealthCheck`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`
        }
      });
      expect(response.status).toBe(200);
    });
  });

  // RESELLER TESTS
  describe('Reseller Tests', () => {
    test('GET /api/v0/Reseller should return 200 with success message', async () => {
      const response = await axios.get(`${BASE_URL}/api/v0/Reseller?currency_code=EUR`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`
        }
      });
      expect(response.status).toBe(200);
      expect(response.data.developer_message).toBe('Success');
    });

    test('POST /api/v0/Reseller should return 401 (unauthorized)', async () => {
      const payload = {
        "active_vendors_list": ["string"],
        "agent": {
          "email": "xyz@hotmail.com",
          "name": "john snow",
          "password": "$3343JcS2412345",
          "username": "john.snow"
        },
        "balance": 0,
        "balance_warning_limit": 1000,
        "callback_url": "www.xyz.com",
        "consumption_url": "www.xyz.com",
        "contact": {
          "address": "address",
          "emails": ["xyz@hotmail.com","xyz@hotmail.com"],
          "phones": ["phones","phones"],
          "website": "www.xyz.com"
        },
        "corp_rate_revenue": 12,
        "credit_limit": 0,
        "credit_warning_limit": 0,
        "currency_code": "USD",
        "default_currency_code": "SAR",
        "email_settings": {
          "password": "password",
          "smtp_port": "smtp_port",
          "smtp_server": "smtp_server",
          "username": "xyz@hotmail.com"
        },
        "is_active": true,
        "is_whitelabel": false,
        "notification_type": "webhook",
        "rate_revenue": 12,
        "request_custom_email": true,
        "reseller_category": "string",
        "reseller_name": "Nakhal",
        "reseller_type": "prepaid",
        "retry_on_failed_after": 1,
        "support_topup": true,
        "supports_multibranches": false,
        "supports_promo": true,
        "supports_vouchers": true,
        "tenant_name": "string",
        "voucher_rate": 12
      };

      try {
        await axios.post(`${BASE_URL}/api/v0/Reseller?currency_code=EUR`, payload, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('GET /api/v0/Reseller/{id} should return 200', async () => {
      const response = await axios.get(`${BASE_URL}/api/v0/Reseller/${realClientConfig.reseller_id}?currency_code=SAR`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`
        }
      });
      expect(response.status).toBe(200);
    });

    test('PUT /api/v0/Reseller/{id} should return 401 (unauthorized)', async () => {
      const payload = {
        "active_vendors_list": ["string"]
      };

      try {
        await axios.put(`${BASE_URL}/api/v0/Reseller/${realClientConfig.reseller_id}`, payload, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  // BRANCH AND AGENT TESTS
  describe('Branch and Agent Tests', () => {
    test('POST /api/v0/Branch should create branch and return 200', async () => {
      const timestamp = Date.now();
      const branchName = `Real ${Math.random().toString(36).replace(/[0-9]/g, '').substring(2,8).toUpperCase()}`;
      const payload = {
        "agent": {
          "email": `test${timestamp}@hotmail.com`,
          "name": "testsnow",
          "password": "$3343JcS2412345",
          "username": `test${timestamp}.snow`
        },
        "branch_name": branchName,
        "contact": {
          "address": "address",
          "emails": ["test@hotmail.com"],
          "phones": ["+33779592994"],
          "website": "www.xyz.com"
        },
        "is_active": true,
        "limit": -1
      };

      try {
        const response = await axios.post(`${BASE_URL}/api/v0/Branch?reseller_id=${realClientConfig.reseller_id}`, payload, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('agent_id');
        expect(response.data).toHaveProperty('branch_id');
        expect(response.data).toHaveProperty('message');
        expect(response.data.message).toBe('Branch Added Successfully.');

        // Store for subsequent tests
        createdBranchId = response.data.branch_id;
        createdAgentId = response.data.agent_id;
      } catch (error) {
        console.error('Branch creation failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('GET /api/v0/Agent should return 200 with agents list', async () => {
      if (!createdBranchId) {
        throw new Error('Branch must be created first');
      }

      const response = await axios.get(`${BASE_URL}/api/v0/Agent?reseller_id=${realClientConfig.reseller_id}&branch_id=${createdBranchId}`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('agents');
      expect(response.data).toHaveProperty('developer_message', 'Success');
      expect(response.data).toHaveProperty('response_code', '0200');
      expect(response.data).toHaveProperty('title', 'Success');
      expect(response.data).toHaveProperty('total_agents_count');
      expect(response.data.agents.length).toBeGreaterThan(0);
      
      const agent = response.data.agents[0];
      expect(agent).toHaveProperty('agent_id');
      expect(agent).toHaveProperty('branch_id', createdBranchId);
      expect(agent).toHaveProperty('name', 'testsnow');
      expect(agent).toHaveProperty('role_name', 'BranchAdmin');
    });

    test('POST /api/v0/Agent should return 401 (unauthorized)', async () => {
      if (!createdBranchId) {
        throw new Error('Branch must be created first');
      }

      const payload = {
        "email": "xyz@hotmail.com",
        "name": "john.snow",
        "password": "$3343JcS2412345",
        "role_name": "ResellerAdmin",
        "username": "john.snow"
      };

      try {
        await axios.post(`${BASE_URL}/api/v0/Agent?reseller_id=${realClientConfig.reseller_id}&branch_id=${createdBranchId}`, payload, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('GET /api/v0/Agent/{id} should return 200', async () => {
      if (!createdBranchId || !createdAgentId) {
        throw new Error('Branch and Agent must be created first');
      }

      const response = await axios.get(`${BASE_URL}/api/v0/Agent/${createdAgentId}?reseller_id=${realClientConfig.reseller_id}&branch_id=${createdBranchId}`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`
        }
      });

      expect(response.status).toBe(200);
    });

    test('Delete real client branch after agent tests', async () => {
      if (createdBranchId) {
        try {
          await axios.delete(`${BASE_URL}/api/v0/Branch/${createdBranchId}?reseller_id=${realClientConfig.reseller_id}`, {
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${CLIENT_REAL_API_KEY}`
            }
          });
          console.log(`Real client branch ${createdBranchId} deleted after agent tests`);
          createdBranchId = null;
          createdAgentId = null;
        } catch (error) {
          console.log(`Failed to delete real client branch ${createdBranchId}:`, error.response?.status || error.message);
        }
      }
    });
  });

  // BUNDLE TESTS
  describe('Bundle Tests', () => {
    test('Create test branch for bundle tests', async () => {
      const timestamp = Date.now();
      const branchName = `Bundle ${Math.random().toString(36).replace(/[0-9]/g, '').substring(2,8).toUpperCase()}`;
      const payload = {
        "agent": {
          "email": `testtest${timestamp}@hotmail.com`,
          "name": "testtest",
          "password": "$3343JcS2412345",
          "username": `testtest${timestamp}.snow`
        },
        "branch_name": branchName,
        "contact": {
          "address": "address",
          "emails": ["test@hotmail.com"],
          "phones": ["+33779592994"],
          "website": "www.xyz.com"
        },
        "is_active": true,
        "limit": -1
      };

      try {
        const response = await axios.post(`${BASE_URL}/api/v0/Branch?reseller_id=${testClientConfig.reseller_id}`, payload, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('branch_id');
        testBranchId = response.data.branch_id;
      } catch (error) {
        console.error('Test branch creation failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('GET /api/v0/AvailableCountries should return 200', async () => {
      const response = await axios.get(`${BASE_URL}/api/v0/AvailableCountries?reseller_id=${testClientConfig.reseller_id}`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
        }
      });

      expect(response.status).toBe(200);
    });

    test('GET /api/v0/AvailableCurrencies should return 200', async () => {
      const response = await axios.get(`${BASE_URL}/api/v0/AvailableCurrencies`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
        }
      });

      expect(response.status).toBe(200);
    });

    test('GET /api/v0/AvailableRegions should return 200', async () => {
      const response = await axios.get(`${BASE_URL}/api/v0/AvailableRegions?reseller_id=${testClientConfig.reseller_id}`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
        }
      });

      expect(response.status).toBe(200);
    });

    test('GET /api/v0/Bundles should return 200 with bundles', async () => {
      const response = await axios.get(`${BASE_URL}/api/v0/Bundles?reseller_id=${testClientConfig.reseller_id}&currency_code=EUR`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('bundles');
      
      if (response.data.bundles && response.data.bundles.length > 0) {
        const bundle = response.data.bundles[0];
        expect(bundle).toHaveProperty('bundle_code');
        expect(bundle).toHaveProperty('bundle_name');
        expect(bundle).toHaveProperty('bundle_price_final');
        expect(bundle).toHaveProperty('country_code');
        expect(bundle).toHaveProperty('currency_code_list');
        
        // Store bundle code for next test
        testBundleCode = bundle.bundle_code;
      }
    });

    test('GET /api/v0/Bundles/AvailableTopup should return 200', async () => {
      if (!testBundleCode) {
        console.log('Skipping topup test - no bundle code available');
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/v0/Bundles/AvailableTopup?bundle_code=${testBundleCode}&reseller_id=${testClientConfig.reseller_id}&currency_code=EUR`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
        }
      });

      expect(response.status).toBe(200);
    });

    test('Delete test client branch after bundle tests', async () => {
      if (testBranchId) {
        try {
          await axios.delete(`${BASE_URL}/api/v0/Branch/${testBranchId}?reseller_id=${testClientConfig.reseller_id}`, {
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
            }
          });
          console.log(`Test client branch ${testBranchId} deleted after bundle tests`);
          testBranchId = null;
        } catch (error) {
          console.log(`Failed to delete test client branch ${testBranchId}:`, error.response?.status || error.message);
        }
      }
    });
  });

});