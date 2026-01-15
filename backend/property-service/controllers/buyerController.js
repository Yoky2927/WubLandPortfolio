// backend/property-service/controllers/buyerController.js - FIXED VERSION
import PropertyModel from "../models/property.model.js";

class BuyerController {
  // Get saved properties
  async getSavedProperties(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      console.log(`📚 [BACKEND] Getting saved properties for user ${userId}`);
      console.log(`👤 User details:`, req.user);

      const result = await PropertyModel.getSavedProperties(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      console.log(`✅ [BACKEND] Found ${result.properties?.length || 0} saved properties`);

      res.json({
        success: true,
        data: result.properties,
        pagination: result.pagination
      });

    } catch (error) {
      console.error("❌ [BACKEND] Error getting saved properties:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get saved properties"
      });
    }
  }

  // Save/unsave property
  async toggleSaveProperty(req, res) {
    try {
      const userId = req.user.id;
      const { propertyId } = req.params;

      console.log(`💾 User ${userId} is toggling save for property ${propertyId}`);
      console.log('📥 Request body:', req.body);
      console.log('📥 Request method:', req.method);

      // Determine save/unsave based on HTTP method or body
      let save = true;

      if (req.method === 'DELETE') {
        save = false;
      } else if (req.method === 'POST') {
        // Check if body has save parameter
        if (req.body && req.body.save !== undefined) {
          save = Boolean(req.body.save);
        } else {
          // Default to true for POST
          save = true;
        }
      }

      console.log(`💾 User ${userId} is ${save ? 'saving' : 'unsaving'} property ${propertyId}`);

      const result = await PropertyModel.toggleSave(
        parseInt(propertyId),
        userId,
        save
      );

      if (result.success) {
        res.json({
          success: true,
          message: save ? "Property saved successfully" : "Property removed from saved list",
          data: {
            savesCount: result.savesCount,
            isSaved: save
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || "Failed to update saved status"
        });
      }

    } catch (error) {
      console.error("Error toggling save property:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update saved status"
      });
    }
  }

  // Get recommended properties
  async getRecommendedProperties(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 6 } = req.query;

      console.log(`🤖 Getting recommended properties for user ${userId}`);

      const properties = await PropertyModel.getRecommendedProperties(
        userId,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: properties
      });

    } catch (error) {
      console.error("Error getting recommended properties:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get recommended properties"
      });
    }
  }

  // Track property view
  async trackPropertyView(req, res) {
    try {
      const userId = req.user.id;
      const { propertyId } = req.params;

      console.log(`👁️ User ${userId} viewing property ${propertyId}`);

      const result = await PropertyModel.trackView(
        parseInt(propertyId),
        userId
      );

      res.json({
        success: result.success,
        message: result.message,
        data: {
          viewsCount: result.viewsCount
        }
      });

    } catch (error) {
      console.error("Error tracking property view:", error);
      res.status(200).json({
        success: false,
        message: "View tracking failed, but property loaded"
      });
    }
  }

  // Check if property is saved
  async checkSavedStatus(req, res) {
    try {
      const userId = req.user.id;
      const { propertyId } = req.params;

      console.log(`🔍 Checking if property ${propertyId} is saved by user ${userId}`);

      const isSaved = await PropertyModel.isSavedByUser(
        parseInt(propertyId),
        userId
      );

      res.json({
        success: true,
        data: { isSaved }
      });

    } catch (error) {
      console.error("Error checking saved status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check saved status"
      });
    }
  }

  // Get property stats - ADD THIS METHOD IF MISSING
  async getPropertyStats(req, res) {
    try {
      const userId = req.user?.id;
      const { propertyId } = req.params;

      console.log(`📊 Getting stats for property ${propertyId}`);

      if (isNaN(propertyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid property ID"
        });
      }

      // You'll need to implement this method in PropertyModel
      // For now, return basic stats
      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found"
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
        currency: property.currency
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error("❌ Error getting property stats:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

// Export as instance
export default new BuyerController();