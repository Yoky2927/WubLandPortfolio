// user-service/controllers/privilege.controller.js
import privilegeService from '../services/privilege.service.js';

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
    
    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('Get user limits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user limits'
    });
  }
};

// NEW: Check chat upgrade requirements
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

// NEW: Check property listing permissions
export const getPropertyPermissions = async (req, res) => {
  try {
    const canListDirectly = privilegeService.canListPropertiesDirectly(req.user);
    const canMakeRequests = privilegeService.canMakePropertyRequests(req.user);
    const requirements = privilegeService.getPropertyListingRequirements(req.user.role);
    
    res.json({
      success: true,
      data: {
        can_list_directly: canListDirectly,
        can_make_requests: canMakeRequests,
        requirements: requirements,
        user_role: req.user.role
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