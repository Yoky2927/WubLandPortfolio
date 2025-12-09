// user-service/controllers/privilege.controller.js
import privilegeService from '../services/privilege.service.js';
import axios from 'axios'; // Added for API calls

// Helper function to get resource usage via API calls
async function getResourceUsageViaAPI(userId, resourceType) {
  try {
    let endpoint, serviceUrl;
    
    switch(resourceType) {
      case 'listings':
        serviceUrl = process.env.PROPERTY_SERVICE_URL || 'http://localhost:5002';
        endpoint = `/api/properties/user/${userId}/count`;
        break;
        
      case 'messages':
        serviceUrl = process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:5003';
        endpoint = `/api/messages/user/${userId}/count`;
        break;
        
      case 'offers':
        serviceUrl = process.env.TRANSACTION_SERVICE_URL || 'http://localhost:5004';
        endpoint = `/api/offers/user/${userId}/count`;
        break;
        
      default:
        return 0;
    }
    
    const response = await axios.get(`${serviceUrl}${endpoint}`, {
      timeout: 5000
    });
    
    return response.data.count || 0;
    
  } catch (error) {
    console.warn(`Failed to get ${resourceType} count via API for user ${userId}:`, error.message);
    return 0;
  }
}

export const getUserPrivileges = async (req, res) => {
  try {
    const privilegeProfile = privilegeService.getUserPrivilegeProfile(req.user);
    
    res.json({
      success: true,
      data: privilegeProfile
    });
  } catch (error) {
    console.error('Get user privileges error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user privileges'
    });
  }
};

export const checkPermission = async (req, res) => {
  try {
    const { resource, action } = req.body;
    
    if (!resource || !action) {
      return res.status(400).json({
        success: false,
        error: 'Resource and action are required'
      });
    }

    const hasPermission = privilegeService.hasPermission(req.user, resource, action);
    
    res.json({
      success: true,
      data: {
        has_permission: hasPermission,
        resource,
        action,
        user_role: req.user.role
      }
    });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permission'
    });
  }
};

export const getUserLimits = async (req, res) => {
  try {
    const limits = privilegeService.getUserLimits(req.user);
    
    // Check current usage via API calls
    const listingLimit = limits.properties?.max_listings || 0;
    const messageLimit = limits.communication?.max_messages || 0;
    
    let currentListingCount = 0;
    let currentMessageCount = 0;
    
    if (listingLimit > 0) {
      currentListingCount = await getResourceUsageViaAPI(req.user.id, 'listings');
    }
    
    if (messageLimit > 0) {
      currentMessageCount = await getResourceUsageViaAPI(req.user.id, 'messages');
    }
    
    // Add current usage to response
    const limitsWithUsage = {
      ...limits,
      current_usage: {
        listings: currentListingCount,
        messages: currentMessageCount
      }
    };
    
    res.json({
      success: true,
      data: limitsWithUsage
    });
  } catch (error) {
    console.error('Get user limits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user limits'
    });
  }
};

// Check resource limit for a specific resource
export const checkResourceLimit = async (req, res) => {
  try {
    const { resourceType } = req.body;
    
    if (!resourceType) {
      return res.status(400).json({
        success: false,
        error: 'Resource type is required'
      });
    }
    
    const limits = privilegeService.getUserLimits(req.user);
    let resourceLimit = 0;
    
    switch(resourceType) {
      case 'listings':
        resourceLimit = limits.properties?.max_listings || 0;
        break;
      case 'messages':
        resourceLimit = limits.communication?.max_messages || 0;
        break;
      case 'offers':
        resourceLimit = limits.transactions?.max_offers || 0;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid resource type'
        });
    }
    
    // Get current usage via API
    const currentUsage = await getResourceUsageViaAPI(req.user.id, resourceType);
    
    const remaining = resourceLimit > 0 ? resourceLimit - currentUsage : 0;
    const canProceed = resourceLimit === 0 || currentUsage < resourceLimit;
    
    res.json({
      success: true,
      data: {
        resource_type: resourceType,
        limit: resourceLimit,
        current_usage: currentUsage,
        remaining: remaining,
        can_proceed: canProceed,
        is_unlimited: resourceLimit === 0
      }
    });
  } catch (error) {
    console.error('Check resource limit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check resource limit'
    });
  }
};

export const checkChatUpgrade = async (req, res) => {
  try {
    const { messagesSent } = req.body;
    
    const upgradeInfo = privilegeService.getChatUpgradeMessage(req.user, messagesSent);
    
    res.json({
      success: true,
      data: upgradeInfo
    });
  } catch (error) {
    console.error('Check chat upgrade error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check chat upgrade requirements'
    });
  }
};

export const getPropertyPermissions = async (req, res) => {
  try {
    const canListDirectly = privilegeService.canListPropertiesDirectly(req.user);
    const canMakeRequests = privilegeService.canMakePropertyRequests(req.user);
    const requirements = privilegeService.getPropertyListingRequirements(req.user.role);
    
    // If user can list directly, check if they've reached their limit
    let limitInfo = null;
    if (canListDirectly) {
      const listingLimit = privilegeService.getUserLimits(req.user).properties?.max_listings || 0;
      if (listingLimit > 0) {
        const currentListingCount = await getResourceUsageViaAPI(req.user.id, 'listings');
        limitInfo = {
          max_listings: listingLimit,
          current_listings: currentListingCount,
          remaining: listingLimit - currentListingCount,
          can_add_more: currentListingCount < listingLimit
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        can_list_directly: canListDirectly,
        can_make_requests: canMakeRequests,
        requirements: requirements,
        user_role: req.user.role,
        limit_info: limitInfo
      }
    });
  } catch (error) {
    console.error('Get property permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve property permissions'
    });
  }
};

// Check if user can perform an action (with resource limit check)
export const canPerformAction = async (req, res) => {
  try {
    const { resource, action, resourceType } = req.body;
    
    if (!resource || !action) {
      return res.status(400).json({
        success: false,
        error: 'Resource and action are required'
      });
    }
    
    const hasPermission = privilegeService.hasPermission(req.user, resource, action);
    
    // If it's a resource-limited action, check usage
    let limitCheck = null;
    if (resourceType && hasPermission) {
      const currentUsage = await getResourceUsageViaAPI(req.user.id, resourceType);
      const limits = privilegeService.getUserLimits(req.user);
      
      let resourceLimit = 0;
      switch(resourceType) {
        case 'listings':
          resourceLimit = limits.properties?.max_listings || 0;
          break;
        case 'messages':
          resourceLimit = limits.communication?.max_messages || 0;
          break;
      }
      
      if (resourceLimit > 0) {
        limitCheck = {
          can_proceed: currentUsage < resourceLimit,
          current_usage: currentUsage,
          limit: resourceLimit,
          remaining: resourceLimit - currentUsage
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        has_permission: hasPermission,
        resource,
        action,
        resource_type: resourceType,
        limit_check: limitCheck,
        user_role: req.user.role
      }
    });
  } catch (error) {
    console.error('Can perform action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check action permission'
    });
  }
};