class PrivilegeService {
  constructor() {
    this.directListingRoles = [
      'internal_broker', 
      'external_broker', 
      'admin', 
      'super_admin',
      'support_admin'
    ];
    
    this.requestOnlyRoles = ['seller', 'landlord'];
    
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
  }

  canListPropertiesDirectly(user) {
    return this.directListingRoles.includes(user.role);
  }

  canMakePropertyRequests(user) {
    return this.requestOnlyRoles.includes(user.role);
  }

  hasHigherRole(user1, user2) {
    const rank1 = this.roleHierarchy[user1.role] || 0;
    const rank2 = this.roleHierarchy[user2.role] || 0;
    return rank1 > rank2;
  }

  getPropertyCreationLimits(user) {
    const limits = {
      'internal_broker': {
        maxListings: 1000,
        maxImages: 50,
        maxFeatured: 20,
        canBulkUpload: true
      },
      'external_broker': {
        maxListings: 100,
        maxImages: 20,
        maxFeatured: 5,
        canBulkUpload: false
      },
      'admin': {
        maxListings: Infinity,
        maxImages: 100,
        maxFeatured: Infinity,
        canBulkUpload: true
      },
      'super_admin': {
        maxListings: Infinity,
        maxImages: 100,
        maxFeatured: Infinity,
        canBulkUpload: true
      },
      'seller': {
        maxRequests: 5,
        maxImages: 20
      },
      'landlord': {
        maxRequests: 10,
        maxImages: 15
      }
    };

    return limits[user.role] || {};
  }

  canFeatureProperty(user) {
    const featureRoles = ['internal_broker', 'admin', 'super_admin', 'support_admin'];
    return featureRoles.includes(user.role);
  }

  canAssignBroker(user) {
    const assignRoles = ['admin', 'super_admin', 'support_admin'];
    return assignRoles.includes(user.role);
  }

  getViewingPermissions(user) {
    const permissions = {
      'internal_broker': {
        canCreate: true,
        canManageAll: true,
        maxAttendees: 50
      },
      'external_broker': {
        canCreate: true,
        canManageOwn: true,
        maxAttendees: 20
      },
      'buyer': {
        canView: true,
        canRSVP: true,
        maxGuests: 2
      },
      'seller': {
        canViewOwn: true,
        canApprove: true
      },
      'landlord': {
        canViewOwn: true,
        canApprove: true
      }
    };

    return permissions[user.role] || {};
  }
}

export default new PrivilegeService();