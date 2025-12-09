// communication-service/scripts/cleanupTestNotifications.js
import db from '../shared/db.js';

async function cleanupTestNotifications() {
  try {
    console.log('🧹 Cleaning up test notifications...');
    
    // Delete notifications from the last hour (for testing)
    const [result] = await db.execute(
      `DELETE FROM notifications WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`
    );
    
    console.log(`✅ Deleted ${result.affectedRows} test notifications`);
    
    // Reset read status on remaining notifications
    const [resetResult] = await db.execute(
      `UPDATE notifications SET is_read = 0 WHERE is_read = 1`
    );
    
    console.log(`✅ Reset ${resetResult.affectedRows} notifications to unread`);
    
    // Show remaining notifications
    const [summary] = await db.execute(`
      SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count,
        notification_type,
        COUNT(*) as type_count
      FROM notifications 
      GROUP BY notification_type
    `);
    
    console.log('\n📊 Current Notification Status:');
    console.table(summary);
    
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
  } finally {
    process.exit();
  }
}

cleanupTestNotifications();