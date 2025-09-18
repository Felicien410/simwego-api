// Test rapide du rate limiting en production
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testRateLimit() {
  console.log('🚀 Testing rate limiting in production...');
  console.log('Current limits: 50 requests per 15 minutes');
  
  const requests = [];
  const numRequests = 60; // Dépasser la limite de 50
  
  console.log(`\n📡 Sending ${numRequests} requests simultaneously...`);
  
  // Créer toutes les requêtes
  for (let i = 0; i < numRequests; i++) {
    requests.push(
      axios.get(`${BASE_URL}/health`)
        .then(response => ({ 
          index: i, 
          status: response.status, 
          success: true 
        }))
        .catch(error => ({ 
          index: i, 
          status: error.response?.status, 
          success: false,
          error: error.response?.data?.error 
        }))
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    
    // Analyser les résultats
    const success = responses.filter(r => r.status === 200).length;
    const rateLimited = responses.filter(r => r.status === 429).length;
    const errors = responses.filter(r => r.status && r.status !== 200 && r.status !== 429).length;
    
    console.log('\n📊 Results:');
    console.log(`✅ Successful requests: ${success}`);
    console.log(`🚫 Rate limited (429): ${rateLimited}`);
    console.log(`❌ Other errors: ${errors}`);
    
    if (rateLimited > 0) {
      console.log('\n🎯 Rate limiting is WORKING in production! 🛡️');
      const sampleRateLimited = responses.find(r => r.status === 429);
      console.log('Sample rate limit response:', sampleRateLimited?.error);
    } else {
      console.log('\n⚠️  No requests were rate limited. Possible reasons:');
      console.log('   - Rate limit threshold not reached');
      console.log('   - Requests processed too quickly');
      console.log('   - Rate limiting might not be active');
    }
    
    return { success, rateLimited, errors, total: numRequests };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Exécuter le test
testRateLimit()
  .then(result => {
    if (result) {
      process.exit(result.rateLimited > 0 ? 0 : 1);
    }
    process.exit(1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });