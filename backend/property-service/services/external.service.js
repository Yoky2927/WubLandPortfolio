import axios from 'axios';

class ExternalService {
  constructor() {
    this.userService = axios.create({
      baseURL: process.env.USER_SERVICE_URL,
      timeout: 5000
    });

    this.transactionService = axios.create({
      baseURL: process.env.TRANSACTION_SERVICE_URL,
      timeout: 5000
    });

    this.analysisService = axios.create({
      baseURL: process.env.ANALYSIS_SERVICE_URL,
      timeout: 5000
    });
  }

  // User Service Methods
  async verifyUser(userId) {
    try {
      const response = await this.userService.get(`/api/users/${userId}/verify`);
      return response.data;
    } catch (error) {
      console.error('User service verification failed:', error.message);
      return null;
    }
  }

  async getUser(userId) {
    try {
      const response = await this.userService.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user:', error.message);
      return null;
    }
  }

  async getUserRole(userId) {
    try {
      const response = await this.userService.get(`/api/users/${userId}/role`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user role:', error.message);
      return null;
    }
  }

  // Transaction Service Methods
  async createPropertyTransaction(propertyData, user) {
    try {
      const transactionData = {
        property_id: propertyData.id,
        property_uuid: propertyData.property_uuid,
        transaction_type: propertyData.listing_type === 'sale' ? 'sale' : 'rental',
        seller_user_id: propertyData.owner_user_id,
        broker_id: propertyData.assigned_broker_id,
        property_price: propertyData.price,
        initiated_by: user.id
      };

      const response = await this.transactionService.post('/api/transactions', transactionData);
      return response.data;
    } catch (error) {
      console.error('Failed to create transaction:', error.message);
      return null;
    }
  }

  async getPropertyTransactions(propertyId) {
    try {
      const response = await this.transactionService.get(`/api/transactions/property/${propertyId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch property transactions:', error.message);
      return null;
    }
  }

  // Analysis Service Methods
  async logPropertyView(propertyId, userId) {
    try {
      const data = {
        property_id: propertyId,
        user_id: userId,
        action: 'view',
        timestamp: new Date().toISOString()
      };

      await this.analysisService.post('/api/analytics/property-views', data);
    } catch (error) {
      console.error('Failed to log property view:', error.message);
    }
  }

  async logPropertyActivity(activityData) {
    try {
      await this.analysisService.post('/api/analytics/property-activity', {
        ...activityData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log property activity:', error.message);
    }
  }

  async getPropertyAnalytics(propertyId, period = '30d') {
    try {
      const response = await this.analysisService.get(
        `/api/analytics/properties/${propertyId}?period=${period}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch property analytics:', error.message);
      return null;
    }
  }

  async getMarketTrends(city, propertyType) {
    try {
      const params = {};
      if (city) params.city = city;
      if (propertyType) params.property_type = propertyType;

      const response = await this.analysisService.get('/api/analytics/market-trends', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch market trends:', error.message);
      return null;
    }
  }

  // Support Service Methods (if needed)
  async createSupportTicket(ticketData) {
    try {
      const response = await axios.post(
        `${process.env.SUPPORT_SERVICE_URL}/api/tickets`,
        ticketData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create support ticket:', error.message);
      return null;
    }
  }

  // Bulk operations for brokers
  async bulkCreateProperties(properties, brokerId) {
    try {
      const response = await this.userService.post('/api/brokers/bulk-verify', {
        broker_id: brokerId,
        properties_count: properties.length
      });
      
      if (!response.data.success) {
        throw new Error('Bulk verification failed');
      }

      // Process properties in batches
      const batchSize = 10;
      const results = [];

      for (let i = 0; i < properties.length; i += batchSize) {
        const batch = properties.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (property) => {
            try {
              // Add broker assignment
              property.assigned_broker_id = brokerId;
              const result = await PropertyModel.create(property);
              return { success: true, data: result };
            } catch (error) {
              return { success: false, error: error.message };
            }
          })
        );
        results.push(...batchResults);
      }

      return {
        success: true,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      console.error('Bulk create failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ExternalService();