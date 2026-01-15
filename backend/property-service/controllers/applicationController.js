// backend/property-service/controllers/applicationController.js
import PropertyApplicationModel from "../models/propertyApplication.model.js";

class ApplicationController {
  // Create application
  async createApplication(req, res) {
    try {
      const userId = req.user.id;
      const applicationData = {
        ...req.body,
        user_id: userId,
        status: 'submitted',
        submitted_at: new Date()
      };
      
      // Validate required fields
      if (!applicationData.property_id) {
        return res.status(400).json({
          success: false,
          message: "Property ID is required"
        });
      }
      
      const application = await PropertyApplicationModel.create(applicationData);
      
      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: application
      });
      
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to submit application"
      });
    }
  }
  
  // Get user's applications
  async getUserApplications(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 20, 
        status, 
        application_type 
      } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (application_type) filters.application_type = application_type;
      
      const result = await PropertyApplicationModel.findByUserId(
        userId,
        filters,
        parseInt(page),
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: result.applications,
        pagination: result.pagination
      });
      
    } catch (error) {
      console.error("Error getting user applications:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get applications"
      });
    }
  }
  
  // Get application by ID
  async getApplicationById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const application = await PropertyApplicationModel.findById(parseInt(id));
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found"
        });
      }
      
      // Check if user owns this application
      if (application.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view this application"
        });
      }
      
      res.json({
        success: true,
        data: application
      });
      
    } catch (error) {
      console.error("Error getting application:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get application"
      });
    }
  }
  
  // Update application
  async updateApplication(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      // Check if user owns this application
      const application = await PropertyApplicationModel.findById(parseInt(id));
      if (!application || application.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: "Application not found or access denied"
        });
      }
      
      // Only allow certain fields to be updated
      const allowedUpdates = [
        'status', 'message', 'offered_amount', 'cover_letter'
      ];
      
      const updates = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (allowedUpdates.includes(key)) {
          updates[key] = value;
        }
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields to update"
        });
      }
      
      const updatedApplication = await PropertyApplicationModel.update(
        parseInt(id),
        updates
      );
      
      res.json({
        success: true,
        message: "Application updated successfully",
        data: updatedApplication
      });
      
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update application"
      });
    }
  }
  
  // Delete application
  async deleteApplication(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      // Check if user owns this application
      const application = await PropertyApplicationModel.findById(parseInt(id));
      if (!application || application.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: "Application not found or access denied"
        });
      }
      
      const deleted = await PropertyApplicationModel.delete(parseInt(id));
      
      if (deleted) {
        res.json({
          success: true,
          message: "Application deleted successfully"
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Application not found"
        });
      }
      
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete application"
      });
    }
  }
  
  // Get application statistics
  async getApplicationStats(req, res) {
    try {
      const userId = req.user.id;
      
      const stats = await PropertyApplicationModel.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error("Error getting application stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get application statistics"
      });
    }
  }
}

export default new ApplicationController();