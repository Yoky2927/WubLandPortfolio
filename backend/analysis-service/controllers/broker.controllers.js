// controllers/broker.controllers.js
import { fetchServiceData, extractArrayFromResponse } from '../services/index.js';

// Get broker analytics (comprehensive)
export const getBrokerAnalytics = async (req, res) => {
  try {
    const { brokerId } = req.params;
    const { timeframe = 'monthly' } = req.query;
    
    console.log(`📊 Broker analytics for ID ${brokerId}, timeframe: ${timeframe}`);

    // Fetch all data from services
    const [propertiesResponse, transactionsResponse, usersResponse, todosResponse] = await Promise.all([
      fetchServiceData("PROPERTY", "/api/properties"),
      fetchServiceData("TRANSACTION", "/api/transactions"),
      fetchServiceData("USER", "/api/users"),
      fetchServiceData("TODO", "/api/todos")
    ]);
    
    // Extract arrays from responses
    const properties = extractArrayFromResponse(propertiesResponse, 'properties');
    const transactions = extractArrayFromResponse(transactionsResponse, 'transactions');
    const users = extractArrayFromResponse(usersResponse, 'users');
    const todos = extractArrayFromResponse(todosResponse, 'todos');
    
    console.log(`📊 Property count: ${properties.length}, Transaction count: ${transactions.length}, User count: ${users.length}`);
    
    // Filter broker's data
    const brokerProperties = properties.filter(p => {
      const brokerIdNum = parseInt(brokerId);
      const assignedBroker = p.assigned_broker_id || p.broker_id || p.assigned_to;
      return assignedBroker === brokerIdNum;
    });
    
    const brokerTransactions = transactions.filter(t => {
      const brokerIdNum = parseInt(brokerId);
      const transactionBroker = t.broker_id || t.assigned_broker_id || t.assigned_to;
      return transactionBroker === brokerIdNum;
    });
    
    const brokerTodos = todos.filter(t => {
      const brokerIdNum = parseInt(brokerId);
      const todoAssigned = t.assigned_to || t.user_id;
      return todoAssigned === brokerIdNum;
    });
    
    const broker = users.find(u => u.id === parseInt(brokerId));
    
    // Calculate analytics
    const analyticsData = {
      // Basic stats
      brokerId: parseInt(brokerId),
      totalListings: brokerProperties.length,
      pendingReviews: brokerProperties.filter(p => {
        const status = p.property_status || p.status;
        return status === 'pending_review' || status === 'draft' || status === 'pending';
      }).length,
      approvedListings: brokerProperties.filter(p => {
        const status = p.property_status || p.status;
        return status === 'approved' || status === 'active';
      }).length,
      rejectedListings: brokerProperties.filter(p => {
        const status = p.property_status || p.status;
        return status === 'rejected' || status === 'inactive';
      }).length,
      
      // Transaction stats
      totalTransactions: brokerTransactions.length,
      completedTransactions: brokerTransactions.filter(t => {
        const status = t.transaction_status || t.status;
        return status === 'completed' || status === 'closed';
      }).length,
      pendingTransactions: brokerTransactions.filter(t => {
        const status = t.transaction_status || t.status;
        return status === 'pending' || status === 'under_contract';
      }).length,
      
      // Revenue
      totalRevenue: brokerTransactions
        .filter(t => {
          const status = t.transaction_status || t.status;
          return status === 'completed' || status === 'closed';
        })
        .reduce((sum, t) => {
          const commission = parseFloat(t.commission_amount) || 0;
          const price = parseFloat(t.final_price) || parseFloat(t.offer_price) || parseFloat(t.price) || 0;
          return sum + (commission || price * 0.025);
        }, 0),
      
      // Performance metrics
      responseRate: broker?.response_rate || 85,
      avgResponseTime: broker?.avg_response_time || "2h",
      activeClients: [...new Set(brokerTransactions.map(t => 
        t.buyer_user_id || t.seller_user_id
      ).filter(id => id))].length,
      
      // Property breakdown
      propertyStats: {
        approved: brokerProperties.filter(p => {
          const status = p.property_status || p.status;
          return status === 'approved' || status === 'active';
        }).length,
        pending: brokerProperties.filter(p => {
          const status = p.property_status || p.status;
          return status === 'pending_review' || status === 'draft' || status === 'pending';
        }).length,
        rejected: brokerProperties.filter(p => {
          const status = p.property_status || p.status;
          return status === 'rejected' || status === 'inactive';
        }).length,
        draft: brokerProperties.filter(p => {
          const status = p.property_status || p.status;
          return status === 'draft';
        }).length,
      },
      
      // Transaction breakdown
      transactionStats: {
        total: brokerTransactions.length,
        completed: brokerTransactions.filter(t => {
          const status = t.transaction_status || t.status;
          return status === 'completed' || status === 'closed';
        }).length,
        pending: brokerTransactions.filter(t => {
          const status = t.transaction_status || t.status;
          return status === 'pending' || status === 'under_contract';
        }).length,
        avgCommission: brokerTransactions.length > 0
          ? Math.round(brokerTransactions.reduce((sum, t) => {
            const commission = parseFloat(t.commission_amount) || 0;
            return sum + commission;
          }, 0) / brokerTransactions.length)
          : 0,
      },
      
      // Client stats
      clientStats: {
        totalClients: [...new Set(brokerTransactions.map(t => 
          t.buyer_user_id || t.seller_user_id
        ).filter(id => id))].length,
        activeClients: [...new Set(brokerTransactions.filter(t => {
          const status = t.transaction_status || t.status;
          return ['pending', 'under_contract', 'draft', 'offer_pending', 'offer_accepted'].includes(status);
        }).map(t => t.buyer_user_id || t.seller_user_id).filter(id => id))].length,
        newClients: 3, // Placeholder - calculate based on timeframe
        retentionRate: 87,
      },
      
      // Performance metrics
      performance: {
        responseRate: broker?.response_rate || 85,
        approvalRate: brokerProperties.length > 0 
          ? Math.round((brokerProperties.filter(p => {
            const status = p.property_status || p.status;
            return status === 'approved' || status === 'active';
          }).length / brokerProperties.length) * 100)
          : 0,
        clientSatisfaction: 90, // Placeholder
        avgCommissionRate: 2.5,
      },
      
      // Chart data
      revenueTrend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [45000, 52000, 48000, 55000, 60000, 70000],
      },
      
      // Recent activities
      recentActivities: [
        ...brokerProperties.slice(-5).map(p => ({
          id: p.id,
          type: 'property',
          action: 'Property Assigned',
          detail: `${p.title} - ${p.property_status || p.status}`,
          time: new Date(p.created_at || p.updated_at || new Date()).toLocaleDateString(),
          icon: 'Home',
        })),
        ...brokerTransactions.slice(-5).map(t => ({
          id: t.id,
          type: 'transaction',
          action: 'Transaction Update',
          detail: `ETB ${((t.final_price || t.offer_price || t.price || 0)).toLocaleString()} - ${t.transaction_status || t.status}`,
          time: new Date(t.created_at || t.updated_at || new Date()).toLocaleDateString(),
          icon: 'CreditCard',
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10),
      
      // Metadata
      timeframe,
      generatedAt: new Date().toISOString(),
      brokerInfo: broker ? {
        name: `${broker.first_name || ''} ${broker.last_name || ''}`.trim() || broker.username,
        email: broker.email,
        role: broker.role,
        brokerType: broker.broker_type || broker.user_type,
      } : null
    };
    
    res.json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error("❌ Error in getBrokerAnalytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch broker analytics",
      message: error.message
    });
  }
};

// Get broker statistics (quick stats)
export const getBrokerStatistics = async (req, res) => {
  try {
    const { brokerId } = req.params;
    
    console.log(`📈 Quick stats for broker ${brokerId}`);

    const [propertiesResponse, transactionsResponse] = await Promise.all([
      fetchServiceData("PROPERTY", "/api/properties"),
      fetchServiceData("TRANSACTION", "/api/transactions")
    ]);
    
    const properties = extractArrayFromResponse(propertiesResponse, 'properties');
    const transactions = extractArrayFromResponse(transactionsResponse, 'transactions');
    
    const brokerProperties = properties.filter(p => {
      const brokerIdNum = parseInt(brokerId);
      const assignedBroker = p.assigned_broker_id || p.broker_id || p.assigned_to;
      return assignedBroker === brokerIdNum;
    });
    
    const brokerTransactions = transactions.filter(t => {
      const brokerIdNum = parseInt(brokerId);
      const transactionBroker = t.broker_id || t.assigned_broker_id || t.assigned_to;
      return transactionBroker === brokerIdNum;
    });
    
    const stats = {
      brokerId: parseInt(brokerId),
      totalListings: brokerProperties.length,
      pendingReviews: brokerProperties.filter(p => {
        const status = p.property_status || p.status;
        return status === 'pending_review' || status === 'draft' || status === 'pending';
      }).length,
      totalRevenue: brokerTransactions
        .filter(t => {
          const status = t.transaction_status || t.status;
          return status === 'completed' || status === 'closed';
        })
        .reduce((sum, t) => {
          const commission = parseFloat(t.commission_amount) || 0;
          const price = parseFloat(t.final_price) || parseFloat(t.offer_price) || parseFloat(t.price) || 0;
          return sum + (commission || price * 0.025);
        }, 0),
      totalTransactions: brokerTransactions.length,
      activeClients: [...new Set(brokerTransactions.map(t => 
        t.buyer_user_id || t.seller_user_id
      ).filter(id => id))].length,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error("❌ Error in getBrokerStatistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch broker statistics",
      message: error.message
    });
  }
};

// Get broker properties
export const getBrokerProperties = async (req, res) => {
  try {
    const { brokerId, status = 'pending', page = 1, limit = 20 } = req.query;
    
    const propertiesResponse = await fetchServiceData("PROPERTY", "/api/properties");
    const usersResponse = await fetchServiceData("USER", "/api/users");
    
    const properties = extractArrayFromResponse(propertiesResponse, 'properties');
    const users = extractArrayFromResponse(usersResponse, 'users');
    
    let brokerProperties = properties;
    
    if (brokerId) {
      const brokerIdNum = parseInt(brokerId);
      brokerProperties = properties.filter(p => {
        const assignedBroker = p.assigned_broker_id || p.broker_id || p.assigned_to;
        return assignedBroker === brokerIdNum;
      });
      
      // Filter by status
      switch (status) {
        case 'pending':
          brokerProperties = brokerProperties.filter(p => {
            const propStatus = p.property_status || p.status;
            return propStatus === 'pending_review' || propStatus === 'draft' || propStatus === 'pending';
          });
          break;
        case 'approved':
          brokerProperties = brokerProperties.filter(p => {
            const propStatus = p.property_status || p.status;
            return propStatus === 'approved' || propStatus === 'active';
          });
          break;
        case 'rejected':
          brokerProperties = brokerProperties.filter(p => {
            const propStatus = p.property_status || p.status;
            return propStatus === 'rejected' || propStatus === 'inactive';
          });
          break;
      }
    }
    
    // Transform data
    const transformedProperties = brokerProperties.map(property => {
      const owner = users.find(u => u.id === property.owner_user_id);
      const assignedBroker = users.find(u => u.id === property.assigned_broker_id);
      
      return {
        id: property.id,
        property_uuid: property.property_uuid,
        title: property.title,
        description: property.description,
        property_type: property.property_type,
        status: property.property_status || property.status,
        address: property.address,
        city: property.city,
        price: property.price,
        currency: property.currency,
        listing_type: property.listing_type,
        owner_user_id: property.owner_user_id,
        assigned_broker_id: property.assigned_broker_id,
        images: property.images || [],
        beds: property.beds,
        baths: property.baths,
        sqft: property.sqft,
        created_at: property.created_at,
        updated_at: property.updated_at,
        owner_name: owner ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() : 'Unknown Owner',
        broker_name: assignedBroker ? `${assignedBroker.first_name || ''} ${assignedBroker.last_name || ''}`.trim() : 'Unassigned'
      };
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedProperties = transformedProperties.slice(startIndex, startIndex + limit);
    
    res.json({
      success: true,
      data: paginatedProperties,
      pagination: {
        total: transformedProperties.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(transformedProperties.length / limit)
      }
    });
    
  } catch (error) {
    console.error("❌ Error in getBrokerProperties:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch broker properties",
      message: error.message
    });
  }
};

// Get broker clients
export const getBrokerClients = async (req, res) => {
  try {
    const { brokerId } = req.params;
    
    const [usersResponse, transactionsResponse, propertiesResponse] = await Promise.all([
      fetchServiceData("USER", "/api/users"),
      fetchServiceData("TRANSACTION", "/api/transactions"),
      fetchServiceData("PROPERTY", "/api/properties")
    ]);
    
    const users = extractArrayFromResponse(usersResponse, 'users');
    const transactions = extractArrayFromResponse(transactionsResponse, 'transactions');
    const properties = extractArrayFromResponse(propertiesResponse, 'properties');
    
    const brokerIdNum = parseInt(brokerId);
    
    const brokerProperties = properties.filter(p => {
      const assignedBroker = p.assigned_broker_id || p.broker_id || p.assigned_to;
      return assignedBroker === brokerIdNum;
    });
    
    const brokerTransactions = transactions.filter(t => {
      const transactionBroker = t.broker_id || t.assigned_broker_id || t.assigned_to;
      return transactionBroker === brokerIdNum;
    });
    
    // Get unique client IDs
    const clientIds = [...new Set([
      ...brokerProperties.map(p => p.owner_user_id).filter(id => id),
      ...brokerTransactions.map(t => t.buyer_user_id || t.seller_user_id).filter(id => id)
    ])];
    
    const clients = clientIds.map(clientId => {
      const user = users.find(u => u.id === clientId);
      if (!user) return null;
      
      const clientProperties = brokerProperties.filter(p => p.owner_user_id === clientId);
      const clientTransactions = brokerTransactions.filter(t => 
        (t.buyer_user_id === clientId || t.seller_user_id === clientId)
      );
      
      return {
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        email: user.email,
        phone: user.phone_number || user.phone,
        role: user.role,
        total_properties: clientProperties.length,
        active_transactions: clientTransactions.filter(t => {
          const status = t.transaction_status || t.status;
          return ['pending', 'under_contract', 'draft'].includes(status);
        }).length,
        completed_transactions: clientTransactions.filter(t => {
          const status = t.transaction_status || t.status;
          return ['completed', 'closed'].includes(status);
        }).length,
        last_activity: clientTransactions.length > 0 
          ? clientTransactions.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0].updated_at
          : null
      };
    }).filter(client => client !== null);
    
    res.json({
      success: true,
      data: clients
    });
    
  } catch (error) {
    console.error("❌ Error in getBrokerClients:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch broker clients",
      message: error.message
    });
  }
};

// Handle property action
export const handlePropertyAction = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { action, brokerId, notes } = req.body;
    
    console.log(`⚡ Property ${action} action by broker ${brokerId}`);
    
    // This would normally call the property service API
    // For now, return success
    res.json({
      success: true,
      message: `Property ${action}d successfully`,
      data: {
        propertyId,
        action,
        brokerId,
        notes,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error("❌ Error in handlePropertyAction:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process property action",
      message: error.message
    });
  }
};