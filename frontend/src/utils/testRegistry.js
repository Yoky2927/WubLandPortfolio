// frontend/src/utils/testRegistry.js
import { APIRegistry } from './api.registry';

export async function testAPIRegistry() {
  console.log('🧪 Testing API Registry...');
  
  // Test 1: Initialize
  const initialized = await APIRegistry.initialize();
  console.log(`Initialization: ${initialized ? '✅ Success' : '❌ Failed'}`);
  
  // Test 2: Get endpoints
  const endpoints = await APIRegistry.getServiceEndpoints();
  console.log('Available services:', APIRegistry.getServices());
  
  // Test 3: Test user service
  const userServiceHealthy = await APIRegistry.testService('user-service');
  console.log(`User Service: ${userServiceHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  
  // Test 4: Make a test API call
  try {
    const testResponse = await APIRegistry.call('user-service', '/api/auth/check', {
      method: 'GET'
    });
    console.log('Test API call:', testResponse);
  } catch (error) {
    console.log('Test API call failed (expected if not logged in):', error.message);
  }
  
  return {
    initialized,
    services: APIRegistry.getServices(),
    userServiceHealthy
  };
}