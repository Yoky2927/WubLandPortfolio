// user-service/services/privilege.service.js
class PrivilegeService {
  constructor() {
    this.roleHierarchy = {
      'super_admin': 100,
      'admin': 90,
      'support_admin': 85,
      'support_lead': 80,
      'support_agent': 75,
      'internal_broker': 70,
      'external_broker': 60,
      'landlord': 50,
      'seller': 40,
      'buyer': 30,
      'renter': 20,
      'user': 10
    };

    this.privilegeTemplates = {
      // Super Admin - Full system access
      'super_admin': {
        system: ['*'],
        users: ['*'],
        content: ['*'],
        financial: ['*'],
        support: ['*'],
        properties: ['*'],
        analytics: ['*'],
        configuration: ['*'],
        communication: ['*']
      },

      // Admin - Platform management
      'admin': {
        system: ['read'],
        users: ['create', 'read', 'update', 'suspend'],
        content: ['create', 'read', 'update', 'delete', 'moderate'],
        financial: ['read', 'export', 'process_refunds'],
        support: ['read', 'manage_team'],
        properties: ['read', 'moderate', 'feature', 'create', 'update', 'delete'],
        analytics: ['read', 'export'],
        configuration: ['read'],
        communication: ['unlimited_messages', 'view_all_chats']
      },

      // Internal Broker (Premium) - CAN LIST PROPERTIES DIRECTLY
      'internal_broker': {
        properties: {
          manage: ['create', 'read', 'update', 'delete', 'bulk_upload', 'list_directly', 'feature'],
          limits: { 
            max_listings: 1000, 
            max_images_per_listing: 50,
            max_featured_listings: 20 
          },
          features: ['virtual_tours', 'featured_listings', 'premium_placement']
        },
        clients: {
          manage: ['create', 'read', 'update', 'delete', 'crm_access'],
          limits: { max_clients: 5000 },
          features: ['automated_followups', 'lead_scoring']
        },
        analytics: ['advanced_reports', 'market_trends', 'competitor_analysis'],
        financial: ['commission_tracking', 'payment_processing'],
        communication: {
          chat: ['unlimited_messages', 'initiate_chats', 'group_chats'],
          limits: { max_active_chats: 100 }
        },
        support: ['priority_support', 'dedicated_agent']
      },

      // External Broker (Standard) - CAN LIST PROPERTIES DIRECTLY
      'external_broker': {
        properties: {
          manage: ['create', 'read', 'update', 'delete', 'list_directly'],
          limits: { 
            max_listings: 100, 
            max_images_per_listing: 20,
            max_featured_listings: 5 
          },
          features: ['standard_listings']
        },
        clients: {
          manage: ['create', 'read', 'update', 'delete'],
          limits: { max_clients: 500 },
          features: ['basic_crm']
        },
        analytics: ['basic_reports'],
        financial: ['commission_tracking'],
        communication: {
          chat: ['unlimited_messages', 'initiate_chats'],
          limits: { max_active_chats: 50 }
        },
        support: ['standard_support']
      },

      // Support Roles
      'support_admin': {
        support: ['manage_team', 'view_all_tickets', 'escalate', 'performance_review'],
        knowledge_base: ['create', 'update', 'delete', 'publish'],
        users: ['temporary_suspension', 'verification_override'],
        communication: ['view_all_chats', 'moderate_chats']
      },

      'support_lead': {
        support: ['view_team_performance', 'assign_tickets', 'escalate'],
        knowledge_base: ['create', 'update'],
        users: ['assist_verification'],
        communication: ['view_team_chats', 'moderate_chats']
      },

      'support_agent': {
        support: ['view_assigned_tickets', 'respond', 'resolve'],
        knowledge_base: ['create', 'suggest_updates'],
        communication: ['view_assigned_chats', 'respond_chats']
      },

      // 🏘️ SELLER - CANNOT LIST DIRECTLY, MAKES REQUESTS
      'seller': {
        properties: {
          manage: ['create_request', 'read_own_requests', 'update_own_requests', 'delete_own_requests'],
          request_requirements: [
            'property_images', 'property_description', 'price_expectation',
            'property_location', 'property_size', 'amenities', 'contact_info'
          ]
        },
        communication: {
          chat: ['limited_messages', 'respond_to_brokers'],
          limits: { 
            free_messages: 10, 
            max_active_chats: 3,
            premium_unlimited: false 
          }
        },
        financial: ['view_offers', 'accept_reject_offers']
      },

      // 🏠 BUYER - CANNOT LIST, SEARCHES PROPERTIES
      'buyer': {
        properties: ['search', 'save_searches', 'favorite', 'view_details'],
        communication: {
          chat: ['limited_messages', 'contact_brokers'],
          limits: { 
            free_messages: 10, 
            max_active_chats: 3,
            premium_unlimited: false 
          }
        },
        financial: ['make_deposits', 'make_offers']
      },

      // 🏡 RENTER/TENANT - CANNOT LIST, SEARCHES RENTALS
      'renter': {
        properties: ['search_rentals', 'save_searches', 'favorite_rentals'],
        communication: {
          chat: ['limited_messages', 'contact_landlords'],
          limits: { 
            free_messages: 10, 
            max_active_chats: 3,
            premium_unlimited: false 
          }
        },
        rental_management: ['lease_agreements', 'maintenance_requests']
      },

      // 🏚️ LANDLORD - CANNOT LIST DIRECTLY, MAKES RENTAL REQUESTS
      'landlord': {
        properties: {
          manage: ['create_rental_request', 'read_own_requests', 'update_own_requests'],
          request_requirements: [
            'property_images', 'property_description', 'rental_price',
            'property_location', 'property_size', 'amenities', 'lease_terms'
          ]
        },
        communication: {
          chat: ['limited_messages', 'respond_to_tenants'],
          limits: { 
            free_messages: 10, 
            max_active_chats: 5,
            premium_unlimited: false 
          }
        },
        tenant_management: ['screen_tenants', 'lease_management'],
        financial: ['rent_collection', 'expense_tracking']
      }
    };

    // Premium features configuration
    this.premiumFeatures = {
      chat: {
        unlimited_messages: true,
        group_chats: true,
        file_sharing: true,
        video_calls: true,
        priority_support: true
      },
      properties: {
        featured_listings: true,
        advanced_analytics: true,
        bulk_upload: true,
        virtual_tours: true
      }
    };
  }

  // Check if user can list properties directly
  canListPropertiesDirectly(user) {
    const directListingRoles = [
      'internal_broker', 
      'external_broker', 
      'admin', 
      'super_admin'
    ];
    
    return directListingRoles.includes(user.role);
  }

  // Check if user can only make property requests
  canMakePropertyRequests(user) {
    const requestOnlyRoles = ['seller', 'landlord'];
    return requestOnlyRoles.includes(user.role);
  }

  // Check if user has permission for specific action
  hasPermission(user, resource, action, context = null) {
    const role = user.role;
    const brokerType = user.broker_type;
    const privilegeTier = user.privilege_tier || 'standard';

    // Get base privileges for role
    const rolePrivileges = this.privilegeTemplates[role];
    if (!rolePrivileges) return false;

    // Check if role has wildcard access
    if (rolePrivileges[resource] === '*') return true;
    if (rolePrivileges[resource]?.includes('*')) return true;

    // Check specific permission
    let hasAccess = false;
    
    // Handle nested privilege structures
    if (resource === 'properties' && rolePrivileges.properties?.manage) {
      hasAccess = rolePrivileges.properties.manage.includes(action);
    } else if (resource === 'communication' && rolePrivileges.communication?.chat) {
      hasAccess = rolePrivileges.communication.chat.includes(action);
    } else {
      hasAccess = rolePrivileges[resource]?.includes(action) || false;
    }

    // Special checks for brokers
    if (role === 'broker') {
      return this.checkBrokerPrivileges(user, resource, action, context);
    }

    // Check chat message limits for non-premium users
    if (resource === 'communication' && action === 'send_message') {
      return this.checkChatLimits(user, context);
    }

    return hasAccess;
  }

  // Special handling for broker privileges
  checkBrokerPrivileges(user, resource, action, context) {
    const brokerType = user.broker_type;
    const template = this.privilegeTemplates[`${brokerType}_broker`];
    
    if (!template) return false;

    // Check resource-specific permissions
    switch (resource) {
      case 'properties':
        return template.properties?.manage?.includes(action) || false;
      case 'communication':
        return template.communication?.chat?.includes(action) || false;
      default:
        return template[resource]?.includes(action) || false;
    }
  }

  // Check chat message limits for users
  checkChatLimits(user, context = {}) {
    const role = user.role;
    const isPremium = user.privilege_tier === 'premium';
    
    // Premium users have unlimited messages
    if (isPremium) return true;

    const chatLimits = this.privilegeTemplates[role]?.communication?.limits;
    if (!chatLimits) return true; // No limits defined

    // Check if user has free messages remaining
    const messagesSent = context.messagesSent || 0;
    const freeMessages = chatLimits.free_messages || 0;

    return messagesSent < freeMessages;
  }

  // Get property listing requirements for different roles
  getPropertyListingRequirements(role) {
    const requirements = {
      seller: [
        'Property Images (min 3, max 20)',
        'Property Description (min 50 characters)',
        'Price Expectation',
        'Property Location (full address)',
        'Property Size (sq ft/m²)',
        'Number of Bedrooms/Bathrooms',
        'Amenities List',
        'Contact Information',
        'Preferred Viewing Schedule',
        'Property Type (House, Apartment, etc.)'
      ],
      landlord: [
        'Property Images (min 3, max 15)',
        'Property Description (min 50 characters)',
        'Monthly Rental Price',
        'Security Deposit Amount',
        'Property Location (full address)',
        'Property Size (sq ft/m²)',
        'Number of Bedrooms/Bathrooms',
        'Amenities List',
        'Lease Duration Options',
        'Pet Policy',
        'Utility Inclusions',
        'Contact Information'
      ],
      internal_broker: [
        'Property Images (min 5, max 50)',
        'Property Description',
        'Listing Price',
        'Property Location',
        'Property Details',
        'Amenities',
        'Contact Information'
      ],
      external_broker: [
        'Property Images (min 3, max 20)',
        'Property Description',
        'Listing Price',
        'Property Location',
        'Property Details',
        'Amenities',
        'Contact Information'
      ]
    };

    return requirements[role] || [];
  }

  // Get user's resource limits - FIXED: No circular dependency
  getUserLimits(user) {
    const role = user.role;
    const brokerType = user.broker_type;
    
    // Define limits directly without calling other methods
    const limitsMap = {
      broker: {
        internal: {
          properties: { 
            max_listings: 1000, 
            max_images: 50, 
            bulk_upload: true,
            max_featured: 20 
          },
          clients: { max_clients: 5000, crm_access: true },
          analytics: { advanced: true, export: true },
          communication: { max_active_chats: 100, unlimited_messages: true }
        },
        external: {
          properties: { 
            max_listings: 100, 
            max_images: 20, 
            bulk_upload: false,
            max_featured: 5 
          },
          clients: { max_clients: 500, crm_access: false },
          analytics: { basic: true, export: false },
          communication: { max_active_chats: 50, unlimited_messages: true }
        }
      },
      seller: {
        properties: { 
          max_requests: 5, 
          max_images_per_request: 20 
        },
        communication: { 
          free_messages: 10, 
          max_active_chats: 3,
          premium_unlimited: false 
        }
      },
      landlord: {
        properties: { 
          max_requests: 10, 
          max_images_per_request: 15 
        },
        communication: { 
          free_messages: 10, 
          max_active_chats: 5,
          premium_unlimited: false 
        }
      },
      buyer: {
        communication: { 
          free_messages: 10, 
          max_active_chats: 3,
          premium_unlimited: false 
        }
      },
      renter: {
        communication: { 
          free_messages: 10, 
          max_active_chats: 3,
          premium_unlimited: false 
        }
      },
      support_agent: {
        tickets: { max_assigned: 50, max_responses: 1000 }
      },
      admin: {
        system: { full_access: true },
        users: { manage_all: true },
        properties: { manage_all: true }
      },
      super_admin: {
        system: { full_access: true },
        users: { manage_all: true },
        properties: { manage_all: true }
      }
    };

    return limitsMap[role]?.[brokerType] || limitsMap[role] || {};
  }

  // Get user features - FIXED: No circular dependency
  getUserFeatures(user) {
    const features = [];
    const role = user.role;
    const brokerType = user.broker_type;
    const privilegeTier = user.privilege_tier;
    
    // Add features based on role template
    const roleTemplate = this.privilegeTemplates[role];
    if (roleTemplate?.properties?.features) {
      features.push(...roleTemplate.properties.features);
    }
    
    // Add premium features
    if (privilegeTier === 'premium' || privilegeTier === 'enterprise') {
      features.push('unlimited_chat', 'priority_support', 'advanced_analytics');
    }
    
    // Add role-specific features
    if (this.canListPropertiesDirectly(user)) {
      features.push('direct_property_listing');
    }
    
    if (this.canMakePropertyRequests(user)) {
      features.push('property_requests');
    }
    
    return features;
  }

  // Check if user can access a specific feature
  canAccessFeature(user, feature) {
    const role = user.role;
    const brokerType = user.broker_type;
    const isPremium = user.privilege_tier === 'premium';
    
    const premiumFeatures = {
      chat_unlimited: ['internal_broker', 'external_broker', 'admin', 'super_admin'],
      property_direct_listing: ['internal_broker', 'external_broker', 'admin', 'super_admin'],
      advanced_analytics: ['internal_broker', 'admin', 'super_admin'],
      bulk_upload: ['internal_broker']
    };

    // Premium users get additional features
    if (isPremium) {
      premiumFeatures.chat_unlimited.push(role);
      premiumFeatures.property_direct_listing.push(role);
    }

    return premiumFeatures[feature]?.includes(role) || false;
  }

  // Get complete user privilege profile - FIXED: No circular dependency
  getUserPrivilegeProfile(user) {
    const role = user.role;
    const brokerType = user.broker_type;
    const privilegeTier = user.privilege_tier;
    
    return {
      role: role,
      broker_type: brokerType,
      privilege_tier: privilegeTier,
      permissions: this.privilegeTemplates[role] || {},
      limits: this.getUserLimits(user),
      features: this.getUserFeatures(user),
      can_list_directly: this.canListPropertiesDirectly(user),
      can_make_requests: this.canMakePropertyRequests(user),
      property_requirements: this.getPropertyListingRequirements(role)
    };
  }

  // Get upgrade message for chat limits
  getChatUpgradeMessage(user, messagesSent) {
    const limits = this.getUserLimits(user).communication || {};
    const freeMessages = limits.free_messages || 10;
    
    if (messagesSent >= freeMessages) {
      return {
        requires_upgrade: true,
        message: `You've used all your ${freeMessages} free messages. Upgrade to premium for unlimited chatting.`,
        free_messages_used: messagesSent,
        free_message_limit: freeMessages,
        upgrade_url: '/premium-upgrade'
      };
    }
    
    return {
      requires_upgrade: false,
      remaining_messages: freeMessages - messagesSent,
      free_message_limit: freeMessages
    };
  }

  // Simple method to get basic privilege info for login (no circular dependencies)
  getBasicPrivilegeInfo(user) {
    return {
      can_list_directly: this.canListPropertiesDirectly(user),
      can_make_requests: this.canMakePropertyRequests(user),
      features: this.getUserFeatures(user)
    };
  }
}

export default new PrivilegeService();