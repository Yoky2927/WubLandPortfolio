// backend/property-service/controllers/buyerController.js - UPDATED VERSION
import PropertyModel from "../models/property.model.js";

class BuyerController {
  // ============================================
  // 1. GET SAVED PROPERTIES - UPDATED
  // ============================================
  async getSavedProperties(req, res) {
    try {
      console.log('📚 BuyerController.getSavedProperties called');
      
      // Get user ID from your auth middleware (req.user.id)
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('❌ No user ID found in request - User:', req.user);
        return res.status(401).json({
          success: false,
          message: "Authentication required - No user ID found",
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Authenticated user ID from middleware: ${userId}`);
      const { page = 1, limit = 20 } = req.query;

      console.log(`📚 Getting saved properties for user ${userId}`);

      // Call the model method
      const result = await PropertyModel.getSavedProperties(userId, page, limit);

      console.log(`✅ Found ${result.properties?.length || 0} saved properties for user ${userId}`);

      res.json({
        success: true,
        message: "Saved properties retrieved successfully",
        data: result.properties,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Error getting saved properties:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get saved properties",
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================
  // 2. TOGGLE SAVE/UNSAVE PROPERTY - UPDATED
  // ============================================
  async toggleSaveProperty(req, res) {
    try {
      console.log('📝 BuyerController.toggleSaveProperty called');
      console.log('📝 Request method:', req.method);
      console.log('📝 Request params:', req.params);
      console.log('📝 User from auth middleware:', req.user);
      
      // Get user ID from your auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('❌ No user ID in auth middleware');
        return res.status(401).json({
          success: false,
          message: "Authentication required - No user ID found"
        });
      }
      
      console.log(`✅ Authenticated user ID: ${userId}`);
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: "Property ID is required"
        });
      }

      console.log(`💾 User ${userId} toggling save for property ${propertyId}`);
      console.log(`💾 HTTP Method: ${req.method}`);

      // Determine if saving or unsaving based on method
      let shouldSave = true;
      
      if (req.method === 'DELETE') {
        shouldSave = false;
        console.log('💾 Method is DELETE, will unsave property');
      } else if (req.method === 'POST') {
        // For POST, check current status
        console.log('💾 POST request, checking current status...');
        const isCurrentlySaved = await PropertyModel.isSavedByUser(propertyId, userId);
        shouldSave = !isCurrentlySaved;
        console.log(`💾 Currently saved: ${isCurrentlySaved}, will ${shouldSave ? 'save' : 'unsave'}`);
      }

      console.log(`💾 Final decision: ${shouldSave ? 'SAVE' : 'UNSAVE'}`);

      // Call the model method
      const result = await PropertyModel.toggleSave(propertyId, userId, shouldSave);

      if (!result.success) {
        console.log(`ℹ️ ${result.message}`);
      }

      const message = shouldSave ? "Property saved successfully" : "Property removed from saved properties";
      
      console.log(`✅ ${message}, savesCount: ${result.savesCount}, userId: ${userId}`);

      res.json({
        success: true,
        message: message,
        data: {
          saved: result.saved,
          savesCount: result.savesCount,
          userId: userId,
          propertyId: propertyId
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Error toggling save property:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update saved status",
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================
  // 3. CHECK IF PROPERTY IS SAVED - UPDATED
  // ============================================
  async checkSavedStatus(req, res) {
    try {
      console.log('🔍 BuyerController.checkSavedStatus called');
      console.log('🔍 User from auth middleware:', req.user);
      
      // Get user ID from your auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('❌ No user ID in auth middleware');
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      console.log(`✅ Authenticated user ID: ${userId}`);
      const { propertyId } = req.params;

      console.log(`🔍 Checking if property ${propertyId} is saved by user ${userId}`);

      const isSaved = await PropertyModel.isSavedByUser(propertyId, userId);

      console.log(`✅ Property ${propertyId} is ${isSaved ? 'saved' : 'not saved'} by user ${userId}`);

      res.json({
        success: true,
        message: "Saved status checked successfully",
        data: { 
          isSaved,
          userId: userId,
          propertyId: propertyId
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Error checking saved status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check saved status",
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================
  // 4. GET RECOMMENDED PROPERTIES - UPDATED
  // ============================================
  async getRecommendedProperties(req, res) {
    try {
      console.log('🤖 BuyerController.getRecommendedProperties called');
      console.log('🤖 User from auth middleware:', req.user);
      
      // Get user ID from your auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('❌ No user ID in auth middleware');
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      console.log(`✅ Authenticated user ID: ${userId}`);
      const { limit = 6 } = req.query;

      console.log(`🤖 Getting recommended properties for user ${userId}, limit: ${limit}`);

      const properties = await PropertyModel.getRecommendedProperties(userId, parseInt(limit));

      console.log(`✅ Found ${properties.length} recommended properties for user ${userId}`);

      res.json({
        success: true,
        message: "Recommended properties retrieved successfully",
        data: properties,
        userId: userId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Error getting recommended properties:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get recommended properties",
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================
  // 5. TRACK PROPERTY VIEW - UPDATED
  // ============================================
  async trackPropertyView(req, res) {
    try {
      console.log('👁️ BuyerController.trackPropertyView called');
      console.log('👁️ User from auth middleware:', req.user);
      
      // Get user ID from your auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('❌ No user ID in auth middleware');
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      console.log(`✅ Authenticated user ID: ${userId}`);
      const { propertyId } = req.params;

      console.log(`👁️ User ${userId} viewing property ${propertyId}`);

      const result = await PropertyModel.trackView(parseInt(propertyId), userId);

      res.json({
        success: result.success,
        message: result.message || "View tracked successfully",
        data: {
          viewsCount: result.viewsCount,
          userId: userId
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Error tracking property view:", error);
      res.status(200).json({
        success: false,
        message: "View tracking failed, but property loaded",
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================
  // 6. GET PROPERTY STATS - UPDATED
  // ============================================
  async getPropertyStats(req, res) {
    try {
      console.log('📊 BuyerController.getPropertyStats called');
      console.log('📊 User from auth middleware:', req.user);
      
      // Get user ID from your auth middleware (if authenticated)
      const userId = req.user?.id;
      
      const { propertyId } = req.params;

      console.log(`📊 Getting stats for property ${propertyId} for user ${userId || 'anonymous'}`);

      if (isNaN(propertyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid property ID",
          timestamp: new Date().toISOString()
        });
      }

      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found",
          timestamp: new Date().toISOString()
        });
      }

      // Calculate days listed
      const createdDate = new Date(property.created_at);
      const today = new Date();
      const daysListed = Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24));

      // Check if user saved this property
      const isSaved = userId ? await PropertyModel.isSavedByUser(propertyId, userId) : false;

      const stats = {
        views: property.views_count || 0,
        saves: property.saves_count || 0,
        daysListed: daysListed,
        isSaved: isSaved,
        price: property.price,
        currency: property.currency,
        listingType: property.listing_type,
        propertyType: property.property_type,
        beds: property.beds,
        baths: property.baths,
        sqft: property.sqft,
        userId: userId || null
      };

      console.log(`✅ Retrieved stats for property ${propertyId}`);

      res.json({
        success: true,
        message: "Property stats retrieved successfully",
        data: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ Error getting property stats:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================
  // 7. ADD TO SAVED USERS - UPDATED
  // ============================================
  async addToSavedUsers(req, res) {
    try {
      console.log('➕ BuyerController.addToSavedUsers called');
      console.log('➕ User from auth middleware:', req.user);
      
      // Get user ID from your auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('❌ No user ID in auth middleware');
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      console.log(`✅ Authenticated user ID: ${userId}`);
      const { propertyId } = req.params;

      console.log(`➕ Adding user ${userId} to saved_by_users for property ${propertyId}`);

      const result = await PropertyModel.toggleSave(propertyId, userId, true);

      res.json({
        success: result.success,
        message: "User added to saved properties",
        data: {
          savesCount: result.savesCount,
          saved: result.saved,
          userId: userId
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Error adding to saved users:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================
  // 8. REMOVE FROM SAVED USERS - UPDATED
  // ============================================
  async removeFromSavedUsers(req, res) {
    try {
      console.log('➖ BuyerController.removeFromSavedUsers called');
      console.log('➖ User from auth middleware:', req.user);
      
      // Get user ID from your auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        console.error('❌ No user ID in auth middleware');
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      console.log(`✅ Authenticated user ID: ${userId}`);
      const { propertyId } = req.params;

      console.log(`➖ Removing user ${userId} from saved_by_users for property ${propertyId}`);

      const result = await PropertyModel.toggleSave(propertyId, userId, false);

      res.json({
        success: result.success,
        message: "User removed from saved properties",
        data: {
          savesCount: result.savesCount,
          saved: result.saved,
          userId: userId
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Error removing from saved users:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================
  // 9. GET SAVED PROPERTIES COUNT - NEW HELPER
  // ============================================
  async getSavedCount(req, res) {
    try {
      console.log('🔢 BuyerController.getSavedCount called');
      
      // Get user ID from your auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        return res.json({
          success: true,
          data: {
            count: 0,
            userId: null
          }
        });
      }

      // Get just the count for performance
      const result = await PropertyModel.getSavedProperties(userId, 1, 1);
      
      res.json({
        success: true,
        data: {
          count: result.pagination?.total || 0,
          userId: userId
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Error getting saved count:", error);
      res.json({
        success: false,
        data: {
          count: 0,
          error: error.message
        }
      });
    }
  }
}

// Export as a singleton instance
export default new BuyerController();