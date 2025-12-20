// controllers/property.controller.js
import PropertyModel from "../models/property.model.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

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
        search,
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
        search,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await PropertyModel.findAll(filters, page, limit);
      successResponse(res, 200, "Properties retrieved successfully", result);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getPropertyById(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return errorResponse(res, 400, "Invalid property ID");
      }

      const property = await PropertyModel.findById(id);

      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      successResponse(res, 200, "Property retrieved successfully", property);
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async createProperty(req, res) {
  try {
    console.log("📁 DEBUG: Request received for createProperty");
    console.log("📁 DEBUG: Request body keys:", Object.keys(req.body));
    console.log("📁 DEBUG: Request files:", req.files);
    console.log("📁 DEBUG: Request files structure:", JSON.stringify(req.files, null, 2));

    const propertyData = req.body;
    const files = req.files || {};

    // Debug: Check what's in files
    if (files) {
      console.log("📁 Files object keys:", Object.keys(files));
      for (const key in files) {
        console.log(`📁 File key '${key}':`, files[key]);
        if (Array.isArray(files[key])) {
          console.log(`📁 Found ${files[key].length} files in '${key}'`);
          files[key].forEach((file, index) => {
            console.log(`📁   File ${index}:`, {
              fieldname: file.fieldname,
              originalname: file.originalname,
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype
            });
          });
        }
      }
    }

    // Required fields validation
    const requiredFields = [
      "title",
      "price",
      "address",
      "city",
      "listing_type",
    ];
    const missingFields = requiredFields.filter(
      (field) => !propertyData[field]
    );

    if (missingFields.length > 0) {
      return errorResponse(
        res,
        400,
        `Missing required fields: ${missingFields.join(", ")}`
      );
    }

    // Set defaults for required fields if not provided
    const defaultData = {
      property_status: "draft",
      property_type: "house",
      currency: "ETB",
      country: "Ethiopia",
      is_negotiable: true,
      is_exclusive: false,
      features: [],
      amenities: [],
      property_tags: [],
    };

    // Parse JSON fields if they're strings
    if (typeof propertyData.features === "string") {
      try {
        propertyData.features = JSON.parse(propertyData.features);
      } catch (e) {
        console.warn("Failed to parse features:", e.message);
        propertyData.features = [];
      }
    }

    if (typeof propertyData.amenities === "string") {
      try {
        propertyData.amenities = JSON.parse(propertyData.amenities);
      } catch (e) {
        console.warn("Failed to parse amenities:", e.message);
        propertyData.amenities = [];
      }
    }

    // Handle property_tags properly
    if (typeof propertyData.property_tags === "string") {
      try {
        // Check if it's already a JSON string
        const parsed = JSON.parse(propertyData.property_tags);
        propertyData.property_tags = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.warn("Failed to parse property_tags:", e.message);
        // If not JSON, try splitting by comma
        propertyData.property_tags = propertyData.property_tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }
    }

    // Merge defaults with provided data
    const mergedData = { ...defaultData, ...propertyData };

    // Ensure owner and creator are set
    if (!mergedData.owner_user_id) {
      mergedData.owner_user_id = req.user?.id || 1;
    }
    if (!mergedData.created_by_user_id) {
      mergedData.created_by_user_id = mergedData.owner_user_id;
    }
    if (!mergedData.assigned_broker_id && req.user?.id) {
      mergedData.assigned_broker_id = req.user.id;
    }

    // Step 1: Create the property
    const property = await PropertyModel.create(mergedData);
    const propertyId = property.id;

    console.log(`✅ Property created with ID: ${propertyId}`);

    // Step 2: Handle image uploads if any - FIXED LOGIC
    console.log("🖼️ Checking for images...");
    
    // Try different possible field names
    let imagesArray = [];
    
    // Check for 'images' field (multer creates this as an array)
    if (files.images && Array.isArray(files.images)) {
      console.log(`📸 Found ${files.images.length} images in 'images' field`);
      imagesArray = files.images;
    } 
    // Check if images are in the root of files object
    else if (Array.isArray(files)) {
      console.log(`📸 Found ${files.length} images in root files array`);
      imagesArray = files.filter(file => file.fieldname === 'images');
    }
    // Check for any files that might be images
    else {
      for (const key in files) {
        if (key.includes('image') || key.includes('img')) {
          const fileArray = Array.isArray(files[key]) ? files[key] : [files[key]];
          console.log(`📸 Found ${fileArray.length} images in '${key}' field`);
          imagesArray = imagesArray.concat(fileArray);
        }
      }
    }

    if (imagesArray.length > 0) {
      console.log(`🖼️ Total images to process: ${imagesArray.length}`);
      
      for (let i = 0; i < imagesArray.length; i++) {
        const image = imagesArray[i];
        console.log(`🖼️ Processing image ${i + 1}: ${image.originalname || image.filename}`);

        const imageData = {
          image_url: `/uploads/property-images/${image.filename}`,
          thumbnail_url: `/uploads/property-images/thumbnails/${image.filename}`,
          caption: req.body[`image_${i}_caption`] || req.body[`caption_${i}`] || "",
          alt_text:
            req.body[`image_${i}_alt_text`] ||
            req.body[`alt_text_${i}`] ||
            image.originalname ||
            "Property image",
          file_size: image.size || 0,
          mime_type: image.mimetype || "image/jpeg",
          width: 0,
          height: 0,
          is_primary: i === 0, // First image is primary
          image_order: i,
          uploaded_by_user_id: req.user?.id || mergedData.created_by_user_id,
        };

        console.log(`💾 Saving image ${i + 1} to DB for property ${propertyId}`);
        try {
          await PropertyModel.addImage(propertyId, imageData);
          console.log(`✅ Image ${i + 1} saved successfully`);
        } catch (error) {
          console.error(`❌ Failed to save image ${i + 1}:`, error.message);
        }
      }
    } else {
      console.log("❌ No images found to process");
    }

    // Step 3: Handle floor plan uploads if any
    let floorPlansArray = [];
    
    if (files.floor_plans && Array.isArray(files.floor_plans)) {
      console.log(`📐 Found ${files.floor_plans.length} floor plans in 'floor_plans' field`);
      floorPlansArray = files.floor_plans;
    } else {
      // Check for any files that might be floor plans
      for (const key in files) {
        if (key.includes('floor') || key.includes('plan')) {
          const fileArray = Array.isArray(files[key]) ? files[key] : [files[key]];
          console.log(`📐 Found ${fileArray.length} floor plans in '${key}' field`);
          floorPlansArray = floorPlansArray.concat(fileArray);
        }
      }
    }

    if (floorPlansArray.length > 0) {
      console.log(`📐 Total floor plans to process: ${floorPlansArray.length}`);
      
      for (let i = 0; i < floorPlansArray.length; i++) {
        const floorPlan = floorPlansArray[i];
        console.log(`📐 Processing floor plan ${i + 1}: ${floorPlan.originalname || floorPlan.filename}`);

        const floorPlanData = {
          image_url: `/uploads/property-images/${floorPlan.filename}`,
          thumbnail_url: `/uploads/property-images/${floorPlan.filename}`,
          caption: req.body[`floor_plan_${i}_caption`] || req.body[`caption_${i}`] || "Floor Plan",
          alt_text:
            req.body[`floor_plan_${i}_alt_text`] ||
            req.body[`alt_text_${i}`] ||
            floorPlan.originalname ||
            "Property floor plan",
          file_size: floorPlan.size || 0,
          mime_type: floorPlan.mimetype || "image/jpeg",
          width: 0,
          height: 0,
          is_primary: false, // Floor plans are never primary
          image_order: 1000 + i, // High order to separate from regular images
          uploaded_by_user_id: req.user?.id || mergedData.created_by_user_id,
        };

        console.log(`💾 Saving floor plan ${i + 1} to DB for property ${propertyId}`);
        try {
          await PropertyModel.addImage(propertyId, floorPlanData);
          console.log(`✅ Floor plan ${i + 1} saved successfully`);
        } catch (error) {
          console.error(`❌ Failed to save floor plan ${i + 1}:`, error.message);
        }
      }
    } else {
      console.log("❌ No floor plans found to process");
    }

    // Step 4: Get the complete property with images
    console.log(`🔍 Fetching complete property ${propertyId} with images`);
    const completeProperty = await PropertyModel.findById(propertyId);

    if (!completeProperty) {
      console.error(`❌ Property ${propertyId} not found after creation`);
      return errorResponse(res, 500, "Property not found after creation");
    }

    // Log what we found
    console.log(`📊 Property ${propertyId} has ${completeProperty.images?.length || 0} images`);
    console.log(`📊 Property ${propertyId} has ${completeProperty.floor_plans?.length || 0} floor plans`);
    
    if (completeProperty.images && completeProperty.images.length > 0) {
      console.log(`📸 Image URLs:`, completeProperty.images.map(img => img.image_url));
    }
    if (completeProperty.floor_plans && completeProperty.floor_plans.length > 0) {
      console.log(`📐 Floor Plan URLs:`, completeProperty.floor_plans.map(fp => fp.image_url));
    }

    successResponse(
      res,
      201,
      "Property created successfully",
      completeProperty
    );
  } catch (error) {
    console.error("Create property error:", error);
    errorResponse(res, 500, error.message);
  }
}

  async updateProperty(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (isNaN(id)) {
        return errorResponse(res, 400, "Invalid property ID");
      }

      if (Object.keys(updates).length === 0) {
        return errorResponse(res, 400, "No updates provided");
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      const updatedProperty = await PropertyModel.update(id, updates);
      successResponse(
        res,
        200,
        "Property updated successfully",
        updatedProperty
      );
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async deleteProperty(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // Default to admin user if no auth

      if (isNaN(id)) {
        return errorResponse(res, 400, "Invalid property ID");
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      const deleted = await PropertyModel.delete(id, userId);

      if (!deleted) {
        return errorResponse(res, 500, "Failed to delete property");
      }

      successResponse(res, 200, "Property deleted successfully");
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
        baths,
      } = req.query;

      const filters = {
        city,
        property_type,
        listing_type,
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
        beds: beds ? parseInt(beds) : undefined,
        baths: baths ? parseInt(baths) : undefined,
      };

      // Remove undefined filters
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await PropertyModel.search(q, filters, page, limit);
      successResponse(
        res,
        200,
        "Search results retrieved successfully",
        result
      );
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getFeaturedProperties(req, res) {
    try {
      const { limit = 6 } = req.query;
      const properties = await PropertyModel.getFeatured(parseInt(limit));
      successResponse(
        res,
        200,
        "Featured properties retrieved successfully",
        properties
      );
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getPremiumProperties(req, res) {
    try {
      const { limit = 6 } = req.query;
      const properties = await PropertyModel.getPremium(parseInt(limit));
      successResponse(
        res,
        200,
        "Premium properties retrieved successfully",
        properties
      );
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getRecentProperties(req, res) {
    try {
      const { limit = 10 } = req.query;
      const properties = await PropertyModel.getRecent(parseInt(limit));
      successResponse(
        res,
        200,
        "Recent properties retrieved successfully",
        properties
      );
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async getBrokerListings(req, res) {
    try {
      console.log("🔍 getBrokerListings called");
      console.log("📋 User:", req.user);
      console.log("📋 Query:", req.query);

      const {
        page = 1,
        limit = 20,
        status: property_status,
        listing_type,
        search,
      } = req.query;

      // Get broker ID from authenticated user
      const brokerId = req.user?.id;

      if (!brokerId) {
        console.error("❌ No broker ID found in request");
        return errorResponse(res, 401, "Unauthorized: No broker ID found");
      }

      console.log(`🔍 Getting listings for broker ${brokerId}`);

      const filters = {};
      if (property_status) {
        console.log(`📊 Filtering by status: ${property_status}`);
        filters.property_status = property_status;
      }
      if (listing_type) {
        console.log(`📊 Filtering by listing type: ${listing_type}`);
        filters.listing_type = listing_type;
      }
      if (search) {
        console.log(`📊 Searching for: ${search}`);
        filters.search = search;
      }

      const result = await PropertyModel.findByBrokerId(
        brokerId,
        filters,
        parseInt(page),
        parseInt(limit)
      );

      console.log(`✅ Found ${result.properties?.length || 0} properties`);

      successResponse(
        res,
        200,
        "Broker listings retrieved successfully",
        result
      );
    } catch (error) {
      console.error("❌ Error in getBrokerListings:", error);
      errorResponse(res, 500, error.message);
    }
  }

  async updatePropertyStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (isNaN(id)) {
        return errorResponse(res, 400, "Invalid property ID");
      }

      const validStatuses = [
        "draft",
        "active",
        "pending",
        "sold",
        "rented",
        "inactive",
      ];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 400, "Invalid status");
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Add status to history
      const statusHistory = property.status_history
        ? JSON.parse(property.status_history)
        : [];
      statusHistory.push({
        from: property.property_status,
        to: status,
        changed_at: new Date().toISOString(),
      });

      const updatedProperty = await PropertyModel.update(id, {
        property_status: status,
        status_history: statusHistory,
        published_at:
          status === "active" && !property.published_at
            ? new Date()
            : property.published_at,
      });

      successResponse(
        res,
        200,
        "Property status updated successfully",
        updatedProperty
      );
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  async updatePropertyPrice(req, res) {
    try {
      const { id } = req.params;
      const { price } = req.body;

      if (isNaN(id)) {
        return errorResponse(res, 400, "Invalid property ID");
      }

      if (!price || isNaN(price) || price <= 0) {
        return errorResponse(res, 400, "Valid price is required");
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Add price to history
      const priceHistory = property.price_history
        ? JSON.parse(property.price_history)
        : [];
      priceHistory.push({
        from: property.price,
        to: price,
        changed_at: new Date().toISOString(),
      });

      const updatedProperty = await PropertyModel.update(id, {
        price: parseFloat(price),
        price_history: priceHistory,
      });

      successResponse(
        res,
        200,
        "Property price updated successfully",
        updatedProperty
      );
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
  // Add this method to your PropertyController class
  async updatePropertyStatusAction(req, res) {
    try {
      const { id } = req.params;
      const { action, notes, status } = req.body;

      if (isNaN(id)) {
        return errorResponse(res, 400, "Invalid property ID");
      }

      // Determine new status based on action
      const actionMap = {
        approve: "active",
        reject: "rejected",
        request_changes: "pending",
      };

      const newStatus = status || actionMap[action];

      if (!newStatus) {
        return errorResponse(res, 400, "Invalid action or status");
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Add status to history
      const statusHistory = property.status_history
        ? JSON.parse(property.status_history)
        : [];
      statusHistory.push({
        from: property.property_status,
        to: newStatus,
        changed_at: new Date().toISOString(),
        notes: notes || "",
        changed_by: req.user?.id || "system",
      });

      const updatedProperty = await PropertyModel.update(id, {
        property_status: newStatus,
        status_history: JSON.stringify(statusHistory),
      });

      successResponse(
        res,
        200,
        `Property ${action || "status"} updated successfully`,
        updatedProperty
      );
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }

  // Add this method for broker-specific actions
  async brokerUpdatePropertyStatus(req, res) {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      const brokerId = req.user?.id;

      if (isNaN(id)) {
        return errorResponse(res, 400, "Invalid property ID");
      }

      if (!brokerId) {
        return errorResponse(res, 401, "Unauthorized: No broker ID found");
      }

      const actionMap = {
        approve: "active",
        reject: "rejected",
        request_changes: "pending",
      };

      const newStatus = actionMap[action];

      if (!newStatus) {
        return errorResponse(res, 400, "Invalid action");
      }

      const property = await PropertyModel.findById(id);
      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Verify broker is assigned to this property
      if (property.assigned_broker_id !== parseInt(brokerId)) {
        return errorResponse(
          res,
          403,
          "Not authorized to manage this property"
        );
      }

      // Add status to history
      const statusHistory = property.status_history
        ? JSON.parse(property.status_history)
        : [];
      statusHistory.push({
        from: property.property_status,
        to: newStatus,
        changed_at: new Date().toISOString(),
        notes: notes || "",
        changed_by: brokerId,
      });

      const updatedProperty = await PropertyModel.update(id, {
        property_status: newStatus,
        status_history: JSON.stringify(statusHistory),
      });

      successResponse(
        res,
        200,
        `Property ${action} successfully`,
        updatedProperty
      );
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
}

export default new PropertyController();
