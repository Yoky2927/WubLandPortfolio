// test-property-service-endpoints.js
import mysql from 'mysql2/promise';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5002'; // Property service
const ANALYTICS_URL = 'http://localhost:5004'; // Analytics service

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wubland_portfolio_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

class PropertyServiceTester {
  constructor() {
    this.results = [];
    this.propertyIds = [];
    this.userIds = [];
    this.brokerIds = [];
    this.authToken = null;
  }

  async initialize() {
    console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║               PROPERTY SERVICE API TESTER (Port: 5002)                   ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════════════════╝${colors.reset}`);
    
    console.log(`\n${colors.yellow}🔌 Connecting to database...${colors.reset}`);
    
    try {
      const connection = await pool.getConnection();
      console.log(`${colors.green}✅ Database connected successfully${colors.reset}`);
      connection.release();

      // Get sample data from database
      await this.getSampleData();
      
      // Get authentication token
      await this.getAuthToken();
      
    } catch (error) {
      console.log(`${colors.red}❌ Database connection failed: ${error.message}${colors.reset}`);
      console.log(`${colors.yellow}⚠️  Will run API tests without database connection${colors.reset}`);
    }
  }

  async getAuthToken() {
    try {
      // Get a broker user for authentication
      const [brokers] = await pool.execute(`
        SELECT u.id, u.username, u.email 
        FROM users u 
        WHERE u.role IN ('internal_broker', 'external_broker', 'admin', 'super_admin') 
        AND u.status = 'active' 
        LIMIT 1
      `);
      
      if (brokers.length > 0) {
        const broker = brokers[0];
        
        // Try to get token from database or create one
        const [tokens] = await pool.execute(
          'SELECT token FROM auth_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
          [broker.id]
        );
        
        if (tokens.length > 0) {
          this.authToken = tokens[0].token;
          console.log(`${colors.green}✅ Found auth token for broker: ${broker.username}${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠️  No auth token found for broker ${broker.username}${colors.reset}`);
          console.log(`${colors.yellow}⚠️  Tests requiring authentication may fail${colors.reset}`);
        }
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠️  Could not get auth token: ${error.message}${colors.reset}`);
    }
  }

  async getSampleData() {
    try {
      // Get some property IDs
      const [properties] = await pool.execute(
        'SELECT id, property_uuid, title, property_status, assigned_broker_id FROM properties WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10'
      );
      
      this.propertyIds = properties.map(p => p.id);
      this.propertyUuids = properties.map(p => p.property_uuid);
      this.propertyData = properties;
      
      console.log(`${colors.green}✅ Found ${properties.length} properties in database${colors.reset}`);
      if (properties.length > 0) {
        console.log(`${colors.blue}   Sample properties:${colors.reset}`);
        properties.forEach((p, i) => {
          console.log(`   ${i + 1}. ID:${p.id} | "${p.title.substring(0, 30)}..." | Status:${p.property_status} | Broker:${p.assigned_broker_id || 'none'}`);
        });
      }

      // Get some user IDs
      const [users] = await pool.execute(
        'SELECT id, username, role FROM users WHERE status = "active" ORDER BY created_at DESC LIMIT 5'
      );
      
      this.userIds = users.map(u => u.id);
      this.userData = users;
      
      console.log(`${colors.green}✅ Found ${users.length} users in database${colors.reset}`);
      if (users.length > 0) {
        console.log(`${colors.blue}   Sample users:${colors.reset}`);
        users.forEach((u, i) => {
          console.log(`   ${i + 1}. ${u.username} (ID: ${u.id}, Role: ${u.role})`);
        });
      }

      // Get brokers
      const [brokers] = await pool.execute(`
        SELECT u.id, u.username, u.role, bp.broker_type 
        FROM users u 
        LEFT JOIN broker_profiles bp ON u.id = bp.user_id 
        WHERE u.role IN ('internal_broker', 'external_broker', 'admin', 'super_admin')
        AND u.status = 'active' 
        ORDER BY u.created_at DESC 
        LIMIT 5
      `);
      
      this.brokerIds = brokers.map(b => b.id);
      this.brokerData = brokers;
      
      console.log(`${colors.green}✅ Found ${brokers.length} brokers in database${colors.reset}`);
      if (brokers.length > 0) {
        console.log(`${colors.blue}   Sample brokers:${colors.reset}`);
        brokers.forEach((b, i) => {
          console.log(`   ${i + 1}. ${b.username} (ID: ${b.id}, Role: ${b.role}, Type: ${b.broker_type || 'N/A'})`);
        });
      }

    } catch (error) {
      console.log(`${colors.red}❌ Could not fetch sample data: ${error.message}${colors.reset}`);
      console.log(error.stack);
    }
  }

  async testEndpoint(name, method, path, expectedStatus = 200, body = null, service = 'property') {
    const baseUrl = service === 'analytics' ? ANALYTICS_URL : BASE_URL;
    const fullUrl = baseUrl + path;
    
    console.log(`\n${colors.cyan}=== ${name} ===${colors.reset}`);
    console.log(`${colors.yellow}${method} ${fullUrl}${colors.reset}`);
    
    if (body) {
      console.log(`${colors.magenta}Body: ${JSON.stringify(body, null, 2)}${colors.reset}`);
    }

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      // Add auth token if available
      if (this.authToken && path.includes('/api/')) {
        options.headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      if (body) {
        options.body = JSON.stringify(body);
      }

      const startTime = Date.now();
      const response = await fetch(fullUrl, options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { 
          message: 'No JSON response',
          rawText: await response.text().catch(() => 'Cannot read response text')
        };
      }

      const success = response.status === expectedStatus;
      const statusColor = success ? colors.green : colors.red;
      
      console.log(`${statusColor}Status: ${response.status} (Expected: ${expectedStatus})${colors.reset}`);
      console.log(`${colors.blue}Response Time: ${responseTime}ms${colors.reset}`);
      
      console.log(`${colors.magenta}Response: ${JSON.stringify(data, null, 2)}${colors.reset}`);

      this.results.push({
        name,
        method,
        url: fullUrl,
        expectedStatus,
        actualStatus: response.status,
        success,
        responseTime,
        data
      });

      return { success, data, responseTime };

    } catch (error) {
      console.log(`${colors.red}❌ Network Error: ${error.message}${colors.reset}`);
      console.log(`${colors.red}Stack: ${error.stack}${colors.reset}`);
      
      this.results.push({
        name,
        method,
        url: fullUrl,
        expectedStatus,
        error: error.message,
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  async runHealthChecks() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}HEALTH & BASIC TESTS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);

    // Test property service health
    await this.testEndpoint('Property Service Health', 'GET', '/health', 200);
    await this.testEndpoint('Property Service Root', 'GET', '/', 200);
    
    // Test analytics service health
    await this.testEndpoint('Analytics Service Health', 'GET', '/health', 200, null, 'analytics');
    await this.testEndpoint('Analytics Service Root', 'GET', '/', 200, null, 'analytics');
  }

  async runPublicPropertyTests() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}PUBLIC PROPERTY ENDPOINTS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);

    // Test getting all properties (public endpoint)
    console.log(`\n${colors.yellow}📋 Testing /api/properties (Public)${colors.reset}`);
    await this.testEndpoint('Get all properties', 'GET', '/api/properties', 200);
    
    // Test with pagination
    await this.testEndpoint('Get properties with pagination', 'GET', '/api/properties?page=1&limit=5', 200);
    
    // Test filters
    const filterTests = [
      { params: '?city=Addis%20Ababa', desc: 'Filter by city' },
      { params: '?property_type=house', desc: 'Filter by property type' },
      { params: '?listing_type=sale', desc: 'Filter for sale' },
      { params: '?listing_type=rent', desc: 'Filter for rent' },
      { params: '?min_price=1000000&max_price=5000000', desc: 'Filter by price range' },
      { params: '?beds=2', desc: 'Filter by beds' },
      { params: '?property_status=active', desc: 'Filter by active status' },
    ];

    for (const test of filterTests) {
      await this.testEndpoint(
        `Public properties ${test.desc}`,
        'GET',
        `/api/properties${test.params}`,
        200
      );
    }

    // Test property details
    if (this.propertyIds.length > 0) {
      const sampleProperty = this.propertyData.find(p => p.property_status === 'active');
      if (sampleProperty) {
        await this.testEndpoint(
          `Get active property details`,
          'GET',
          `/api/properties/${sampleProperty.id}`,
          200
        );
      }
    }

    // Test special endpoints
    await this.testEndpoint('Get featured properties', 'GET', '/api/properties/featured?limit=3', 200);
    await this.testEndpoint('Get recent properties', 'GET', '/api/properties/recent?limit=5', 200);
    await this.testEndpoint('Get premium properties', 'GET', '/api/properties/premium?limit=3', 200);
    await this.testEndpoint('Search properties', 'GET', '/api/properties/search?q=villa', 200);
  }

  async runBrokerPropertyTests() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}BROKER-SPECIFIC ENDPOINTS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);

    if (!this.authToken) {
      console.log(`${colors.yellow}⚠️  Skipping broker tests - no auth token available${colors.reset}`);
      return;
    }

    if (this.brokerIds.length === 0) {
      console.log(`${colors.yellow}⚠️  Skipping broker tests - no brokers found in database${colors.reset}`);
      return;
    }

    const brokerId = this.brokerIds[0];
    console.log(`${colors.blue}Testing with broker ID: ${brokerId}${colors.reset}`);

    // Test broker listings endpoint
    await this.testEndpoint(
      'Get broker listings',
      'GET',
      `/api/properties/broker/listings?brokerId=${brokerId}&page=1&limit=10`,
      200
    );

    // Test with status filter
    await this.testEndpoint(
      'Get broker listings with status filter',
      'GET',
      `/api/properties/broker/listings?brokerId=${brokerId}&status=active`,
      200
    );

    // Test property action if we have a property assigned to this broker
    const brokerProperty = this.propertyData.find(p => p.assigned_broker_id === brokerId);
    if (brokerProperty) {
      const actionBody = {
        action: 'approve',
        brokerId: brokerId,
        notes: 'Test approval from API tester'
      };

      await this.testEndpoint(
        `Property action on ID ${brokerProperty.id}`,
        'POST',
        `/api/properties/${brokerProperty.id}/action`,
        200,
        actionBody
      );
    }
  }

  async runAdminPropertyTests() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}ADMIN ENDPOINTS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);

    if (!this.authToken) {
      console.log(`${colors.yellow}⚠️  Skipping admin tests - no auth token available${colors.reset}`);
      return;
    }

    // Test admin endpoints (adjust based on your actual admin routes)
    await this.testEndpoint(
      'Admin get all properties',
      'GET',
      '/api/properties/admin/all?page=1&limit=5',
      200
    );

    // Test property status update
    if (this.propertyIds.length > 0) {
      const updateBody = {
        status: 'active',
        reason: 'Testing admin status update'
      };

      await this.testEndpoint(
        'Admin update property status',
        'PATCH',
        `/api/properties/admin/${this.propertyIds[0]}/status`,
        200,
        updateBody
      );
    }
  }

  async runAnalyticsServiceTests() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}ANALYTICS SERVICE TESTS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);

    // Test analytics endpoints (port 5004)
    await this.testEndpoint(
      'Get dashboard analytics',
      'GET',
      '/api/analytics/dashboard',
      200,
      null,
      'analytics'
    );

    if (this.brokerIds.length > 0) {
      const brokerId = this.brokerIds[0];
      
      await this.testEndpoint(
        `Get broker analytics for ID ${brokerId}`,
        'GET',
        `/api/analytics/broker/${brokerId}`,
        200,
        null,
        'analytics'
      );

      await this.testEndpoint(
        `Get broker stats for ID ${brokerId}`,
        'GET',
        `/api/analytics/broker/statistics/${brokerId}`,
        200,
        null,
        'analytics'
      );

      await this.testEndpoint(
        `Get broker clients for ID ${brokerId}`,
        'GET',
        `/api/analytics/broker/clients/${brokerId}`,
        200,
        null,
        'analytics'
      );
    }

    // Test general analytics
    await this.testEndpoint(
      'Get property analytics',
      'GET',
      '/api/analytics/properties',
      200,
      null,
      'analytics'
    );

    await this.testEndpoint(
      'Get user analytics',
      'GET',
      '/api/analytics/users',
      200,
      null,
      'analytics'
    );
  }

  async runErrorTests() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}ERROR HANDLING TESTS${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);

    // Test invalid endpoints
    await this.testEndpoint('Non-existent endpoint', 'GET', '/api/nonexistent', 404);
    await this.testEndpoint('Invalid property ID', 'GET', '/api/properties/999999', 404);
    await this.testEndpoint('Invalid ID format', 'GET', '/api/properties/abc', 400);

    // Test without authentication on protected routes
    const tempToken = this.authToken;
    this.authToken = null;
    
    await this.testEndpoint('Broker listings without auth', 'GET', '/api/properties/broker/listings', 401);
    await this.testEndpoint('Property action without auth', 'POST', '/api/properties/1/action', 401, { action: 'approve' });
    
    this.authToken = tempToken;
  }

  async testDatabaseQueries() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}DATABASE QUERIES (Direct DB Tests)${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);

    try {
      // Test 1: Count properties
      const [propertyCount] = await pool.execute(
        'SELECT COUNT(*) as total FROM properties WHERE deleted_at IS NULL'
      );
      console.log(`${colors.green}✅ Total properties in DB: ${propertyCount[0].total}${colors.reset}`);

      // Test 2: Count active properties
      const [activeCount] = await pool.execute(
        'SELECT COUNT(*) as active FROM properties WHERE deleted_at IS NULL AND property_status = "active"'
      );
      console.log(`${colors.green}✅ Active properties: ${activeCount[0].active}${colors.reset}`);

      // Test 3: Check if properties have assigned brokers
      const [assignedCount] = await pool.execute(
        'SELECT COUNT(*) as assigned FROM properties WHERE deleted_at IS NULL AND assigned_broker_id IS NOT NULL'
      );
      console.log(`${colors.green}✅ Properties with assigned brokers: ${assignedCount[0].assigned}${colors.reset}`);

      // Test 4: Sample property data
      const [sampleProperties] = await pool.execute(`
        SELECT p.id, p.title, p.property_status, p.assigned_broker_id, u.username as broker_name
        FROM properties p
        LEFT JOIN users u ON p.assigned_broker_id = u.id
        WHERE p.deleted_at IS NULL
        LIMIT 3
      `);
      
      console.log(`${colors.green}✅ Sample property data:${colors.reset}`);
      sampleProperties.forEach((p, i) => {
        console.log(`   ${i + 1}. ID:${p.id} - "${p.title}" - Status:${p.property_status} - Broker:${p.broker_name || 'none'}`);
      });

    } catch (error) {
      console.log(`${colors.red}❌ Database query failed: ${error.message}${colors.reset}`);
    }
  }

  printSummary() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.yellow}FINAL TEST SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
    
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
    
    console.log(`\n${colors.blue}📊 Test Statistics:${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
    console.log(`${colors.cyan}📋 Total: ${total}${colors.reset}`);
    console.log(`${colors.yellow}🎯 Success Rate: ${successRate}%${colors.reset}`);

    // Performance stats
    const successfulTests = this.results.filter(r => r.success && r.responseTime);
    if (successfulTests.length > 0) {
      const avgResponseTime = successfulTests.reduce((sum, test) => sum + test.responseTime, 0) / successfulTests.length;
      const maxResponseTime = Math.max(...successfulTests.map(t => t.responseTime));
      const minResponseTime = Math.min(...successfulTests.map(t => t.responseTime));
      
      console.log(`\n${colors.blue}⏱️  Performance Statistics:${colors.reset}`);
      console.log(`${colors.cyan}Average Response Time: ${avgResponseTime.toFixed(2)}ms${colors.reset}`);
      console.log(`${colors.green}Fastest Response: ${minResponseTime}ms${colors.reset}`);
      console.log(`${colors.red}Slowest Response: ${maxResponseTime}ms${colors.reset}`);
    }

    // Database stats
    console.log(`\n${colors.blue}🗃️  Database Statistics:${colors.reset}`);
    console.log(`${colors.cyan}Properties in DB: ${this.propertyIds.length}${colors.reset}`);
    console.log(`${colors.cyan}Users in DB: ${this.userIds.length}${colors.reset}`);
    console.log(`${colors.cyan}Brokers in DB: ${this.brokerIds.length}${colors.reset}`);

    // Failed tests details
    if (failed > 0) {
      console.log(`\n${colors.yellow}🔍 Failed Tests Analysis:${colors.reset}`);
      const failedTests = this.results.filter(r => !r.success);
      
      failedTests.forEach((test, index) => {
        console.log(`\n${colors.red}${index + 1}. ${test.name}${colors.reset}`);
        console.log(`   ${colors.yellow}URL: ${test.method} ${test.url}${colors.reset}`);
        console.log(`   ${colors.red}Expected: ${test.expectedStatus}, Got: ${test.actualStatus || 'Error'}${colors.reset}`);
        if (test.error) {
          console.log(`   ${colors.red}Error: ${test.error}${colors.reset}`);
        }
        if (test.data?.message) {
          console.log(`   ${colors.magenta}Response Message: ${test.data.message}${colors.reset}`);
        }
      });

      // Group by error type
      const errorTypes = {};
      failedTests.forEach(test => {
        const status = test.actualStatus || 'Network Error';
        errorTypes[status] = (errorTypes[status] || 0) + 1;
      });

      console.log(`\n${colors.yellow}📊 Error Distribution:${colors.reset}`);
      Object.entries(errorTypes).forEach(([status, count]) => {
        console.log(`   ${colors.red}${status}: ${count} failures${colors.reset}`);
      });
    }

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════════════════${colors.reset}`);
  }

  async saveResults() {
    const fs = await import('fs');
    
    const results = {
      timestamp: new Date().toISOString(),
      services: {
        property: BASE_URL,
        analytics: ANALYTICS_URL
      },
      database: {
        propertiesCount: this.propertyIds.length,
        usersCount: this.userIds.length,
        brokersCount: this.brokerIds.length,
        hasAuthToken: !!this.authToken
      },
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        successRate: `${((this.results.filter(r => r.success).length / this.results.length) * 100).toFixed(2)}%`
      },
      failedEndpoints: this.results
        .filter(r => !r.success)
        .map(r => ({
          name: r.name,
          url: r.url,
          expectedStatus: r.expectedStatus,
          actualStatus: r.actualStatus,
          error: r.error
        })),
      results: this.results
    };

    const filename = `test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`${colors.green}✅ Detailed test results saved to ${filename}${colors.reset}`);

    // Also save a quick summary
    const summary = {
      timestamp: results.timestamp,
      total: results.summary.total,
      passed: results.summary.passed,
      failed: results.summary.failed,
      successRate: results.summary.successRate,
      criticalFailures: results.failedEndpoints.filter(f => 
        f.expectedStatus === 200 && f.actualStatus >= 500
      ).length
    };
    
    fs.writeFileSync('test-summary.json', JSON.stringify(summary, null, 2));
    console.log(`${colors.green}✅ Quick summary saved to test-summary.json${colors.reset}`);
  }
}

// Main test runner
async function runAllTests() {
  const tester = new PropertyServiceTester();
  
  try {
    console.log(`${colors.yellow}🚀 Starting Property Service API Tests...${colors.reset}`);
    
    // Initialize and connect to database
    await tester.initialize();
    
    // Run database queries first
    await tester.testDatabaseQueries();
    
    // Run health checks
    await tester.runHealthChecks();
    
    // Run public API tests
    await tester.runPublicPropertyTests();
    
    // Run broker-specific tests
    await tester.runBrokerPropertyTests();
    
    // Run admin tests
    await tester.runAdminPropertyTests();
    
    // Run analytics service tests
    await tester.runAnalyticsServiceTests();
    
    // Run error tests
    await tester.runErrorTests();
    
    // Print summary and save results
    tester.printSummary();
    await tester.saveResults();
    
    // Final status
    const passed = tester.results.filter(r => r.success).length;
    const total = tester.results.length;
    
    if (passed === total) {
      console.log(`${colors.green}🎉 All tests passed! 🎉${colors.reset}`);
    } else if (passed > total * 0.7) {
      console.log(`${colors.yellow}⚠️  Most tests passed, but some issues need attention${colors.reset}`);
    } else {
      console.log(`${colors.red}🚨 Many tests failed - check the detailed report${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Test runner failed: ${error.message}${colors.reset}`);
    console.error(error.stack);
  } finally {
    // Close database connection
    try {
      await pool.end();
      console.log(`${colors.green}✅ Database connection closed${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠️  Error closing database: ${error.message}${colors.reset}`);
    }
  }
}

// Quick installation guide
console.log(`${colors.yellow}📦 Installation Instructions:${colors.reset}`);
console.log(`${colors.cyan}1. Install dependencies:${colors.reset}`);
console.log(`${colors.magenta}   npm install mysql2 node-fetch dotenv${colors.reset}`);
console.log(`${colors.cyan}2. Make sure property service is running on port 5002${colors.reset}`);
console.log(`${colors.cyan}3. Make sure analytics service is running on port 5004${colors.reset}`);
console.log(`${colors.cyan}4. Update database credentials in .env file if needed${colors.reset}`);
console.log(`${colors.cyan}5. Run this test:${colors.reset}`);
console.log(`${colors.magenta}   node test-property-service-endpoints.js${colors.reset}\n`);

// Run the tests
runAllTests().catch(console.error);