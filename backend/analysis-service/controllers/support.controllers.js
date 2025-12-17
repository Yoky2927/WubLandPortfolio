// controllers/support.controllers.js
import { fetchServiceData } from '../services/index.js';

// Support agent dashboard analytics
export const getSupportAnalytics = async (req, res) => {
  try {
    const { supportAgentId, timeframe = 'weekly' } = req.query;
    
    console.log(`🛟 Support analytics for agent ${supportAgentId || 'all'}, timeframe: ${timeframe}`);

    const [users, properties, transactions, todos] = await Promise.all([
      fetchServiceData("USER", "/api/users"),
      fetchServiceData("PROPERTY", "/api/properties"),
      fetchServiceData("TRANSACTION", "/api/transactions"),
      fetchServiceData("TODO", "/api/todos")
    ]);
    
    // Filter todos for support (if agent ID provided)
    let supportTodos = todos.filter(t => 
      t.category === 'support_tickets' || 
      t.category === 'flagged_content' ||
      t.category === 'user_management'
    );
    
    if (supportAgentId) {
      supportTodos = supportTodos.filter(t => t.assigned_to === parseInt(supportAgentId));
    }
    
    // Get flagged content (simulated)
    const flaggedContent = {
      total: 15,
      pending: 8,
      resolved: 7,
      byType: {
        property: 5,
        user: 7,
        review: 3
      }
    };
    
    // User verification stats
    const verificationStats = {
      pending: users.filter(u => u.verified === false).length,
      verified: users.filter(u => u.verified === true).length,
      brokers: users.filter(u => u.role && u.role.includes('broker')).length
    };
    
    const analyticsData = {
      // Support metrics
      supportMetrics: {
        totalTickets: supportTodos.length,
        pendingTickets: supportTodos.filter(t => t.status === 'pending').length,
        inProgressTickets: supportTodos.filter(t => t.status === 'in_progress').length,
        resolvedTickets: supportTodos.filter(t => t.status === 'completed').length,
        avgResponseTime: "2.5h", // Placeholder
        satisfactionRate: "92%", // Placeholder
      },
      
      // Content moderation
      contentModeration: flaggedContent,
      
      // User verification
      verificationStats,
      
      // Recent support activities
      recentActivities: [
        ...supportTodos.slice(-10).map(todo => ({
          id: todo.id,
          type: 'ticket',
          action: `Ticket ${todo.status === 'completed' ? 'Resolved' : 'Created'}`,
          detail: todo.title,
          time: new Date(todo.created_at).toLocaleDateString(),
          icon: todo.status === 'completed' ? 'CheckCircle' : 'AlertCircle',
          priority: todo.priority
        })),
        ...users
          .filter(u => !u.verified && new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          .slice(-5)
          .map(user => ({
            id: user.id,
            type: 'user',
            action: 'New User Pending Verification',
            detail: `${user.first_name} ${user.last_name} - ${user.role}`,
            time: new Date(user.created_at).toLocaleDateString(),
            icon: 'UserCheck'
          }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15),
      
      // Top issues
      topIssues: [
        { issue: 'Account Verification', count: 12, priority: 'high' },
        { issue: 'Payment Problems', count: 8, priority: 'high' },
        { issue: 'Property Listing Issues', count: 15, priority: 'medium' },
        { issue: 'Broker Verification', count: 5, priority: 'medium' },
        { issue: 'General Inquiries', count: 20, priority: 'low' }
      ],
      
      // Performance metrics
      performance: {
        ticketsResolved: supportTodos.filter(t => t.status === 'completed').length,
        avgResolutionTime: "4.2h", // Placeholder
        firstContactResolution: "85%", // Placeholder
        customerSatisfaction: "4.8/5.0" // Placeholder
      },
      
      // Metadata
      timeframe,
      generatedAt: new Date().toISOString(),
      agentId: supportAgentId || 'all'
    };
    
    res.json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error("❌ Error in getSupportAnalytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch support analytics",
      message: error.message
    });
  }
};

// Get user verification queue
export const getUserVerificationQueue = async (req, res) => {
  try {
    const users = await fetchServiceData("USER", "/api/users");
    
    const pendingVerification = users
      .filter(user => !user.verified && !user.is_email_verified)
      .map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        broker_type: user.broker_type,
        profile_picture: user.profile_picture
      }));
    
    res.json({
      success: true,
      data: pendingVerification,
      count: pendingVerification.length
    });
    
  } catch (error) {
    console.error("❌ Error in getUserVerificationQueue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch verification queue",
      message: error.message
    });
  }
};

// Get flagged content queue
export const getFlaggedContentQueue = async (req, res) => {
  try {
    // This would normally fetch from support service
    // For now, return simulated data
    const flaggedContent = [
      {
        id: 1,
        content_type: 'property',
        content_id: 123,
        reported_by: 'user456',
        reason: 'Inappropriate content',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        content_type: 'user_message',
        content_id: 789,
        reported_by: 'user123',
        reason: 'Harassment',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: flaggedContent,
      count: flaggedContent.length
    });
    
  } catch (error) {
    console.error("❌ Error in getFlaggedContentQueue:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch flagged content",
      message: error.message
    });
  }
};