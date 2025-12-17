// test-property-endpoints-quick.js
import fetch from 'node-fetch';

async function testEndpoint(url, method = 'GET', body = null) {
  console.log(`\n🔗 Testing: ${method} ${url}`);
  try {
    const options = { method };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📦 Response:`, data);
    
    return { success: true, status: response.status, data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Running Property Service Tests\n');
  
  // Test 1: Health check
  await testEndpoint('http://localhost:5002/health');
  
  // Test 2: Root endpoint
  await testEndpoint('http://localhost:5002/');
  
  // Test 3: Get all properties (should work now)
  await testEndpoint('http://localhost:5002/api/properties');
  
  // Test 4: Get property by ID
  await testEndpoint('http://localhost:5002/api/properties/1');
  
  // Test 5: Search properties
  await testEndpoint('http://localhost:5002/api/properties/search?q=villa');
  
  // Test 6: Featured properties
  await testEndpoint('http://localhost:5002/api/properties/featured?limit=3');
  
  // Test 7: Broker listings (should fail without auth)
  await testEndpoint('http://localhost:5002/api/properties/broker/listings?brokerId=3');
  
  console.log('\n📊 All tests completed!');
}

runTests().catch(console.error);