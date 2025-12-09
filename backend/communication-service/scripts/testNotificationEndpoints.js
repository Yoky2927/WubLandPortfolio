// communication-service/scripts/testNotificationEndpoints.js
import axios from 'axios';
import { createConnection } from 'mysql2/promise';
import 'dotenv/config';

const API_BASE_URL = 'http://localhost:5001/api';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'communication-service-secret-12345';

async function getDatabaseConnection() {
  return await createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'wubland_portfolio_db',
    port: process.env.DB_PORT || 3306
  });
}

async function getUsersFromDatabase() {
  let connection;
  try {
    connection = await getDatabaseConnection();
    
    const [users] = await connection.execute(`
      SELECT id, first_name, last_name, username, email, role, status 
      FROM users 
      WHERE status = 'active'
      ORDER BY id
    `);
    
    console.log(`📋 Retrieved ${users.length} active users from database`);
    return users;
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    return [];
  } finally {
    if (connection) await connection.end();
  }
}

async function testInternalEndpointsWithRealUsers(users) {
  console.log('\n🎯 TESTING INTERNAL NOTIFICATION ENDPOINTS WITH REAL USERS');
  console.log('==========================================================');
  
  const headers = {
    'Content-Type': 'application/json',
    'x-internal-token': INTERNAL_TOKEN
  };

  const usersByRole = {
    super_admin: users.filter(u => u.role === 'super_admin'),
    admin: users.filter(u => u.role === 'admin'),
    support_agent: users.filter(u => u.role === 'support_agent'),
    support_lead: users.filter(u => u.role === 'support_lead'),
    support_admin: users.filter(u => u.role === 'support_admin'),
    internal_broker: users.filter(u => u.role === 'internal_broker'),
    external_broker: users.filter(u => u.role === 'external_broker'),
    buyer: users.filter(u => u.role === 'buyer'),
    seller: users.filter(u => u.role === 'seller'),
    landlord: users.filter(u => u.role === 'landlord'),
    renter: users.filter(u => u.role === 'renter'),
    user: users.filter(u => u.role === 'user')
  };

  console.log('\n👥 User Distribution by Role:');
  Object.entries(usersByRole).forEach(([role, users]) => {
    if (users.length > 0) {
      console.log(`  ${role}: ${users.length} user(s) - ${users.map(u => u.username).join(', ')}`);
    }
  });

  const tests = [
    {
      name: 'Send to All Admins (Super Admins + Admins)',
      endpoint: '/internal/notifications/send-to-admins',
      data: {
        notificationData: {
          title: '⚠️ System Maintenance Scheduled',
          message: 'The platform will be down for maintenance on Sunday from 2 AM to 4 AM.',
          type: 'system',
          priority: 'medium',
          actionUrl: '/admin/system-status'
        }
      }
    },
    {
      name: 'Send to Internal Brokers Only',
      endpoint: '/internal/notifications/send-to-brokers',
      data: {
        brokerType: 'internal',
        notificationData: {
          title: 'Commission Policy Update',
          message: 'Please review the updated commission policy effective next quarter.',
          type: 'info',
          priority: 'medium',
          actionUrl: '/broker/policies'
        }
      }
    },
    {
      name: 'Send to Specific Roles (Brokers + Support)',
      endpoint: '/internal/notifications/send-by-role',
      data: {
        roles: ['internal_broker', 'external_broker', 'support_agent', 'support_lead', 'support_admin'],
        notificationData: {
          title: 'Monthly Training Session',
          message: 'Join us for the monthly training session this Friday at 10 AM.',
          type: 'info',
          priority: 'medium'
        }
      }
    },
    {
      name: 'Security Alert for Admin Team',
      endpoint: '/internal/notifications/security-alert',
      data: {
        type: 'brute_force_attempt',
        severity: 'high',
        details: 'Multiple failed login attempts detected from IP address 192.168.1.100',
        ipAddress: '192.168.1.100',
        userId: usersByRole.super_admin[0]?.id || 1
      }
    },
    {
      name: 'New Broker Application (Test User Becoming Broker)',
      endpoint: '/internal/notifications/new-broker-application',
      data: {
        userId: usersByRole.user[0]?.id || 13,
        applicantName: 'Tigist Assefa',
        applicationId: 'BROK-APP-2024-001'
      }
    },
    {
      name: 'Content Flag - Inappropriate Property Listing',
      endpoint: '/internal/notifications/content-flag',
      data: {
        listingId: 1,
        flaggedBy: usersByRole.buyer[0]?.username || 'meron_buyer',
        reason: 'Suspicious pricing - significantly below market value',
        entityType: 'property',
        severity: 'high'
      }
    },
    {
      name: 'Payment Issue - Commission Payout Failed',
      endpoint: '/internal/notifications/payment-issue',
      data: {
        transactionId: 'TXN-2024-001',
        amount: 65000,
        type: 'commission_payout',
        error: 'Bank declined transaction - account not found',
        userId: usersByRole.internal_broker[0]?.id || 3
      }
    },
    {
      name: 'New Support Ticket from User',
      endpoint: '/internal/notifications/new-support-ticket',
      data: {
        ticketId: 'TKT-2024-002',
        userId: usersByRole.renter[0]?.id || 12,
        userName: 'Liya Gebre',
        issue: 'Rental agreement has incorrect move-in date',
        category: 'transaction'
      }
    },
    {
      name: 'Property Alert to All Buyers',
      endpoint: '/internal/notifications/send-by-role',
      data: {
        roles: ['buyer'],
        notificationData: {
          title: 'New Properties Matching Your Search',
          message: 'Check out these new listings that match your saved search criteria.',
          type: 'property',
          priority: 'low',
          actionUrl: '/properties/search'
        }
      }
    },
    {
      name: 'Seller/Landlord Newsletter',
      endpoint: '/internal/notifications/send-by-role',
      data: {
        roles: ['seller', 'landlord'],
        notificationData: {
          title: 'Market Insights & Tips',
          message: 'Latest market trends and tips for getting your property sold/rented faster.',
          type: 'info',
          priority: 'low'
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log(`📤 Endpoint: ${test.endpoint}`);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}${test.endpoint}`,
        test.data,
        { headers, timeout: 10000 }
      );
      
      console.log('✅ SUCCESS');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message || 'Notification sent'}`);
      
      if (response.data.details) {
        console.log(`   Recipients: ${response.data.details.recipients || response.data.details.count || 'N/A'}`);
      }
      
      passed++;
      
    } catch (error) {
      console.log('❌ FAILED');
      console.log(`   Error: ${error.message}`);
      
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response:`, error.response.data);
      } else if (error.request) {
        console.log(`   No response received from server`);
      }
      failed++;
    }
    
    await delay(1000);
  }

  console.log('\n📊 INTERNAL ENDPOINTS TEST SUMMARY');
  console.log('=================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  return { passed, failed };
}

async function testUserSpecificNotifications(users) {
  console.log('\n👤 TESTING USER-SPECIFIC NOTIFICATION SCENARIOS');
  console.log('=============================================');
  
  const headers = {
    'Content-Type': 'application/json',
    'x-internal-token': INTERNAL_TOKEN
  };

  const specificTests = [];

  users.forEach(user => {
    switch(user.role) {
      case 'super_admin':
        specificTests.push({
          name: `System Health Alert - ${user.username}`,
          endpoint: '/internal/notifications/send-by-role',
          data: {
            roles: ['super_admin'],
            notificationData: {
              title: '⚠️ System Health Dashboard',
              message: `Daily system metrics available for review. CPU usage at 75% threshold.`,
              type: 'system',
              priority: 'high',
              actionUrl: '/admin/system-health'
            }
          }
        });
        break;
        
      case 'internal_broker':
        specificTests.push({
          name: `New Client Inquiry - ${user.username}`,
          endpoint: '/internal/notifications/send-by-role',
          data: {
            roles: ['internal_broker'],
            notificationData: {
              title: 'New Client Inquiry Received',
              message: `${user.first_name}, you have a new inquiry for your luxury villa listing.`,
              type: 'property',
              priority: 'medium',
              actionUrl: '/broker/inquiries'
            }
          }
        });
        break;
        
      case 'buyer':
        specificTests.push({
          name: `Price Drop Alert - ${user.username}`,
          endpoint: '/internal/notifications/send-by-role',
          data: {
            roles: ['buyer'],
            notificationData: {
              title: 'Price Drop on Saved Properties',
              message: `Properties you saved have dropped in price. Check them out now!`,
              type: 'property',
              priority: 'medium',
              actionUrl: '/buyer/saved-properties'
            }
          }
        });
        break;
        
      case 'support_agent':
        specificTests.push({
          name: `New Ticket Assigned - ${user.username}`,
          endpoint: '/internal/notifications/send-by-role',
          data: {
            roles: ['support_agent'],
            notificationData: {
              title: 'New Support Ticket Assigned',
              message: `Ticket #TKT-2024-003 has been assigned to you. Urgent customer issue.`,
              type: 'info',
              priority: 'high',
              actionUrl: '/support/tickets/TKT-2024-003'
            }
          }
        });
        break;
    }
  });

  const limitedTests = specificTests.slice(0, 5);
  
  let passed = 0;
  let failed = 0;

  for (const test of limitedTests) {
    console.log(`\n📋 Test: ${test.name}`);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}${test.endpoint}`,
        test.data,
        { headers, timeout: 10000 }
      );
      
      console.log('✅ SUCCESS');
      console.log(`   Status: ${response.status}`);
      passed++;
      
    } catch (error) {
      console.log('❌ FAILED');
      console.log(`   Error: ${error.message}`);
      failed++;
    }
    
    await delay(800);
  }

  console.log('\n📊 USER-SPECIFIC TEST SUMMARY');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  return { passed, failed };
}

async function testErrorScenarios() {
  console.log('\n🚨 TESTING ERROR SCENARIOS');
  console.log('=========================');
  
  const headers = {
    'Content-Type': 'application/json',
    'x-internal-token': INTERNAL_TOKEN
  };

  const errorTests = [
    {
      name: 'Invalid Internal Token',
      endpoint: '/internal/notifications/send-by-role',
      headers: { ...headers, 'x-internal-token': 'wrong-token-123' },
      data: {
        roles: ['admin'],
        notificationData: { title: 'Test', message: 'Should fail due to invalid token' }
      },
      shouldFail: true
    },
    {
      name: 'Missing Required Fields (No Title)',
      endpoint: '/internal/notifications/send-by-role',
      data: {
        roles: ['admin'],
        notificationData: { message: 'Missing title field' }
      },
      shouldFail: true
    },
    {
      name: 'Empty Roles Array',
      endpoint: '/internal/notifications/send-by-role',
      data: {
        roles: [],
        notificationData: { title: 'Test', message: 'Empty roles array' }
      },
      shouldFail: true
    },
    {
      name: 'Non-existent Role',
      endpoint: '/internal/notifications/send-by-role',
      data: {
        roles: ['non_existent_role', 'another_fake_role'],
        notificationData: { title: 'Test', message: 'Invalid roles' }
      },
      shouldFail: true
    },
    {
      name: 'Invalid Notification Type',
      endpoint: '/internal/notifications/send-by-role',
      data: {
        roles: ['admin'],
        notificationData: { 
          title: 'Test', 
          message: 'Invalid type',
          type: 'invalid_type' 
        }
      },
      shouldFail: true
    },
    {
      name: 'Invalid Broker Type',
      endpoint: '/internal/notifications/send-to-brokers',
      data: {
        brokerType: 'invalid_broker_type',
        notificationData: { 
          title: 'Test', 
          message: 'Invalid broker type'
        }
      },
      shouldFail: true
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of errorTests) {
    console.log(`\n📋 Test: ${test.name}`);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}${test.endpoint}`,
        test.data,
        { headers: test.headers || headers, timeout: 5000 }
      );
      
      if (test.shouldFail) {
        console.log('❌ FAILED - Should have returned error but succeeded');
        console.log(`   Response:`, response.data);
        failed++;
      } else {
        console.log('✅ PASSED - Correctly succeeded');
        passed++;
      }
      
    } catch (error) {
      if (error.response && test.shouldFail) {
        console.log('✅ PASSED - Correctly returned error');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}`);
        passed++;
      } else if (error.response && !test.shouldFail) {
        console.log('❌ FAILED - Unexpected error');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response:`, error.response.data);
        failed++;
      } else {
        console.log('❌ FAILED - Network error');
        console.log(`   Error: ${error.message}`);
        failed++;
      }
    }
    
    await delay(500);
  }

  console.log('\n📊 ERROR TEST SUMMARY');
  console.log(`✅ Expected Errors: ${passed}`);
  console.log(`❌ Unexpected Success: ${failed}`);
  
  return { passed, failed };
}

async function verifyNotificationsInDatabase(initialCount) {
  console.log('\n🔍 VERIFYING NOTIFICATIONS IN DATABASE');
  console.log('====================================');
  
  let connection;
  try {
    connection = await getDatabaseConnection();
    
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as total_notifications FROM notifications'
    );
    
    const totalNotifications = totalResult[0].total_notifications;
    const newNotifications = totalNotifications - initialCount;
    
    console.log(`📊 Total Notifications: ${totalNotifications}`);
    console.log(`📊 New Notifications Created: ${newNotifications}`);
    
    const [typeResult] = await connection.execute(`
      SELECT 
        notification_type,
        priority,
        COUNT(*) as count,
        GROUP_CONCAT(DISTINCT u.username ORDER BY u.username) as recipients
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      GROUP BY notification_type, priority
      ORDER BY priority DESC, count DESC
    `);
    
    if (typeResult.length > 0) {
      console.log('\n📊 Recent Notifications by Type:');
      console.table(typeResult);
    }
    
    const [roleResult] = await connection.execute(`
      SELECT 
        u.role,
        COUNT(n.id) as notification_count,
        GROUP_CONCAT(DISTINCT u.username ORDER BY u.username) as users
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      GROUP BY u.role
      ORDER BY notification_count DESC
    `);
    
    if (roleResult.length > 0) {
      console.log('\n👥 Recent Notifications by Role:');
      console.table(roleResult);
    }
    
    const [sampleResult] = await connection.execute(`
      SELECT 
        u.username,
        u.role,
        n.title,
        n.notification_type,
        n.priority,
        DATE_FORMAT(n.created_at, '%H:%i:%s') as time_created
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      ORDER BY n.created_at DESC
      LIMIT 8
    `);
    
    if (sampleResult.length > 0) {
      console.log('\n📝 Sample of Latest Notifications:');
      console.table(sampleResult);
    }
    
    return {
      total: totalNotifications,
      new: newNotifications
    };
    
  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
    return null;
  } finally {
    if (connection) await connection.end();
  }
}

async function getInitialNotificationCount() {
  let connection;
  try {
    connection = await getDatabaseConnection();
    const [result] = await connection.execute(
      'SELECT COUNT(*) as count FROM notifications'
    );
    return result[0].count;
  } catch (error) {
    console.error('❌ Error getting initial count:', error.message);
    return 0;
  } finally {
    if (connection) await connection.end();
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runComprehensiveTests() {
  console.log('🚀 STARTING COMPREHENSIVE NOTIFICATION TESTS');
  console.log('===========================================');
  console.log(`📅 ${new Date().toLocaleString()}`);
  
  const initialCount = await getInitialNotificationCount();
  console.log(`📊 Initial notification count: ${initialCount}`);
  
  const users = await getUsersFromDatabase();
  
  if (users.length === 0) {
    console.log('❌ No users found in database. Please run your seed script first.');
    return;
  }
  
  const internalResults = await testInternalEndpointsWithRealUsers(users);
  await delay(2000);
  
  const userSpecificResults = await testUserSpecificNotifications(users);
  await delay(2000);
  
  const errorResults = await testErrorScenarios();
  await delay(2000);
  
  const finalState = await verifyNotificationsInDatabase(initialCount);
  
  console.log('\n🎯 FINAL TEST SUMMARY');
  console.log('===================');
  console.log(`📊 Database Changes:`);
  console.log(`   Initial: ${initialCount} notifications`);
  console.log(`   Final: ${finalState?.total || 'N/A'} notifications`);
  console.log(`   Created: ${finalState?.new || 'N/A'} new notifications`);
  
  console.log(`\n📈 Test Results:`);
  console.log(`   Internal Endpoints: ${internalResults.passed}/${internalResults.passed + internalResults.failed} passed`);
  console.log(`   User-Specific: ${userSpecificResults.passed}/${userSpecificResults.passed + userSpecificResults.failed} passed`);
  console.log(`   Error Scenarios: ${errorResults.passed}/${errorResults.passed + errorResults.failed} passed`);
  
  const totalTests = (internalResults.passed + internalResults.failed) +
                     (userSpecificResults.passed + userSpecificResults.failed) +
                     (errorResults.passed + errorResults.failed);
  
  const totalPassed = internalResults.passed + userSpecificResults.passed + errorResults.passed;
  
  console.log(`\n📊 Overall: ${totalPassed}/${totalTests} tests passed`);
  console.log(`   Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  
  if (internalResults.failed === 0 && userSpecificResults.failed === 0 && errorResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n🔌 WebSocket Status:');
  console.log('   Make sure your WebSocket server is running on ws://localhost:5001');
  console.log('   You can test real-time delivery by connecting with a user ID.');
}

// Run the tests
runComprehensiveTests().catch(error => {
  console.error('❌ Fatal error running tests:', error);
  process.exit(1);
});