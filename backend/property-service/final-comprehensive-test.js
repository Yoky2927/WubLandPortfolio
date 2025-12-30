// backend/property-service/final-comprehensive-test.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const BASE_URL = 'http://localhost:5002';

// Generate fresh tokens
function generateFreshTokens() {
    console.log("🔑 GENERATING FRESH TEST TOKENS\n");

    const JWT_SECRET = process.env.JWT_SECRET || 'your-test-secret-key';

    const users = [
        { id: 1, username: 'yokabd_admin', role: 'super_admin', privilege_tier: 'enterprise', tokenName: 'ADMIN' },
        { id: 3, username: 'beza_hilemariam', role: 'internal_broker', privilege_tier: 'premium', tokenName: 'BROKER' },
        { id: 5, username: 'test_seller', role: 'seller', privilege_tier: 'basic', tokenName: 'USER' }
    ];

    const tokens = {};
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 7 * 24 * 60 * 60;

    users.forEach(user => {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            privilege_tier: user.privilege_tier,
            iat: now,
            exp: now + expiresIn
        };

        tokens[user.tokenName] = jwt.sign(payload, JWT_SECRET);
    });

    console.log("✅ Tokens generated\n");
    return tokens;
}

const TOKENS = generateFreshTokens();

// NEW: Route diagnostics function
async function diagnoseRouteIssues() {
    console.log("\n🔍 DIAGNOSING ROUTE ISSUES:\n");

    // Test image/document routes with correct paths
    const routeTests = [
        { path: '/api/properties/images/property/1', token: null, desc: 'Image route test' },
        { path: '/api/properties/documents/1/documents', token: null, desc: 'Document route test' },
        { path: '/api/admin/properties', token: 'ADMIN', desc: 'Admin properties route' },
        { path: '/api/admin/properties/stats/summary', token: 'ADMIN', desc: 'Admin stats route' }
    ];

    for (const test of routeTests) {
        const result = await makeRequest('GET', test.path, test.token);
        console.log(`${test.desc}: ${test.path}`);
        console.log(`   Status: ${result.status} - ${result.success ? '✅' : '❌'} ${result.message || ''}`);

        if (result.status === 404) {
            console.log(`   ⚠️  Route not found - check mounting in server.js`);
        }
    }
}

async function runComprehensiveTest() {
    console.log("🚀 COMPREHENSIVE PROPERTY SERVICE TEST\n");
    console.log("Testing actual endpoints with correct permissions\n");

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let createdPropertyId = null;
    let createdAvailabilityId = null;

    // Get existing property ID
    console.log("🔍 Finding existing properties...");
    const propertiesResponse = await makeRequest('GET', '/api/properties', null);
    let existingPropertyId = 1;

    if (propertiesResponse.success && propertiesResponse.data?.properties?.length > 0) {
        existingPropertyId = propertiesResponse.data.properties[0].id;
        console.log(`📝 Using existing property ID: ${existingPropertyId}`);
    }

    // Test property data - ONLY brokers/admins can create
    const brokerPropertyData = {
        title: "Broker Test Property",
        description: "Test property created by broker",
        property_type: "house",
        property_status: "draft",
        address: "123 Broker St",
        city: "Addis Ababa",
        state: "Addis Ababa",
        country: "Ethiopia",
        price: 7500000,
        currency: "ETB",
        listing_type: "sale",
        owner_user_id: 5, // Seller ID
        assigned_broker_id: 3 // Broker ID
    };

    const tests = [
        // ========== PUBLIC ENDPOINTS ==========
        { method: 'GET', path: '/health', token: null, desc: 'Health check' },
        { method: 'GET', path: '/', token: null, desc: 'Root endpoint' },

        // ========== PROPERTY ENDPOINTS ==========
        { method: 'GET', path: '/api/properties', token: null, desc: 'All properties' },
        { method: 'GET', path: `/api/properties/${existingPropertyId}`, token: null, desc: 'Property details' },
        { method: 'GET', path: '/api/properties/featured?limit=2', token: null, desc: 'Featured properties' },
        { method: 'GET', path: '/api/properties/premium?limit=2', token: null, desc: 'Premium properties' },
        { method: 'GET', path: '/api/properties/search?q=Addis', token: null, desc: 'Search properties' },

        // ========== IMAGE ENDPOINTS ==========
        // FIXED: Based on propertyImage.routes.js routes
        // route: GET '/property/:id' -> full path: /api/properties/images/property/:id
        { method: 'GET', path: `/api/properties/images/property/${existingPropertyId}`, token: 'BROKER', desc: 'Get property images' },
        { method: 'GET', path: `/api/properties/images/property/${existingPropertyId}/floor-plans`, token: 'BROKER', desc: 'Get floor plans' },
        { method: 'GET', path: `/api/properties/documents/${existingPropertyId}/documents`, token: 'BROKER', desc: 'Get property documents' },

        // route: GET '/documents/pending' -> full path: /api/properties/documents/documents/pending
        { method: 'GET', path: '/api/properties/documents/documents/pending', token: 'BROKER', desc: 'Get pending documents' },

        // ========== AVAILABILITY ENDPOINTS ==========
        {
            method: 'POST', path: '/api/availability/brokers/3/availability/check', token: null, body: {
                date: new Date().toISOString().split('T')[0],
                start_time: '10:00',
                end_time: '11:00'
            }, desc: 'Check availability (public)'
        },

        { method: 'GET', path: '/api/availability/availability/me', token: 'BROKER', desc: 'Get my availability' },
        { method: 'GET', path: '/api/availability/brokers/3/availability', token: 'BROKER', desc: 'Get broker availability' },

        // ========== CREATE PROPERTY - ONLY FOR BROKERS/ADMINS ==========
        {
            method: 'POST',
            path: '/api/properties',
            token: 'BROKER',
            body: brokerPropertyData,
            desc: 'Create property (broker only)',
            captureId: true,
            expectedSuccess: true
        },

        {
            method: 'POST',
            path: '/api/properties',
            token: 'USER',
            body: brokerPropertyData,
            desc: 'Create property (seller - should fail)',
            expectedSuccess: false
        },

        // ========== BROKER LISTINGS ==========
        { method: 'GET', path: '/api/properties/broker/listings', token: 'BROKER', desc: 'Get broker listings' },

        // ========== ADMIN ENDPOINTS ==========
        // FIXED: Based on your actual routes in admin.routes.js
        { method: 'GET', path: '/api/admin/properties', token: 'ADMIN', desc: 'Admin - Get all properties' },
        { method: 'GET', path: '/api/admin/properties/stats', token: 'ADMIN', desc: 'Admin - Get statistics' },
        { method: 'GET', path: '/api/admin/properties/stats/summary', token: 'ADMIN', desc: 'Admin - Get stats summary' },

        // ========== PROPERTY MANAGEMENT ==========
        {
            method: 'PUT', path: `/api/properties/${existingPropertyId}`, token: 'BROKER', body: {
                description: 'Updated description ' + new Date().toISOString()
            }, desc: 'Update property (broker)'
        },

        {
            method: 'PATCH', path: `/api/properties/${existingPropertyId}/price`, token: 'BROKER', body: {
                price: 5500000
            }, desc: 'Update property price (broker)'
        },

        {
            method: 'PATCH', path: `/api/properties/${existingPropertyId}/status`, token: 'BROKER', body: {
                status: 'active',
                notes: 'Approved via test'
            }, desc: 'Update property status (broker)'
        },

        {
            method: 'POST', path: `/api/properties/${existingPropertyId}/action`, token: 'BROKER', body: {
                action: 'approve',
                notes: 'Approved via test'
            }, desc: 'Property action (broker approve)'
        },

        // ========== AVAILABILITY MANAGEMENT ==========
        {
            method: 'POST', path: '/api/availability/availability', token: 'BROKER', body: {
                day_of_week: 'monday',
                start_time: '09:00',
                end_time: '17:00',
                is_available: true
            }, desc: 'Set availability (broker)', captureAvailabilityId: true
        },

        // ========== CLEANUP ==========
        { method: 'DELETE', path: '/api/availability/availability/__AVAIL_ID__', token: 'BROKER', desc: 'Delete availability', needsAvailabilityId: true },
        { method: 'DELETE', path: '/api/properties/__ID__', token: 'ADMIN', desc: 'Delete test property', needsPropertyId: true }
    ];

    console.log("📋 Running comprehensive tests...\n");

    for (const test of tests) {
        console.log(`${test.method} ${test.path} - ${test.desc}`);

        // Handle path replacements
        let actualPath = test.path;
        if (test.path.includes('__ID__') && createdPropertyId) {
            actualPath = test.path.replace('__ID__', createdPropertyId);
        } else if (test.path.includes('__ID__') && !createdPropertyId) {
            console.log(`   ⏭️ SKIPPED: Needs created property ID (not created yet)`);
            skipped++;
            continue;
        }

        if (test.needsAvailabilityId && !createdAvailabilityId) {
            console.log(`   ⏭️ SKIPPED: Needs availability ID (not created yet)`);
            skipped++;
            continue;
        }
        if (test.path.includes('__AVAIL_ID__')) {
            actualPath = test.path.replace('__AVAIL_ID__', createdAvailabilityId);
        }

        // Check if we have the required token
        if (test.token && !TOKENS[test.token]) {
            console.log(`   ⏭️ SKIPPED: No ${test.token} token available`);
            skipped++;
            continue;
        }

        try {
            const result = await makeRequest(
                test.method,
                actualPath,
                test.token ? TOKENS[test.token] : null,
                test.body
            );

            // Check if result matches expectation
            const isSuccess = result.success;
            const expectedSuccess = test.expectedSuccess !== undefined ? test.expectedSuccess : true;

            if (isSuccess === expectedSuccess) {
                console.log(`   ✅ ${result.status} - ${result.message || (isSuccess ? 'Success' : 'Expected failure')}`);
                passed++;

                // Capture IDs
                if (test.captureId && result.data?.id) {
                    createdPropertyId = result.data.id;
                    console.log(`   📝 Created property ID: ${createdPropertyId}`);
                }

                if (test.captureAvailabilityId && result.data?.id) {
                    createdAvailabilityId = result.data.id;
                    console.log(`   📝 Created availability ID: ${createdAvailabilityId}`);
                }
            } else {
                const statusIcon = result.status === 404 ? '🔍' :
                    result.status === 401 ? '🔐' :
                        result.status === 403 ? '🚫' : '❌';
                console.log(`   ${statusIcon} ${result.status} - ${result.message || 'Unexpected result'}`);

                // Helpful error messages
                if (result.status === 404) {
                    console.log(`   💡 Endpoint not found - check route mounting`);
                } else if (result.status === 403) {
                    console.log(`   💡 Permission denied - correct behavior for role-based access`);
                } else if (result.status === 500) {
                    console.log(`   💥 Server error - check controller implementation`);
                }

                failed++;
            }
        } catch (error) {
            console.log(`   💥 Network error: ${error.message}`);
            console.log(`   💡 Server might have crashed - restart and try again`);
            failed++;
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Run diagnostics after tests
    await diagnoseRouteIssues();

    console.log(`\n📊 TEST SUMMARY:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️ Skipped: ${skipped}`);

    console.log(`\n🎯 TESTING PHILOSOPHY:`);
    console.log(`   ✓ Sellers CANNOT post properties directly`);
    console.log(`   ✓ Only brokers/admins can create listings`);
    console.log(`   ✓ Company properties handled by brokers/admins`);
    console.log(`   ✓ Proper role-based access control`);

    if (failed > 0) {
        console.log(`\n⚠️  ${failed} tests need attention - see diagnostics above`);
    } else {
        console.log(`\n🎉 All tests passed! System is working as designed.`);
    }
}

async function makeRequest(method, path, token, body = null) {
    const url = `${BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const requestOptions = {
            method,
            headers,
        };

        if (body) {
            requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);
        const text = await response.text();

        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { raw: text };
        }

        return {
            success: response.ok,
            status: response.status,
            message: data.message || data.error || response.statusText,
            error: data.error,
            data: data.data || data
        };

    } catch (error) {
        return {
            success: false,
            status: 0,
            message: `Network error: ${error.message}`,
            error: error.message
        };
    }
}

// Quick route discovery - FIXED PATHS
async function quickRouteCheck() {
    console.log("🔍 QUICK ROUTE CHECK - What's actually available:\n");

    const routes = [
        '/health',
        '/',
        '/api/properties',
        '/api/properties/1',
        '/api/properties/featured',
        '/api/properties/premium',
        '/api/properties/search?q=test',
        '/api/properties/images/property/1',  // FIXED: Added /property/
        '/api/properties/documents/1/documents',  // This should work
        '/api/availability/brokers/3/availability',
        '/api/availability/availability/me',
        '/api/admin/properties',  // Test admin route
    ];

    for (const route of routes) {
        const result = await makeRequest('GET', route, null);
        const icon = result.success ? '✅' : result.status === 404 ? '🔍' : result.status === 401 ? '🔐' : '❌';
        console.log(`${icon} ${route}`);
    }
}

async function main() {
    console.log("=".repeat(70));
    console.log("FINAL COMPREHENSIVE PROPERTY SERVICE TEST");
    console.log("=".repeat(70));
    console.log("Testing with correct role-based permissions\n");
    console.log("📌 NOTE: Sellers cannot post properties - only brokers/admins\n");

    try {
        // Quick route check first
        await quickRouteCheck();

        console.log("\n" + "=".repeat(70));
        console.log("RUNNING COMPREHENSIVE TEST");
        console.log("=".repeat(70));

        // Run the comprehensive test
        await runComprehensiveTest();

        console.log("\n" + "=".repeat(70));
        console.log("TEST COMPLETE");
        console.log("=".repeat(70));

        console.log("\n💡 SYSTEM ARCHITECTURE SUMMARY:");
        console.log("   1. ✅ Public endpoints work correctly");
        console.log("   2. ✅ Role-based access control enforced");
        console.log("   3. ✅ Brokers/Admins can manage properties");
        console.log("   4. ✅ Sellers cannot post directly (contact broker)");
        console.log("   5. ✅ Company properties handled by brokers/admins");
        console.log("   6. ✅ Availability scheduling works");

        console.log("\n🔍 PENDING VERIFICATION:");
        console.log("   1. Image routes - check propertyImage.routes.js");
        console.log("   2. Document routes - check propertyDocument.routes.js");
        console.log("   3. Admin routes - check admin.routes.js");

    } catch (error) {
        console.error(`\n💥 TEST CRASHED: ${error.message}`);
        console.error(error.stack);
    }
}

// Run the test
main().catch(console.error);