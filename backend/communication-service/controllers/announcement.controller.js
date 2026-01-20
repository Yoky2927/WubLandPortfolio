// communication-service/controllers/announcement.controller.js
import announcementService from '../services/announcement.service.js';

class AnnouncementController {
  // Create announcement
  createAnnouncement = async (req, res) => {
    try {
      const announcementData = {
        ...req.body,
        created_by_user_id: req.user.id
      };

      const announcement = await announcementService.createAnnouncement(announcementData);

      // Log the creation
      await announcementService.logAnnouncementAction(
        announcement.id,
        'created',
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: announcement
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create announcement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Get all announcements
  getAnnouncements = async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        target: req.query.target,
        search: req.query.search,
        limit: req.query.limit || 20,
        offset: req.query.offset || 0
      };

      const announcements = await announcementService.getAnnouncements(filters);

      res.json({
        success: true,
        data: announcements,
        count: announcements.length
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcements',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Get announcement by ID
  getAnnouncementById = async (req, res) => {
    try {
      const { id } = req.params;
      const announcement = await announcementService.getAnnouncementById(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      res.json({
        success: true,
        data: announcement
      });
    } catch (error) {
      console.error('Error fetching announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Update announcement
  updateAnnouncement = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await announcementService.updateAnnouncement(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Log the update
      await announcementService.logAnnouncementAction(
        id,
        'updated',
        req.user.id,
        { updates: Object.keys(updateData) }
      );

      res.json({
        success: true,
        message: 'Announcement updated successfully'
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update announcement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Delete announcement
  deleteAnnouncement = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await announcementService.deleteAnnouncement(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Log the deletion
      await announcementService.logAnnouncementAction(
        id,
        'deleted',
        req.user.id
      );

      res.json({
        success: true,
        message: 'Announcement deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete announcement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Send announcement
  sendAnnouncement = async (req, res) => {
    try {
      const { id } = req.params;
      const { target, notification_type = 'both' } = req.body;

      const result = await announcementService.sendAnnouncement(
        id,
        target,
        notification_type
      );

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error sending announcement:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send announcement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Schedule announcement
  scheduleAnnouncement = async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduled_for } = req.body;

      const scheduled = await announcementService.scheduleAnnouncement(id, scheduled_for);

      if (!scheduled) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Log the scheduling
      await announcementService.logAnnouncementAction(
        id,
        'scheduled',
        req.user.id,
        { scheduled_for }
      );

      res.json({
        success: true,
        message: `Announcement scheduled for ${new Date(scheduled_for).toLocaleString()}`
      });
    } catch (error) {
      console.error('Error scheduling announcement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule announcement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Get announcement statistics
  getAnnouncementStats = async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await announcementService.getAnnouncementStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching announcement stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcement statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Get user's announcements
  getUserAnnouncements = async (req, res) => {
    try {
      const userId = req.user.id;
      const filters = {
        status: req.query.status,
        priority: req.query.priority
      };

      const announcements = await announcementService.getUserAnnouncements(userId, filters);

      res.json({
        success: true,
        data: announcements,
        count: announcements.length
      });
    } catch (error) {
      console.error('Error fetching user announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch your announcements',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Mark announcement as viewed
  markAsViewed = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const marked = await announcementService.markAsViewed(id, userId);

      if (!marked) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found or already viewed'
        });
      }

      res.json({
        success: true,
        message: 'Announcement marked as viewed'
      });
    } catch (error) {
      console.error('Error marking announcement as viewed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark announcement as viewed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Mark announcement as clicked
  markAsClicked = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const marked = await announcementService.markAsClicked(id, userId);

      if (!marked) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      res.json({
        success: true,
        message: 'Announcement clicked recorded'
      });
    } catch (error) {
      console.error('Error marking announcement as clicked:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record click',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Get announcement analytics
  getAnnouncementAnalytics = async (req, res) => {
    try {
      const { startDate, endDate, target } = req.query;
      
      const db = (await import('../config/database.js')).default;
      
      let query = `
        SELECT 
          a.target,
          a.priority,
          COUNT(*) as total_announcements,
          SUM(CASE WHEN a.status = 'sent' THEN 1 ELSE 0 END) as sent_announcements,
          SUM(a.views_count) as total_views,
          SUM(a.clicks_count) as total_clicks,
          AVG(a.views_count) as avg_views_per_announcement,
          AVG(a.clicks_count) as avg_clicks_per_announcement
        FROM announcements a
        WHERE a.deleted_at IS NULL
      `;

      const params = [];

      if (startDate) {
        query += ' AND a.created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND a.created_at <= ?';
        params.push(endDate);
      }

      if (target) {
        query += ' AND a.target = ?';
        params.push(target);
      }

      query += ' GROUP BY a.target, a.priority ORDER BY a.target, a.priority';

      const [analytics] = await db.query(query, params);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching announcement analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcement analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  getPublicAnnouncements = async (req, res) => {
    try {
      const now = new Date();
      
      // Only get active, non-expired announcements
      const announcements = await announcementService.getPublicAnnouncements();
      
      res.json({
        success: true,
        data: announcements,
        count: announcements.length,
        timestamp: now.toISOString()
      });
    } catch (error) {
      console.error('Error fetching public announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcements',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

export default new AnnouncementController();