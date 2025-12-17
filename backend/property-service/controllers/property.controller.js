// controllers/property.controller.js
import PropertyModel from '../models/property.model.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

class PropertyController {
  async getAllProperties(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        city, 
        property_type, 
        listing_type, 
        min_price, 
        max_price, 
        beds, 
        baths,
        property_status,
        search
      } = req.query;

      const filters = {
        city,
        property_type,
        listing_type,
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
        beds: beds ? parseInt(beds) : undefined,
        baths: baths ? parseInt(baths) : undefined,
        property_status,
        search
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await PropertyModel.findAll(filters, page, limit);
      successResponse(res, 200, 'Properties retrieved successfully', result);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getPropertyById(req, res) {
    try {
      const { id } = req.params;
      
      if (isNaN(id)) {
        return errorResponse(res, 400, 'Invalid property ID');
      }

      const property = await PropertyModel.findById(id);

      if (!property) {
        return errorResponse(res, 404, 'Property not found');
      }

      successResponse(res, 200, 'Property retrieved successfully', property);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async createProperty(req, res) {
  try {
    const propertyData = req.body;
    
    // Required fields validation
    const requiredFields = ['title', 'price', 'address', 'city', 'listing_type'];
    const missingFields = requiredFields.filter(field => !propertyData[field]);
    
    if (missingFields.length > 0) {
      return errorResponse(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Set defaults for required fields if not provided
    const defaultData = {
      property_status: 'draft',
      property_type: 'house',
      currency: 'ETB',
      country: 'Ethiopia',
      is_negotiable: true,
      is_exclusive: false,
      features: [],
      amenities: [],
      property_tags: []
    };

    // Merge defaults with provided data
    const mergedData = { ...defaultData, ...propertyData };

    // Ensure owner and creator are set
    if (!mergedData.owner_user_id) {
      mergedData.owner_user_id = 1; // Default to admin
    }
    if (!mergedData.created_by_user_id) {
      mergedData.created_by_user_id = mergedData.owner_user_id;
    }

    const property = await PropertyModel.create(mergedData);
    successResponse(res, 201, 'Property created successfully', property);
  } catch (error) {
    console.error('Create property error:', error);
    errorResponse(res, 500, error.message);
  }
}

  async updateProperty(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (isNaN(id)) {
        return errorResponse(res, 400, 'Invalid property ID');
      }

      if (Object.keys(updates).length === 0) {
        return errorResponse(res, 400, 'No updates provided');
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, 'Property not found');
      }

      const updatedProperty = await PropertyModel.update(id, updates);
      successResponse(res, 200, 'Property updated successfully', updatedProperty);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async deleteProperty(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // Default to admin user if no auth
      
      if (isNaN(id)) {
        return errorResponse(res, 400, 'Invalid property ID');
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, 'Property not found');
      }

      const deleted = await PropertyModel.delete(id, userId);
      
      if (!deleted) {
        return errorResponse(res, 500, 'Failed to delete property');
      }

      successResponse(res, 200, 'Property deleted successfully');
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async searchProperties(req, res) {
    try {
      const { 
        q, 
        page = 1, 
        limit = 20,
        city,
        property_type,
        listing_type,
        min_price,
        max_price,
        beds,
        baths
      } = req.query;

      const filters = {
        city,
        property_type,
        listing_type,
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
        beds: beds ? parseInt(beds) : undefined,
        baths: baths ? parseInt(baths) : undefined
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await PropertyModel.search(q, filters, page, limit);
      successResponse(res, 200, 'Search results retrieved successfully', result);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getFeaturedProperties(req, res) {
    try {
      const { limit = 6 } = req.query;
      const properties = await PropertyModel.getFeatured(parseInt(limit));
      successResponse(res, 200, 'Featured properties retrieved successfully', properties);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getPremiumProperties(req, res) {
    try {
      const { limit = 6 } = req.query;
      const properties = await PropertyModel.getPremium(parseInt(limit));
      successResponse(res, 200, 'Premium properties retrieved successfully', properties);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getRecentProperties(req, res) {
    try {
      const { limit = 10 } = req.query;
      const properties = await PropertyModel.getRecent(parseInt(limit));
      successResponse(res, 200, 'Recent properties retrieved successfully', properties);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
  
  async getBrokerListings(req, res) {
  try {
    const { 
      page = 1, 
      limit = 20,
      property_status,
      listing_type,
      search
    } = req.query;

    // Get broker ID from authenticated user
    const brokerId = req.user.id;
    
    if (!brokerId) {
      return errorResponse(res, 401, 'Unauthorized: No broker ID found');
    }

    const filters = {
      property_status,
      listing_type,
      search
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await PropertyModel.findByBrokerId(brokerId, filters, page, limit);
    successResponse(res, 200, 'Broker listings retrieved successfully', result);
  } catch (error) {
    errorResponse(res, 500, error.message);
  }
}

  async updatePropertyStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (isNaN(id)) {
        return errorResponse(res, 400, 'Invalid property ID');
      }

      const validStatuses = ['draft', 'active', 'pending', 'sold', 'rented', 'inactive'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 400, 'Invalid status');
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, 'Property not found');
      }

      // Add status to history
      const statusHistory = property.status_history ? JSON.parse(property.status_history) : [];
      statusHistory.push({
        from: property.property_status,
        to: status,
        changed_at: new Date().toISOString()
      });

      const updatedProperty = await PropertyModel.update(id, {
        property_status: status,
        status_history: statusHistory,
        published_at: status === 'active' && !property.published_at ? new Date() : property.published_at
      });

      successResponse(res, 200, 'Property status updated successfully', updatedProperty);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async updatePropertyPrice(req, res) {
    try {
      const { id } = req.params;
      const { price } = req.body;
      
      if (isNaN(id)) {
        return errorResponse(res, 400, 'Invalid property ID');
      }

      if (!price || isNaN(price) || price <= 0) {
        return errorResponse(res, 400, 'Valid price is required');
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, 'Property not found');
      }

      // Add price to history
      const priceHistory = property.price_history ? JSON.parse(property.price_history) : [];
      priceHistory.push({
        from: property.price,
        to: price,
        changed_at: new Date().toISOString()
      });

      const updatedProperty = await PropertyModel.update(id, {
        price: parseFloat(price),
        price_history: priceHistory
      });

      successResponse(res, 200, 'Property price updated successfully', updatedProperty);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
}

export default new PropertyController();