// test-with-sample-data.js - Tests with your sample data structure
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5002';

// Use your sample data structure
const sampleProperties = [
  {
    id: 1,
    title: "Luxury Villa",
    price: 26000000,
    address: "Summit St. George, Bole",
    city: "Addis Ababa",
    beds: 3,
    baths: 3,
    propertyType: "Single Family Residence",
    propertyStatus: "for sale",
    description: "Stunning modern villa..."
  },
  {
    id: 2,
    title: "Modern Apartment",
    price: 20000,
    address: "Yeho Street, Arada",
    city: "Gondar",
    beds: 2,
    baths: 1,
    propertyType: "Apartment",
    propertyStatus: "for rent",
    description: "Beautiful modern apartment..."
  }
];

async function testWithSampleData() {
  console.log('🏠 Testing Property Service with Sample Data\n');
  console.log('='.repeat(60));

  // Test 1: Check if API is running
  console.log('\n1️⃣ Testing API Status:');
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log(`✅ Health: ${JSON.stringify(healthData)}`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }

  // Test 2: Get all properties
  console.log('\n2️⃣ Getting all properties:');
  try {
    const res = await fetch(`${BASE_URL}/api/properties`);
    const data = await res.json();
    console.log(`✅ Status: ${res.status}`);
    console.log(`📊 Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }

  // Test 3: Try to create properties from sample data
  console.log('\n3️⃣ Testing property creation (if implemented):');
  
  for (const property of sampleProperties.slice(0, 2)) {
    console.log(`\n   Creating: ${property.title}`);
    try {
      const res = await fetch(`${BASE_URL}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: property.title,
          description: property.description,
          property_type: property.propertyType.toLowerCase().includes('villa') ? 'house' : 'apartment',
          property_status: 'draft',
          address: property.address,
          city: property.city,
          beds: property.beds,
          baths: property.baths,
          price: property.price,
          listing_type: property.propertyStatus.includes('rent') ? 'rent' : 'sale',
          owner_user_id: 1, // Assuming user ID 1 exists
          created_by_user_id: 1
        })
      });
      
      const data = await res.json().catch(() => ({}));
      console.log(`   Status: ${res.status}`);
      if (data.message) {
        console.log(`   Message: ${data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test 4: Search test
  console.log('\n4️⃣ Testing search functionality:');
  const searches = ['villa', 'apartment', 'addis', 'gondar'];
  
  for (const term of searches) {
    console.log(`\n   Searching for: "${term}"`);
    try {
      const res = await fetch(`${BASE_URL}/api/properties/search?q=${encodeURIComponent(term)}`);
      const data = await res.json().catch(() => ({}));
      console.log(`   Status: ${res.status}`);
      if (data.data && Array.isArray(data.data)) {
        console.log(`   Found: ${data.data.length} properties`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testing complete!');
}

// Install required package: npm install node-fetch
testWithSampleData().catch(console.error);