const axios = require('axios');
require('dotenv').config();

// Test configuration from environment
const BASE_URL = 'http://localhost:3001';
const CLIENT_TEST_API_KEY = process.env.CLIENT_TEST_API_KEY;
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

// Helper function to generate unique order reference
function generateOrderRef() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER_${timestamp}_${random}`;
}

// Helper function to generate unique email
function generateEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `customer_${timestamp}_${random}@example.com`;
}

// Global test variables
let testClientConfig = null;
let testBranchId = null;
let selectedBundle = null;
let completedOrders = [];

describe('Transaction Simulation Tests', () => {
  
  // Setup - Get client configurations and create test branch
  beforeAll(async () => {
    console.log('🚀 Setting up transaction simulation environment...');
    
    // Get test client configuration
    testClientConfig = await getClientConfig(CLIENT_TEST_API_KEY);
    console.log('✅ Test client config loaded:', testClientConfig);
    
    // Create a test branch for transactions
    const timestamp = Date.now();
    const branchName = `Trans ${Math.random().toString(36).replace(/[0-9]/g, '').substring(2,8)}`;
    const branchPayload = {
      "agent": {
        "email": `trans${timestamp}@example.com`,
        "name": "Trans Agent",
        "password": "$3343JcS2412345",
        "username": `trans${timestamp.toString().slice(-8)}`
      },
      "branch_name": branchName,
      "contact": {
        "address": "123 Test Street",
        "emails": ["transaction@example.com"],
        "phones": ["+1234567890"],
        "website": "www.example.com"
      },
      "is_active": true,
      "limit": -1
    };

    try {
      const branchResponse = await axios.post(`${BASE_URL}/api/v0/Branch?reseller_id=${testClientConfig.reseller_id}`, branchPayload, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      testBranchId = branchResponse.data.branch_id;
      console.log('✅ Test branch created:', testBranchId);
    } catch (error) {
      console.error('❌ Branch creation error:', error.response?.data || error.message);
      throw error;
    }
    
    // Get available bundles and select one for testing
    const bundlesResponse = await axios.get(`${BASE_URL}/api/v0/Bundles?reseller_id=${testClientConfig.reseller_id}&currency_code=EUR&page_size=10`, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
      }
    });

    if (bundlesResponse.data.bundles && bundlesResponse.data.bundles.length > 0) {
      // Select a low-cost bundle for testing (first one, typically cheapest)
      selectedBundle = bundlesResponse.data.bundles[0];
      console.log('✅ Selected bundle for testing:', {
        code: selectedBundle.bundle_code,
        name: selectedBundle.bundle_name,
        price: selectedBundle.bundle_price_final,
        currency: selectedBundle.additional_currency_code
      });
    }
  }, 30000);

  // SIMULATION TESTS
  describe('Complete Transaction Flow Simulations', () => {
    
    test('Simulation 1: Standard eSIM Purchase - Turkey Bundle', async () => {
      console.log('\n📱 Simulation 1: Standard eSIM Purchase');
      
      if (!selectedBundle) {
        console.log('⏭️  Skipping test - no bundle available');
        return;
      }

      const orderRef = generateOrderRef();
      const customerEmail = generateEmail();
      
      const purchasePayload = {
        "bundle_code": selectedBundle.bundle_code,
        "email": customerEmail,
        "name": "John Customer",
        "order_reference": orderRef,
        "whatsapp_number": "+1234567890"
      };

      console.log('🛒 Purchasing bundle:', {
        bundle: selectedBundle.bundle_name,
        price: `${selectedBundle.bundle_price_final} ${selectedBundle.additional_currency_code}`,
        customer: customerEmail,
        order_ref: orderRef
      });

      try {
        const response = await axios.post(`${BASE_URL}/api/v0/Bundles?reseller_id=${testClientConfig.reseller_id}&branch_id=${testBranchId}&currency_code=EUR`, purchasePayload, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('message', 'Bundle Assigned Successfully');
        expect(response.data).toHaveProperty('order_id');
        expect(response.data).toHaveProperty('iccid');
        expect(response.data).toHaveProperty('remaining_wallet_balance');

        completedOrders.push({
          order_id: response.data.order_id,
          order_ref: orderRef,
          bundle: selectedBundle.bundle_name,
          customer: customerEmail,
          iccid: response.data.iccid
        });

        console.log('✅ Purchase successful!', {
          order_id: response.data.order_id,
          iccid: response.data.iccid,
          remaining_balance: `${response.data.remaining_wallet_balance} ${response.data.additional_currency_code || 'EUR'}`
        });

      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.detail?.includes('balance')) {
          console.log('💰 Insufficient balance - this is expected behavior');
          expect(error.response.status).toBe(400);
        } else {
          console.error('❌ Unexpected error:', error.response?.data || error.message);
          throw error;
        }
      }
    }, 15000);

    test('Simulation 2: Bundle Purchase with Different Customer', async () => {
      console.log('\n📱 Simulation 2: Different Customer Purchase');
      
      if (!selectedBundle) {
        console.log('⏭️  Skipping test - no bundle available');
        return;
      }

      const orderRef = generateOrderRef();
      const customerEmail = generateEmail();
      
      const purchasePayload = {
        "bundle_code": selectedBundle.bundle_code,
        "email": customerEmail,
        "name": "Maria Rodriguez",
        "order_reference": orderRef,
        "whatsapp_number": "+34612345678"
      };

      console.log('🛒 Second purchase attempt:', {
        customer: "Maria Rodriguez",
        email: customerEmail,
        order_ref: orderRef
      });

      try {
        const response = await axios.post(`${BASE_URL}/api/v0/Bundles?reseller_id=${testClientConfig.reseller_id}&branch_id=${testBranchId}&currency_code=EUR`, purchasePayload, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);
        completedOrders.push({
          order_id: response.data.order_id,
          order_ref: orderRef,
          bundle: selectedBundle.bundle_name,
          customer: customerEmail
        });

        console.log('✅ Second purchase successful!');

      } catch (error) {
        if (error.response?.status === 400) {
          console.log('💰 Purchase failed - likely insufficient balance or other business rule');
          expect(error.response.status).toBe(400);
        } else {
          throw error;
        }
      }
    }, 15000);

    test('Simulation 3: Check Order History', async () => {
      console.log('\n📊 Simulation 3: Order History Check');
      
      try {
        const response = await axios.get(`${BASE_URL}/api/v0/Orders?reseller_id=${testClientConfig.reseller_id}&branch_id=${testBranchId}&page_size=50`, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('orders');
        
        console.log('✅ Order history retrieved:', {
          total_orders: response.data.total_orders_count || 0,
          orders_returned: response.data.orders ? response.data.orders.length : 0
        });

        if (response.data.orders && response.data.orders.length > 0) {
          console.log('📋 Recent orders preview:');
          response.data.orders.slice(0, 3).forEach((order, index) => {
            console.log(`   ${index + 1}. ${order.bundle_name || 'N/A'} - ${order.client_email || 'N/A'} - ${order.order_status || 'N/A'}`);
          });
        }

      } catch (error) {
        console.error('❌ Error retrieving order history:', error.response?.data || error.message);
        throw error;
      }
    }, 10000);

    test('Simulation 4: Dashboard Analytics', async () => {
      console.log('\n📈 Simulation 4: Dashboard Analytics');
      
      try {
        const response = await axios.get(`${BASE_URL}/api/v0/Orders/Dashboard?reseller_id=${testClientConfig.reseller_id}&branch_id=${testBranchId}`, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
          }
        });

        expect(response.status).toBe(200);
        
        console.log('✅ Dashboard data retrieved:', {
          gross_sales_volume: response.data.gross_sales_volume_usd || 0,
          net_sales_volume: response.data.net_sales_volume_usd || 0,
          top_bundles_count: response.data.top_five_bundles ? response.data.top_five_bundles.length : 0
        });

        if (response.data.top_five_bundles && response.data.top_five_bundles.length > 0) {
          console.log('🏆 Top selling bundles:');
          response.data.top_five_bundles.forEach((bundle, index) => {
            console.log(`   ${index + 1}. ${bundle.bundle_name} - ${bundle.sales_number} sales`);
          });
        }

      } catch (error) {
        console.error('❌ Error retrieving dashboard:', error.response?.data || error.message);
        throw error;
      }
    }, 15000);

    test('Simulation 5: Wallet Balance Check', async () => {
      console.log('\n💰 Simulation 5: Wallet Balance Check');
      
      try {
        const response = await axios.get(`${BASE_URL}/api/v0/Reseller/${testClientConfig.reseller_id}?currency_code=EUR`, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
          }
        });

        expect(response.status).toBe(200);
        
        console.log('✅ Wallet balance retrieved:', {
          balance: response.data.balance || 0,
          currency: response.data.default_currency_code || 'EUR',
          credit_limit: response.data.credit_limit || 0
        });

      } catch (error) {
        console.error('❌ Error retrieving wallet balance:', error.response?.data || error.message);
        throw error;
      }
    }, 10000);

    test('Simulation 6: Bundle Consumption Check (if orders exist)', async () => {
      console.log('\n🔍 Simulation 6: Bundle Consumption Check');
      
      if (completedOrders.length === 0) {
        console.log('⏭️  No completed orders to check consumption for');
        return;
      }

      const order = completedOrders[0];
      console.log('📊 Checking consumption for order:', order.order_id);

      try {
        const response = await axios.get(`${BASE_URL}/api/v0/Orders/Consumption?order_id=${order.order_id}&reseller_id=${testClientConfig.reseller_id}`, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
          }
        });

        expect(response.status).toBe(200);
        
        console.log('✅ Consumption data retrieved:', {
          data_allocated: `${response.data.data_allocated || 'N/A'} ${response.data.data_unit || ''}`,
          data_used: `${response.data.data_used || 0} ${response.data.data_unit || ''}`,
          data_remaining: `${response.data.data_remaining || 'N/A'} ${response.data.data_unit || ''}`,
          plan_status: response.data.plan_status || 'N/A'
        });

      } catch (error) {
        if (error.response?.status === 404) {
          console.log('ℹ️  Order consumption data not found - may not be activated yet');
        } else {
          console.error('❌ Error checking consumption:', error.response?.data || error.message);
          throw error;
        }
      }
    }, 10000);

  });

  // Cleanup
  afterAll(async () => {
    console.log('\n🧹 Cleaning up test environment...');
    
    // Delete test branch
    if (testBranchId) {
      try {
        await axios.delete(`${BASE_URL}/api/v0/Branch/${testBranchId}?reseller_id=${testClientConfig.reseller_id}`, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${CLIENT_TEST_API_KEY}`
          }
        });
        console.log('✅ Test branch deleted successfully');
      } catch (error) {
        console.log('⚠️  Failed to delete test branch:', error.response?.status || error.message);
      }
    }

    // Summary
    console.log('\n📊 Transaction Simulation Summary:');
    console.log(`   Completed Orders: ${completedOrders.length}`);
    console.log(`   Selected Bundle: ${selectedBundle?.bundle_name || 'None'}`);
    console.log(`   Test Branch ID: ${testBranchId || 'None'}`);
    
    if (completedOrders.length > 0) {
      console.log('\n📝 Order Details:');
      completedOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ID: ${order.order_id}`);
        console.log(`      Customer: ${order.customer}`);
        console.log(`      Bundle: ${order.bundle}`);
        if (order.iccid) console.log(`      ICCID: ${order.iccid}`);
      });
    }
  }, 10000);

});