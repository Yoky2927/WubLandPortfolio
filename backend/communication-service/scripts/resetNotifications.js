// communication-service/scripts/resetNotifications.js
import { createConnection } from 'mysql2/promise';
import { randomUUID } from 'crypto';

async function resetNotifications() {
  let connection;
  
  try {
    // Create database connection
    connection = await createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wubland_portfolio_db',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ Connected to database');
    
    // 1. Delete all existing notifications
    await connection.execute('DELETE FROM notifications');
    console.log('✅ Cleared existing notifications');
    
    // 2. Get all active users
    const [users] = await connection.execute(
      `SELECT id, first_name, last_name, username, email, role, status FROM users WHERE status = 'active'`
    );
    
    console.log(`📋 Found ${users.length} active users`);
    
    // 3. Create realistic notifications for each user
    const now = new Date();
    let totalNotifications = 0;
    
    for (const user of users) {
      const notifications = [];
      
      // Welcome notification for everyone
      notifications.push({
        uuid: randomUUID(),
        title: `Welcome to WubLand, ${user.first_name}!`,
        message: 'Your account is now active. Start exploring properties or list your own.',
        type: 'welcome',
        priority: 'low',
        actionUrl: '/dashboard'
      });
      
      // Role-specific notifications
      if (['super_admin', 'admin'].includes(user.role)) {
        notifications.push({
          uuid: randomUUID(),
          title: '⚠️ System Health Check Required',
          message: 'Daily system health report indicates potential database performance issues',
          type: 'system',
          priority: 'high',
          actionUrl: '/admin/system-health'
        });
        
        notifications.push({
          uuid: randomUUID(),
          title: 'Pending User Verifications',
          message: 'You have 3 pending user account verifications requiring approval',
          type: 'user_management',  // Fixed: added type
          priority: 'medium',
          actionUrl: '/admin/verifications'
        });
      }
      
      if (user.role === 'support_agent') {
        notifications.push({
          uuid: randomUUID(),
          title: 'New Support Ticket Assigned',
          message: 'Ticket #TKT-2024-015: "Cannot upload property images" has been assigned to you',
          type: 'support',
          priority: 'high',
          actionUrl: '/support/tickets/TKT-2024-015'
        });
      }
      
      // Support Lead & Support Admin
      if (user.role === 'support_lead' || user.role === 'support_admin') {
        notifications.push({
          uuid: randomUUID(),
          title: 'Team Performance Review',
          message: 'Weekly support team performance metrics are available for review',
          type: 'report',
          priority: 'medium',
          actionUrl: '/support/team-metrics'
        });
      }
      
      // Internal Broker
      if (user.username === 'beza_broker' || user.email === 'beza@wubland.com') {
        notifications.push({
          uuid: randomUUID(),
          title: 'New Property Inquiry',
          message: 'Meron Teshome has inquired about your Luxury Villa listing',
          type: 'property_inquiry',
          priority: 'medium',
          actionUrl: '/broker/inquiries'
        });
        
        notifications.push({
          uuid: randomUUID(),
          title: 'Commission Payment Processed',
          message: 'Your commission of ETB 65,000 has been deposited to your account',
          type: 'payment',
          priority: 'low',
          actionUrl: '/broker/earnings'
        });
      }
      
      // External Broker
      if (user.username === 'elias_broker' || user.email === 'elias@wubland.com') {
        notifications.push({
          uuid: randomUUID(),
          title: 'New Rental Agreement Signed',
          message: 'Liya Gebre has signed the rental agreement for the Modern Apartment',
          type: 'transaction',
          priority: 'medium',
          actionUrl: '/broker/transactions'
        });
      }
      
      // Buyer
      if (user.username === 'meron_buyer' || user.email === 'meron@wubland.com') {
        notifications.push({
          uuid: randomUUID(),
          title: 'Price Drop Alert!',
          message: 'Properties matching your search criteria have dropped in price. View now!',
          type: 'property_alert',
          priority: 'medium',
          actionUrl: '/properties/search'
        });
      }
      
      // Seller
      if (user.username === 'beletu_seller' || user.email === 'beletu@wubland.com') {
        notifications.push({
          uuid: randomUUID(),
          title: 'Your Listing Needs Attention',
          message: 'Your Luxury Villa listing has not been updated in 30 days. Consider refreshing it.',
          type: 'property_reminder',
          priority: 'medium',
          actionUrl: '/properties/edit/1'
        });
      }
      
      // Landlord
      if (user.username === 'samuel_landlord' || user.email === 'samuel@wubland.com') {
        notifications.push({
          uuid: randomUUID(),
          title: 'Rent Payment Received',
          message: 'Monthly rent payment of ETB 20,000 has been received from Liya Gebre',
          type: 'payment',
          priority: 'low',
          actionUrl: '/landlord/payments'
        });
      }
      
      // Renter
      if (user.username === 'liya_renter' || user.email === 'liya@wubland.com') {
        notifications.push({
          uuid: randomUUID(),
          title: 'Rent Due Reminder',
          message: 'Your rent payment of ETB 20,000 is due in 5 days',
          type: 'reminder',
          priority: 'medium',
          actionUrl: '/renter/payments'
        });
      }
      
      // Regular User
      if (user.username === 'tigist_user' || user.email === 'tigist@wubland.com') {
        notifications.push({
          uuid: randomUUID(),
          title: 'Complete Your Profile',
          message: 'Complete your profile to get personalized property recommendations',
          type: 'profile',
          priority: 'low',
          actionUrl: '/profile/edit'
        });
      }
      
      // Insert notifications for this user
      for (const notif of notifications) {
        await connection.execute(
          `INSERT INTO notifications (
            notification_uuid, user_id, title, message, notification_type,
            is_read, is_archived, priority, action_url,
            created_at, sent_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            notif.uuid,
            user.id,
            notif.title,
            notif.message,
            notif.type,
            false, // is_read
            false, // is_archived
            notif.priority,
            notif.actionUrl || null,
            now,
            now
          ]
        );
      }
      
      console.log(`✅ Created ${notifications.length} notifications for ${user.username} (${user.role})`);
      totalNotifications += notifications.length;
    }
    
    // 4. Create system-wide notifications
    console.log('📢 Creating system-wide notifications...');
    
    const systemNotifications = [
      {
        title: 'Platform Maintenance',
        message: 'The platform will undergo scheduled maintenance on Sunday, 2 AM - 4 AM EAT',
        type: 'system',
        priority: 'medium',
        roles: ['super_admin', 'admin', 'support_admin', 'support_lead', 'support_agent']
      },
      {
        title: 'New Feature: Advanced Search',
        message: 'Try our new advanced property search with filters for amenities and neighborhood features',
        type: 'feature_update',
        priority: 'low',
        roles: ['buyer', 'seller', 'landlord', 'renter', 'user']
      },
      {
        title: 'Commission Rate Update',
        message: 'New commission rates effective next quarter. Please review the updated policy.',
        type: 'policy_update',
        priority: 'medium',
        roles: ['internal_broker', 'external_broker']
      }
    ];
    
    let systemNotificationsCount = 0;
    
    for (const sysNotif of systemNotifications) {
      // Build dynamic SQL query for IN clause
      const placeholders = sysNotif.roles.map(() => '?').join(',');
      const query = `SELECT id FROM users WHERE role IN (${placeholders}) AND status = 'active'`;
      
      // Get user IDs for the specified roles
      const [usersToNotify] = await connection.execute(query, sysNotif.roles);
      
      console.log(`📨 Sending "${sysNotif.title}" to ${usersToNotify.length} users with roles: ${sysNotif.roles.join(', ')}`);
      
      for (const user of usersToNotify) {
        await connection.execute(
          `INSERT INTO notifications (
            notification_uuid, user_id, title, message, notification_type,
            priority, created_at, sent_at, is_read, is_archived
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            user.id,
            sysNotif.title,
            sysNotif.message,
            sysNotif.type,
            sysNotif.priority,
            now,
            now,
            false,
            false
          ]
        );
      }
      
      systemNotificationsCount += usersToNotify.length;
    }
    
    console.log('🎉 Notification reset complete!');
    console.log(`📊 Total notifications created: ${totalNotifications + systemNotificationsCount}`);
    
    // 5. Show detailed summary
    const [summary] = await connection.execute(`
      SELECT 
        notification_type,
        priority,
        COUNT(*) as count,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM notifications 
      GROUP BY notification_type, priority
      ORDER BY priority DESC, notification_type
    `);
    
    console.log('\n📊 Detailed Notification Summary:');
    console.table(summary);
    
    // Show breakdown by user role
    const [roleSummary] = await connection.execute(`
      SELECT 
        u.role,
        COUNT(n.id) as notification_count,
        SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END) as unread_count,
        GROUP_CONCAT(DISTINCT n.notification_type ORDER BY n.notification_type) as notification_types
      FROM users u
      LEFT JOIN notifications n ON u.id = n.user_id
      WHERE u.status = 'active'
      GROUP BY u.role
      ORDER BY notification_count DESC
    `);
    
    console.log('\n👥 Notifications by User Role:');
    console.table(roleSummary);
    
    // Show recent notifications with details
    const [recentNotifications] = await connection.execute(`
      SELECT 
        u.username,
        u.role,
        n.title,
        n.notification_type,
        n.priority,
        n.is_read,
        DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i') as created,
        CASE 
          WHEN LENGTH(n.message) > 40 THEN CONCAT(SUBSTRING(n.message, 1, 40), '...')
          ELSE n.message
        END as message_preview
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📝 Recent Notifications (Last 10):');
    console.table(recentNotifications);
    
    // Show unread notifications count
    const [unreadStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count,
        SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count,
        ROUND((SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as unread_percentage
      FROM notifications
    `);
    
    console.log('\n📈 Notification Statistics:');
    console.table(unreadStats);
    
    // Show top 5 users with most notifications
    const [topUsers] = await connection.execute(`
      SELECT 
        u.username,
        u.role,
        COUNT(n.id) as notification_count,
        SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM users u
      LEFT JOIN notifications n ON u.id = n.user_id
      GROUP BY u.id
      ORDER BY notification_count DESC
      LIMIT 5
    `);
    
    console.log('\n🏆 Top 5 Users with Most Notifications:');
    console.table(topUsers);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    
    if (error.sql) {
      console.error('SQL Query:', error.sql);
      console.error('SQL Parameters:', error.parameters);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
    process.exit();
  }
}

resetNotifications();