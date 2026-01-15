import pool from "../config/database.js";

// Helper function - MUST BE OUTSIDE THE CLASS
function safeJsonParse(str, defaultValue = []) {
  try {
    return str ? JSON.parse(str) : defaultValue;
  } catch (error) {
    console.error("JSON parse error:", error, "String:", str);
    return defaultValue;
  }
}

// Helper to safely stringify arrays/objects
function safeJsonStringify(data) {
  try {
    if (Array.isArray(data) || typeof data === "object") {
      return JSON.stringify(data);
    }
    return data;
  } catch (error) {
    console.error("JSON stringify error:", error);
    return "[]";
  }
}

class PropertyModel {
  // CREATE PROPERTY - FIXED VERSION
  async create(propertyData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Generate a unique UUID
      const { v4: uuidv4 } = await import("uuid");
      const propertyUuid = uuidv4();

      // Parse and validate the incoming data
      const features = Array.isArray(propertyData.features)
        ? propertyData.features
        : [];
      const amenities = Array.isArray(propertyData.amenities)
        ? propertyData.amenities
        : [];
      const propertyTags = Array.isArray(propertyData.property_tags)
        ? propertyData.property_tags
        : [];

      // Handle address (convert array to string if needed)
      let address = propertyData.address;
      if (Array.isArray(address)) {
        address = address[0] || "";
      }

      // Handle sqft (convert array to number if needed)
      let sqft = propertyData.sqft || propertyData.square_meters || 0;
      if (Array.isArray(sqft)) {
        sqft = parseFloat(sqft[1]) || parseFloat(sqft[0]) || 0;
      }

      // Handle latitude/longitude
      let latitude = propertyData.latitude;
      let longitude = propertyData.longitude;
      if (latitude && !isNaN(parseFloat(latitude))) {
        latitude = parseFloat(latitude);
      }
      if (longitude && !isNaN(parseFloat(longitude))) {
        longitude = parseFloat(longitude);
      }

      // Prepare the property data with correct column names
      const propertyFields = {
        property_uuid: propertyUuid,
        title: propertyData.title || "",
        description: propertyData.description || "",
        price: parseFloat(propertyData.price) || 0,
        currency: propertyData.currency || "ETB",
        listing_type: propertyData.listing_type || "sale",
        property_type: propertyData.property_type || "apartment",
        property_status: propertyData.property_status || "draft",
        address: address,
        city: propertyData.city || "",
        region: propertyData.region || "",
        country: propertyData.country || "Ethiopia",
        latitude: latitude || null,
        longitude: longitude || null,
        beds: parseInt(propertyData.beds) || 0,
        baths: parseInt(propertyData.baths) || 0,
        sqft: sqft,
        year_built: parseInt(propertyData.year_built) || null,
        is_negotiable:
          propertyData.is_negotiable === true ||
            propertyData.is_negotiable === "true" ||
            propertyData.is_negotiable === 1
            ? 1
            : 0,
        is_exclusive:
          propertyData.is_exclusive === true ||
            propertyData.is_exclusive === "true" ||
            propertyData.is_exclusive === 1
            ? 1
            : 0,
        is_featured:
          propertyData.is_featured === true ||
            propertyData.is_featured === "true" ||
            propertyData.is_featured === 1
            ? 1
            : 0,
        is_premium:
          propertyData.is_premium === true ||
            propertyData.is_premium === "true" ||
            propertyData.is_premium === 1
            ? 1
            : 0,
        owner_user_id: parseInt(propertyData.owner_user_id) || 1,
        assigned_broker_id: parseInt(propertyData.assigned_broker_id) || null,
        created_by_user_id:
          parseInt(propertyData.created_by_user_id) ||
          parseInt(propertyData.owner_user_id) ||
          1,
        features: safeJsonStringify(features),
        amenities: safeJsonStringify(amenities),
        property_tags: safeJsonStringify(propertyTags),
        price_history: JSON.stringify([
          {
            price: parseFloat(propertyData.price) || 0,
            currency: propertyData.currency || "ETB",
            changed_at: new Date().toISOString(),
            changed_by:
              parseInt(propertyData.created_by_user_id) ||
              parseInt(propertyData.owner_user_id) ||
              1,
          },
        ]),
        status_history: JSON.stringify([
          {
            status: propertyData.property_status || "draft",
            changed_at: new Date().toISOString(),
            changed_by:
              parseInt(propertyData.created_by_user_id) ||
              parseInt(propertyData.owner_user_id) ||
              1,
          },
        ]),
      };

      // FIXED: Build the SQL query
      const columns = [];
      const placeholders = [];
      const values = [];

      // Manually build to ensure perfect match
      for (const [key, value] of Object.entries(propertyFields)) {
        columns.push(key);

        if (value === null) {
          placeholders.push("NULL");
        } else {
          placeholders.push("?");
          values.push(value);
        }
      }

      const columnsStr = columns.join(", ");
      const placeholdersStr = placeholders.join(", ");
      const query = `INSERT INTO properties (${columnsStr}) VALUES (${placeholdersStr})`;

      console.log("Creating property with data:", {
        columnsCount: columns.length,
        valuesCount: values.length,
        placeholdersCount: placeholders.length,
        hasStatusHistory: columns.includes('status_history'),
        queryPreview: query.substring(0, 150) + '...'
      });

      const [result] = await connection.execute(query, values);
      const propertyId = result.insertId;

      // Handle published_at separately if status is active
      if (propertyData.property_status === "active") {
        await connection.execute(
          `UPDATE properties SET published_at = ? WHERE id = ?`,
          [new Date(), propertyId]
        );
      }

      await connection.commit();

      // Return the created property
      return await this.findById(propertyId);
    } catch (error) {
      await connection.rollback();
      console.error("Error creating property:", error);

      // Enhanced error logging
      if (error.sqlMessage) {
        console.error("SQL Error:", error.sqlMessage);
        console.error("Error code:", error.code);
      }

      throw error;
    } finally {
      connection.release();
    }
  }

  // UPDATE PROPERTY
  async update(id, updates) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get current property
      const currentProperty = await this.findById(id);
      if (!currentProperty) {
        throw new Error("Property not found");
      }

      // Prepare update data
      const updateFields = {};

      // Handle JSON fields
      if (updates.features !== undefined) {
        updateFields.features = safeJsonStringify(updates.features);
      }
      if (updates.amenities !== undefined) {
        updateFields.amenities = safeJsonStringify(updates.amenities);
      }
      if (updates.property_tags !== undefined) {
        updateFields.property_tags = safeJsonStringify(updates.property_tags);
      }

      // Handle price history update
      if (
        updates.price !== undefined &&
        updates.price !== currentProperty.price
      ) {
        const priceHistory = currentProperty.price_history || [];
        priceHistory.push({
          price: parseFloat(updates.price) || 0,
          currency: updates.currency || currentProperty.currency,
          changed_at: new Date().toISOString(),
          changed_by: updates.updated_by || currentProperty.created_by_user_id,
        });
        updateFields.price_history = JSON.stringify(priceHistory);
        updateFields.price = parseFloat(updates.price) || 0;
      }

      // Handle status history update
      if (
        updates.property_status !== undefined &&
        updates.property_status !== currentProperty.property_status
      ) {
        const statusHistory = currentProperty.status_history || [];
        statusHistory.push({
          status: updates.property_status,
          changed_at: new Date().toISOString(),
          changed_by: updates.updated_by || currentProperty.created_by_user_id,
          notes: updates.notes || "",
        });
        updateFields.status_history = JSON.stringify(statusHistory);
        updateFields.property_status = updates.property_status;

        // Set published_at if status is active
        if (
          updates.property_status === "active" &&
          !currentProperty.published_at
        ) {
          updateFields.published_at = new Date();
        }
      }

      // Handle other fields - match database column names
      const allowedFields = [
        "title",
        "description",
        "price",
        "currency",
        "listing_type",
        "property_type",
        "property_status",
        "address",
        "city",
        "region",
        "country",
        "latitude",
        "longitude",
        "beds",
        "baths",
        "sqft",
        "year_built",
        "is_negotiable",
        "is_exclusive",
        "is_featured",
        "is_premium",
        "owner_user_id",
        "assigned_broker_id",
        "published_at",
        "mls_number",
        "mls_source",
        "listing_date",
        "expiration_date",
        "deposit_amount",
        "monthly_rent",
        "tax_amount",
        "hoa_fees",
        "insurance_amount",
        "lot_size",
        "garage_spaces",
        "parking_spaces",
        "neighborhood",
        "zip_code",
      ];

      allowedFields.forEach((field) => {
        if (updates[field] !== undefined) {
          // Convert boolean strings to integers for MySQL
          if (
            field === "is_negotiable" ||
            field === "is_exclusive" ||
            field === "is_featured" ||
            field === "is_premium"
          ) {
            updateFields[field] =
              updates[field] === "true" || updates[field] === true ? 1 : 0;
          }
          // Handle numeric fields
          else if (
            field === "price" ||
            field === "beds" ||
            field === "baths" ||
            field === "year_built" ||
            field === "sqft" ||
            field === "lot_size" ||
            field === "garage_spaces" ||
            field === "parking_spaces"
          ) {
            updateFields[field] = parseFloat(updates[field]) || 0;
          }
          // Handle decimal fields
          else if (field === "latitude" || field === "longitude") {
            updateFields[field] = parseFloat(updates[field]) || null;
          } else {
            updateFields[field] = updates[field];
          }
        }
      });

      // Always update the updated_at timestamp
      updateFields.updated_at = new Date();
      updateFields.last_modified_by_user_id =
        updates.updated_by || currentProperty.created_by_user_id;

      // Build the update query
      if (Object.keys(updateFields).length === 0) {
        throw new Error("No valid fields to update");
      }

      const setClause = Object.keys(updateFields)
        .map((field) => `${field} = ?`)
        .join(", ");
      const values = [...Object.values(updateFields), id];

      const query = `UPDATE properties SET ${setClause} WHERE id = ? AND deleted_at IS NULL`;

      const [result] = await connection.execute(query, values);

      if (result.affectedRows === 0) {
        throw new Error("Property not found or already deleted");
      }

      await connection.commit();

      // Return the updated property
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      console.error("Error updating property:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // GET PROPERTY BY ID
  async findById(id) {
    const connection = await pool.getConnection();

    try {
      // Get property details
      const propertyQuery = `
      SELECT p.*, 
        u.username as owner_username,
        u.email as owner_email,
        u.phone_number as owner_phone,
        b.username as broker_username,
        b.email as broker_email,
        b.phone_number as broker_phone
      FROM properties p
      LEFT JOIN users u ON p.owner_user_id = u.id
      LEFT JOIN users b ON p.assigned_broker_id = b.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `;

      const [properties] = await connection.execute(propertyQuery, [id]);

      if (properties.length === 0) {
        connection.release();
        return null;
      }

      const property = properties[0];

      // Get property images
      const imagesQuery = `
      SELECT * FROM property_images 
      WHERE property_id = ? AND deleted_at IS NULL
      ORDER BY is_primary DESC, image_order ASC
    `;

      const [images] = await connection.execute(imagesQuery, [id]);

      // Separate regular images from floor plans
      const regularImages = images.filter(
        (img) =>
          !img.caption.toLowerCase().includes("floor plan") &&
          !img.caption.toLowerCase().includes("floorplan") &&
          img.image_order < 999
      );

      const floorPlans = images
        .filter(
          (img) =>
            img.caption.toLowerCase().includes("floor plan") ||
            img.caption.toLowerCase().includes("floorplan") ||
            img.image_order >= 999
        )
        .map((plan) => ({
          ...plan,
          is_floor_plan: true,
        }));

      connection.release();

      // Parse JSON fields
      return {
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        price_history: safeJsonParse(property.price_history, []),
        status_history: safeJsonParse(property.status_history, []),
        square_meters: property.sqft || 0,
        images: regularImages,
        floor_plans: floorPlans,
        total_images: images.length,
        total_floor_plans: floorPlans.length,
      };
    } catch (error) {
      connection.release();
      console.error("Error finding property by ID:", error);
      throw error;
    }
  }

  // ADD PROPERTY IMAGE
  async addImage(propertyId, imageData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query = `
      INSERT INTO property_images 
      (property_id, image_url, thumbnail_url, image_order, caption, alt_text, 
       file_size, mime_type, width, height, is_primary, uploaded_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      const values = [
        propertyId,
        imageData.image_url,
        imageData.thumbnail_url,
        imageData.image_order || 0,
        imageData.caption || "",
        imageData.alt_text || "",
        imageData.file_size || 0,
        imageData.mime_type || "image/jpeg",
        imageData.width || 0,
        imageData.height || 0,
        imageData.is_primary ? 1 : 0,
        imageData.uploaded_by_user_id,
      ];

      const [result] = await connection.execute(query, values);
      const imageId = result.insertId;

      await connection.commit();

      return {
        id: imageId,
        ...imageData,
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error adding property image:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // GET PROPERTY IMAGES
  async getImages(propertyId) {
    const connection = await pool.getConnection();

    try {
      const query = `
        SELECT * FROM property_images 
        WHERE property_id = ? AND deleted_at IS NULL
        ORDER BY is_primary DESC, image_order ASC
      `;

      const [images] = await connection.execute(query, [propertyId]);
      return images;
    } catch (error) {
      console.error("Error getting property images:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // SET PRIMARY IMAGE
  async setPrimaryImage(propertyId, imageId) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Reset all images to non-primary
      await connection.execute(
        "UPDATE property_images SET is_primary = 0 WHERE property_id = ?",
        [propertyId]
      );

      // Set the specified image as primary
      const [result] = await connection.execute(
        "UPDATE property_images SET is_primary = 1 WHERE id = ? AND property_id = ?",
        [imageId, propertyId]
      );

      await connection.commit();

      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error("Error setting primary image:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // DELETE PROPERTY IMAGE
  async deleteImage(imageId, userId) {
    const connection = await pool.getConnection();

    try {
      const query = `
        UPDATE property_images 
        SET deleted_at = ?, uploaded_by_user_id = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [result] = await connection.execute(query, [new Date(), userId, imageId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting property image:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ADD FLOOR PLAN (using property_images table with different category)
  async addFloorPlan(propertyId, floorPlanData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query = `
        INSERT INTO property_images 
        (property_id, image_url, thumbnail_url, image_order, caption, alt_text, 
         file_size, mime_type, width, height, is_primary, uploaded_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        propertyId,
        floorPlanData.image_url,
        floorPlanData.thumbnail_url || floorPlanData.image_url,
        floorPlanData.image_order || 999, // High order number to separate from regular images
        floorPlanData.caption || "Floor Plan",
        floorPlanData.alt_text || "Property Floor Plan",
        floorPlanData.file_size || 0,
        floorPlanData.mime_type || "image/svg+xml",
        floorPlanData.width || 0,
        floorPlanData.height || 0,
        0, // Never primary
        floorPlanData.uploaded_by_user_id,
      ];

      const [result] = await connection.execute(query, values);
      const floorPlanId = result.insertId;

      await connection.commit();

      return {
        id: floorPlanId,
        ...floorPlanData,
        is_floor_plan: true,
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error adding floor plan:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // GET FLOOR PLANS (images with specific ordering/caption)
  async getFloorPlans(propertyId) {
    const connection = await pool.getConnection();

    try {
      const query = `
        SELECT * FROM property_images 
        WHERE property_id = ? AND deleted_at IS NULL 
          AND (caption LIKE '%floor plan%' OR caption LIKE '%floorplan%' OR image_order >= 999)
        ORDER BY image_order ASC
      `;

      const [floorPlans] = await connection.execute(query, [propertyId]);
      return floorPlans.map((plan) => ({
        ...plan,
        is_floor_plan: true,
      }));
    } catch (error) {
      console.error("Error getting floor plans:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // GET ALL PROPERTIES WITH FILTERS
  async findAll(filters = {}, page = 1, limit = 20) {
    const connection = await pool.getConnection();

    try {
      let whereClauses = ["p.deleted_at IS NULL"];
      const values = [];

      if (filters.city) {
        whereClauses.push("p.city LIKE ?");
        values.push(`%${filters.city}%`);
      }

      if (filters.property_type) {
        whereClauses.push("p.property_type = ?");
        values.push(filters.property_type);
      }

      if (filters.listing_type) {
        whereClauses.push("p.listing_type = ?");
        values.push(filters.listing_type);
      }

      if (filters.property_status) {
        whereClauses.push("p.property_status = ?");
        values.push(filters.property_status);
      }

      if (filters.min_price) {
        whereClauses.push("p.price >= ?");
        values.push(filters.min_price);
      }

      if (filters.max_price) {
        whereClauses.push("p.price <= ?");
        values.push(filters.max_price);
      }

      if (filters.beds) {
        whereClauses.push("p.beds >= ?");
        values.push(filters.beds);
      }

      if (filters.baths) {
        whereClauses.push("p.baths >= ?");
        values.push(filters.baths);
      }

      if (filters.search) {
        whereClauses.push(
          "(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ? OR p.city LIKE ?)"
        );
        values.push(
          `%${filters.search}%`,
          `%${filters.search}%`,
          `%${filters.search}%`,
          `%${filters.search}%`
        );
      }

      const where =
        whereClauses.length > 0
          ? `WHERE ${whereClauses.join(" AND ")}`
          : "WHERE p.deleted_at IS NULL";

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM properties p
        ${where}
      `;
      const [countResult] = await connection.execute(countQuery, values);
      const total = countResult[0].total;

      // Get paginated results
      const offset = (page - 1) * limit;
      const query = `
    SELECT p.*, 
      u.username as owner_username,
      b.username as broker_username,
      b.email as broker_email,
      b.phone_number as broker_phone
    FROM properties p
    LEFT JOIN users u ON p.owner_user_id = u.id
    LEFT JOIN users b ON p.assigned_broker_id = b.id
    ${where}
    ORDER BY 
      CASE WHEN p.is_featured = 1 THEN 0 ELSE 1 END,
      CASE WHEN p.is_premium = 1 THEN 0 ELSE 1 END,
      p.published_at DESC
    LIMIT ? OFFSET ?
  `;

      const [properties] = await connection.execute(query, [...values, limit, offset]);

      // Parse JSON fields and add square_meters mapping
      const parsedProperties = properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        price_history: safeJsonParse(property.price_history, []),
        status_history: safeJsonParse(property.status_history, []),
        square_meters: property.sqft || 0,
      }));

      return {
        properties: parsedProperties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error finding all properties:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // SEARCH PROPERTIES
  async search(q, filters = {}, page = 1, limit = 20) {
    const connection = await pool.getConnection();

    try {
      let whereClauses = ["p.deleted_at IS NULL", "p.property_status = 'active'"];
      const values = [];

      // Add search term
      if (q) {
        whereClauses.push(
          "(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ? OR p.city LIKE ? OR p.property_tags LIKE ?)"
        );
        const searchValue = `%${q}%`;
        values.push(
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue
        );
      }

      // Apply filters
      if (filters.city) {
        whereClauses.push("p.city LIKE ?");
        values.push(`%${filters.city}%`);
      }

      if (filters.property_type) {
        whereClauses.push("p.property_type = ?");
        values.push(filters.property_type);
      }

      if (filters.listing_type) {
        whereClauses.push("p.listing_type = ?");
        values.push(filters.listing_type);
      }

      if (filters.min_price) {
        whereClauses.push("p.price >= ?");
        values.push(filters.min_price);
      }

      if (filters.max_price) {
        whereClauses.push("p.price <= ?");
        values.push(filters.max_price);
      }

      if (filters.beds) {
        whereClauses.push("p.beds >= ?");
        values.push(filters.beds);
      }

      if (filters.baths) {
        whereClauses.push("p.baths >= ?");
        values.push(filters.baths);
      }

      const where =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM properties p ${where}`;
      const [countResult] = await connection.execute(countQuery, values);
      const total = countResult[0].total;

      // Get paginated results
      const offset = (page - 1) * limit;
      const query = `
        SELECT p.*, 
          u.username as owner_username,
          b.username as broker_username
        FROM properties p
        LEFT JOIN users u ON p.owner_user_id = u.id
        LEFT JOIN users b ON p.assigned_broker_id = b.id
        ${where}
        ORDER BY 
          CASE WHEN p.is_featured = 1 THEN 0 ELSE 1 END,
          CASE WHEN p.is_premium = 1 THEN 0 ELSE 1 END,
          p.published_at DESC
        LIMIT ? OFFSET ?
      `;

      const [properties] = await connection.execute(query, [...values, limit, offset]);

      // Parse JSON fields and add square_meters mapping
      const parsedProperties = properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        price_history: safeJsonParse(property.price_history, []),
        status_history: safeJsonParse(property.status_history, []),
        square_meters: property.sqft || 0,
      }));

      return {
        properties: parsedProperties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error searching properties:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // GET FEATURED PROPERTIES
  async getFeatured(limit = 6) {
    const connection = await pool.getConnection();

    try {
      const query = `
      SELECT p.*, 
        u.username as owner_username,
        b.username as broker_username,
        b.email as broker_email,
        b.phone_number as broker_phone
      FROM properties p
      LEFT JOIN users u ON p.owner_user_id = u.id
      LEFT JOIN users b ON p.assigned_broker_id = b.id
      WHERE p.deleted_at IS NULL AND p.property_status = 'active' AND p.is_featured = 1
      ORDER BY p.published_at DESC
      LIMIT ?
    `;

      const [properties] = await connection.execute(query, [limit]);

      // Parse JSON fields and add square_meters mapping
      return properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        price_history: safeJsonParse(property.price_history, []),
        status_history: safeJsonParse(property.status_history, []),
        square_meters: property.sqft || 0,
      }));
    } catch (error) {
      console.error("Error getting featured properties:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // GET PREMIUM PROPERTIES
  async getPremium(limit = 6) {
    const connection = await pool.getConnection();

    try {
      const query = `
      SELECT p.*, 
        u.username as owner_username,
        b.username as broker_username,
        b.email as broker_email,
        b.phone_number as broker_phone
      FROM properties p
      LEFT JOIN users u ON p.owner_user_id = u.id
      LEFT JOIN users b ON p.assigned_broker_id = b.id
      WHERE p.deleted_at IS NULL AND p.property_status = 'active' AND p.is_premium = 1
      ORDER BY p.published_at DESC
      LIMIT ?
    `;

      const [properties] = await connection.execute(query, [limit]);

      // Parse JSON fields and add square_meters mapping
      return properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        price_history: safeJsonParse(property.price_history, []),
        status_history: safeJsonParse(property.status_history, []),
        square_meters: property.sqft || 0,
      }));
    } catch (error) {
      console.error("Error getting premium properties:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // GET RECENT PROPERTIES
  async getRecent(limit = 10) {
    const connection = await pool.getConnection();

    try {
      const query = `
      SELECT p.*, 
        u.username as owner_username,
        b.username as broker_username,
        b.email as broker_email,
        b.phone_number as broker_phone
      FROM properties p
      LEFT JOIN users u ON p.owner_user_id = u.id
      LEFT JOIN users b ON p.assigned_broker_id = b.id
      WHERE p.deleted_at IS NULL AND p.property_status = 'active'
      ORDER BY p.created_at DESC
      LIMIT ?
    `;

      const [properties] = await connection.execute(query, [limit]);

      // Parse JSON fields and add square_meters mapping
      return properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        price_history: safeJsonParse(property.price_history, []),
        status_history: safeJsonParse(property.status_history, []),
        square_meters: property.sqft || 0,
      }));
    } catch (error) {
      console.error("Error getting recent properties:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // FIND PROPERTIES BY BROKER ID
  async findByBrokerId(brokerId, filters = {}, page = 1, limit = 20) {
    const connection = await pool.getConnection();

    try {
      let whereClauses = ["p.deleted_at IS NULL", "p.assigned_broker_id = ?"];
      const values = [brokerId];

      // Apply filters with status mapping
      if (filters.property_status) {
        // Map frontend status to database status
        const statusMap = {
          pending: ["pending_review", "pending", "draft"],
          approved: ["approved", "active"],
          rejected: ["rejected", "inactive"],
        };

        if (statusMap[filters.property_status]) {
          const placeholders = statusMap[filters.property_status]
            .map(() => "?")
            .join(",");
          whereClauses.push(`p.property_status IN (${placeholders})`);
          values.push(...statusMap[filters.property_status]);
        } else {
          whereClauses.push("p.property_status = ?");
          values.push(filters.property_status);
        }
      }

      if (filters.listing_type) {
        whereClauses.push("p.listing_type = ?");
        values.push(filters.listing_type);
      }

      if (filters.search) {
        whereClauses.push(
          "(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ? OR p.city LIKE ?)"
        );
        const searchValue = `%${filters.search}%`;
        values.push(searchValue, searchValue, searchValue, searchValue);
      }

      const where =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      // Count total
      const countQuery = `
      SELECT COUNT(*) as total 
      FROM properties p
      ${where}
    `;
      const [countResult] = await connection.execute(countQuery, values);
      const total = countResult[0].total;

      // Get paginated results
      const offset = (page - 1) * limit;
      const query = `
    SELECT p.*, 
      u.username as owner_username,
      u.email as owner_email,
      b.username as broker_username,
      b.email as broker_email,
      b.phone_number as broker_phone
    FROM properties p
    LEFT JOIN users u ON p.owner_user_id = u.id
    LEFT JOIN users b ON p.assigned_broker_id = b.id
    ${where}
    ORDER BY p.updated_at DESC
    LIMIT ? OFFSET ?
  `;

      const [properties] = await connection.execute(query, [...values, limit, offset]);

      // PARSE JSON FIELDS and add square_meters mapping
      const parsedProperties = properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        price_history: safeJsonParse(property.price_history, []),
        status_history: safeJsonParse(property.status_history, []),
        square_meters: property.sqft || 0,
      }));

      return {
        properties: parsedProperties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error finding properties by broker ID:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // UPDATE PROPERTY STATUS
  async updateStatus(id, status, userId, notes = "") {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get current property
      const currentProperty = await this.findById(id);
      if (!currentProperty) {
        throw new Error("Property not found");
      }

      const statusHistory = currentProperty.status_history || [];
      statusHistory.push({
        status: status,
        changed_at: new Date().toISOString(),
        changed_by: userId,
        notes: notes,
      });

      const updateFields = {
        property_status: status,
        status_history: JSON.stringify(statusHistory),
        updated_at: new Date(),
        last_modified_by_user_id: userId,
      };

      // Set published_at if status is active
      if (status === "active" && !currentProperty.published_at) {
        updateFields.published_at = new Date();
      }

      const setClause = Object.keys(updateFields)
        .map((field) => `${field} = ?`)
        .join(", ");
      const values = [...Object.values(updateFields), id];

      const query = `UPDATE properties SET ${setClause} WHERE id = ? AND deleted_at IS NULL`;

      const [result] = await connection.execute(query, values);

      if (result.affectedRows === 0) {
        throw new Error("Property not found or already deleted");
      }

      await connection.commit();

      // Return the updated property
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      console.error("Error updating property status:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // UPDATE PROPERTY PRICE
  async updatePrice(id, price, currency, userId) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get current property
      const currentProperty = await this.findById(id);
      if (!currentProperty) {
        throw new Error("Property not found");
      }

      const priceHistory = currentProperty.price_history || [];
      priceHistory.push({
        price: price,
        currency: currency || currentProperty.currency,
        changed_at: new Date().toISOString(),
        changed_by: userId,
      });

      const updateFields = {
        price: price,
        currency: currency || currentProperty.currency,
        price_history: JSON.stringify(priceHistory),
        updated_at: new Date(),
        last_modified_by_user_id: userId,
      };

      const setClause = Object.keys(updateFields)
        .map((field) => `${field} = ?`)
        .join(", ");
      const values = [...Object.values(updateFields), id];

      const query = `UPDATE properties SET ${setClause} WHERE id = ? AND deleted_at IS NULL`;

      const [result] = await connection.execute(query, values);

      if (result.affectedRows === 0) {
        throw new Error("Property not found or already deleted");
      }

      await connection.commit();

      // Return the updated property
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      console.error("Error updating property price:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // DELETE PROPERTY (soft delete)
  async delete(id, userId) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query = `
        UPDATE properties 
        SET deleted_at = ?, 
            last_modified_by_user_id = ?,
            updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [result] = await connection.execute(query, [
        new Date(),
        userId,
        new Date(),
        id
      ]);

      await connection.commit();

      return result.affectedRows > 0;

    } catch (error) {
      await connection.rollback();
      console.error("Error deleting property:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  async getAdminStats() {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN property_status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN property_status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN property_status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN property_status IN ('sold', 'rented') THEN 1 ELSE 0 END) as closed,
          SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted
        FROM properties
      `;

      const [result] = await connection.execute(query);
      return result[0];
    } catch (error) {
      console.error("Error getting admin stats:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // GET ALL PROPERTIES FOR ADMIN (includes deleted)
  async findAllAdmin(filters = {}, page = 1, limit = 50) {
    const connection = await pool.getConnection();
    try {
      const { status, broker_id, search, include_deleted = false } = filters;
      let whereClauses = ['1=1'];
      const values = [];

      if (!include_deleted) {
        whereClauses.push('deleted_at IS NULL');
      }

      if (status) {
        whereClauses.push('property_status = ?');
        values.push(status);
      }

      if (broker_id) {
        whereClauses.push('assigned_broker_id = ?');
        values.push(broker_id);
      }

      if (search) {
        whereClauses.push('(title LIKE ? OR address LIKE ? OR city LIKE ?)');
        const searchValue = `%${search}%`;
        values.push(searchValue, searchValue, searchValue);
      }

      const where = whereClauses.join(' AND ');

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM properties WHERE ${where}`;
      const [countResult] = await connection.execute(countQuery, values);
      const total = countResult[0].total;

      // Get paginated results
      const offset = (page - 1) * limit;
      const query = `
        SELECT p.*, 
          u.username as owner_username,
          u.email as owner_email,
          b.username as broker_username,
          b.email as broker_email
        FROM properties p
        LEFT JOIN users u ON p.owner_user_id = u.id
        LEFT JOIN users b ON p.assigned_broker_id = b.id
        WHERE ${where}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [properties] = await connection.execute(query, [...values, limit, offset]);

      // Parse JSON fields
      const parsedProperties = properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        price_history: safeJsonParse(property.price_history, []),
        status_history: safeJsonParse(property.status_history, []),
        square_meters: property.sqft || 0,
      }));

      return {
        properties: parsedProperties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error finding admin properties:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // PERMANENTLY DELETE PROPERTY (admin only)
  async permanentDelete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete related images first
      await connection.execute(
        'DELETE FROM property_images WHERE property_id = ?',
        [id]
      );

      // Delete the property
      const [result] = await connection.execute(
        'DELETE FROM properties WHERE id = ?',
        [id]
      );

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error("Error permanently deleting property:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // RESTORE DELETED PROPERTY
  async restore(id) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'UPDATE properties SET deleted_at = NULL, updated_at = NOW() WHERE id = ? AND deleted_at IS NOT NULL',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error restoring property:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  // ========== BUYER/RENTER METHODS ==========

  // Save/unsave property for user
  async toggleSave(propertyId, userId, save = true) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get current saved_by_users and saves_count
      const [result] = await connection.execute(
        'SELECT saved_by_users, saves_count FROM properties WHERE id = ?',
        [propertyId]
      );

      if (result.length === 0) {
        throw new Error('Property not found');
      }

      let savedByUsers = safeJsonParse(result[0].saved_by_users, []);
      let savesCount = result[0].saves_count || 0;

      console.log(`🔍 Current saves for property ${propertyId}:`, {
        savedByUsers,
        savesCount,
        userId,
        action: save ? 'save' : 'unsave'
      });

      if (save) {
        // Add user to saved list if not already there
        if (!savedByUsers.includes(userId)) {
          savedByUsers.push(userId);
          savesCount++;

          await connection.execute(
            'UPDATE properties SET saved_by_users = ?, saves_count = ? WHERE id = ?',
            [JSON.stringify(savedByUsers), savesCount, propertyId]
          );

          await connection.commit();
          console.log(`✅ Property ${propertyId} saved by user ${userId}. Total saves: ${savesCount}`);
          return { success: true, action: 'saved', savesCount };
        }
        console.log(`ℹ️ Property ${propertyId} already saved by user ${userId}`);
        return { success: false, message: 'Already saved', savesCount };
      } else {
        // Remove user from saved list
        const index = savedByUsers.indexOf(userId);
        if (index > -1) {
          savedByUsers.splice(index, 1);
          savesCount = Math.max(0, savesCount - 1);

          await connection.execute(
            'UPDATE properties SET saved_by_users = ?, saves_count = ? WHERE id = ?',
            [JSON.stringify(savedByUsers), savesCount, propertyId]
          );

          await connection.commit();
          console.log(`✅ Property ${propertyId} unsaved by user ${userId}. Total saves: ${savesCount}`);
          return { success: true, action: 'unsaved', savesCount };
        }
        console.log(`ℹ️ Property ${propertyId} not saved by user ${userId}`);
        return { success: false, message: 'Not saved yet', savesCount };
      }

    } catch (error) {
      await connection.rollback();
      console.error('❌ Error in toggleSave:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Check if property is saved by user
  async isSavedByUser(propertyId, userId) {
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        'SELECT saved_by_users FROM properties WHERE id = ?',
        [propertyId]
      );

      if (result.length === 0) return false;

      const savedByUsers = safeJsonParse(result[0].saved_by_users, []);
      return savedByUsers.includes(userId);

    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get user's saved properties
  async getSavedProperties(userId, page = 1, limit = 20) {
    const connection = await pool.getConnection();

    try {
      // Using JSON_CONTAINS to find properties saved by this user
      const query = `
        SELECT p.*, 
          u.username as owner_username,
          u.email as owner_email,
          TRUE as is_saved
        FROM properties p
        LEFT JOIN users u ON p.owner_user_id = u.id
        WHERE JSON_CONTAINS(p.saved_by_users, ?)
          AND p.deleted_at IS NULL
          AND p.property_status = 'active'
        ORDER BY p.updated_at DESC
        LIMIT ? OFFSET ?
      `;

      const offset = (page - 1) * limit;

      const [properties] = await connection.execute(query, [
        JSON.stringify([userId]),
        limit,
        offset
      ]);

      // Count total
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM properties 
         WHERE JSON_CONTAINS(saved_by_users, ?) 
           AND deleted_at IS NULL 
           AND property_status = 'active'`,
        [JSON.stringify([userId])]
      );

      const total = countResult[0].total;

      // Parse JSON fields
      const parsedProperties = properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        saved_by_users: safeJsonParse(property.saved_by_users, []),
        square_meters: property.sqft || 0,
      }));

      return {
        properties: parsedProperties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };

    } catch (error) {
      console.error("Error getting saved properties:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get recommended properties for user
  async getRecommendedProperties(userId, limit = 6) {
    const connection = await pool.getConnection();

    try {
      // First, get user preferences
      const userQuery = `
        SELECT 
          preferred_regions,
          preferred_cities,
          budget_min,
          budget_max,
          property_type,
          bedrooms,
          bathrooms,
          currency
        FROM users 
        WHERE id = ?
      `;

      const [userRows] = await connection.execute(userQuery, [userId]);

      if (userRows.length === 0) {
        return [];
      }

      const user = userRows[0];

      // Parse user preferences
      const preferredRegions = safeJsonParse(user.preferred_regions, []);
      const preferredCities = safeJsonParse(user.preferred_cities, []);
      const budgetMin = parseFloat(user.budget_min) || 0;
      const budgetMax = parseFloat(user.budget_max) || 50000000;
      const preferredPropertyType = user.property_type;
      const preferredBedrooms = parseInt(user.bedrooms) || 0;
      const preferredBathrooms = parseInt(user.bathrooms) || 0;

      // Build recommendation query based on user preferences
      let query = `
        SELECT DISTINCT p.*,
          u.username as owner_username
        FROM properties p
        LEFT JOIN users u ON p.owner_user_id = u.id
        WHERE p.deleted_at IS NULL 
          AND p.property_status = 'active'
      `;

      const params = [];

      // Exclude already saved properties
      query += ` AND NOT JSON_CONTAINS(COALESCE(p.saved_by_users, '[]'), ?)`;
      params.push(JSON.stringify([userId]));

      // Add region filter if user has preferred regions
      if (preferredRegions.length > 0) {
        const regionConditions = preferredRegions.map(() => {
          return `p.region LIKE CONCAT('%', ?, '%')`;
        }).join(' OR ');
        query += ` AND (${regionConditions})`;
        params.push(...preferredRegions);
      }

      // Add city filter if user has preferred cities
      if (preferredCities.length > 0) {
        const cityConditions = preferredCities.map(() => {
          return `p.city LIKE CONCAT('%', ?, '%')`;
        }).join(' OR ');
        query += ` AND (${cityConditions})`;
        params.push(...preferredCities);
      }

      // Add budget filter
      query += ` AND p.price BETWEEN ? AND ?`;
      params.push(budgetMin, budgetMax);

      // Add property type filter if specified
      if (preferredPropertyType) {
        query += ` AND p.property_type = ?`;
        params.push(preferredPropertyType);
      }

      // Add bedrooms filter if specified
      if (preferredBedrooms > 0) {
        query += ` AND p.beds >= ?`;
        params.push(preferredBedrooms);
      }

      // Add bathrooms filter if specified
      if (preferredBathrooms > 0) {
        query += ` AND p.baths >= ?`;
        params.push(preferredBathrooms);
      }

      // Build ORDER BY clause safely
      query += ` ORDER BY `;
      const orderConditions = [];

      // Add region priority if preferredRegions exists
      if (preferredRegions.length > 0) {
        orderConditions.push(`CASE WHEN p.region IN (${preferredRegions.map(() => '?').join(',')}) THEN 0 ELSE 1 END`);
        params.push(...preferredRegions);
      }

      // Add city priority if preferredCities exists
      if (preferredCities.length > 0) {
        orderConditions.push(`CASE WHEN p.city IN (${preferredCities.map(() => '?').join(',')}) THEN 0 ELSE 1 END`);
        params.push(...preferredCities);
      }

      // Always add budget proximity and other ordering
      orderConditions.push(`ABS(p.price - ((? + ?) / 2)) ASC`);
      params.push(budgetMin, budgetMax);
      orderConditions.push(`p.is_featured DESC`);
      orderConditions.push(`p.is_premium DESC`);
      orderConditions.push(`p.published_at DESC`);

      query += orderConditions.join(', ') + ` LIMIT ?`;
      params.push(limit);

      console.log('Generated query with params:', { query, params });

      const [properties] = await connection.execute(query, params);

      // If no properties match exact preferences, fallback to broader recommendations
      if (properties.length === 0) {
        console.log('No exact matches found, falling back to broader recommendations');

        // Fallback query: show properties without strict filters
        let fallbackQuery = `
          SELECT DISTINCT p.*,
            u.username as owner_username
          FROM properties p
          LEFT JOIN users u ON p.owner_user_id = u.id
          WHERE p.deleted_at IS NULL 
            AND p.property_status = 'active'
            AND NOT JSON_CONTAINS(COALESCE(p.saved_by_users, '[]'), ?)
        `;

        const fallbackParams = [JSON.stringify([userId])];

        // Only filter by region/city if available
        if (preferredRegions.length > 0 || preferredCities.length > 0) {
          fallbackQuery += ` AND (`;
          const conditions = [];

          if (preferredRegions.length > 0) {
            const regionConds = preferredRegions.map(() => `p.region LIKE CONCAT('%', ?, '%')`);
            conditions.push(`(${regionConds.join(' OR ')})`);
            fallbackParams.push(...preferredRegions);
          }

          if (preferredCities.length > 0) {
            const cityConds = preferredCities.map(() => `p.city LIKE CONCAT('%', ?, '%')`);
            conditions.push(`(${cityConds.join(' OR ')})`);
            fallbackParams.push(...preferredCities);
          }

          fallbackQuery += conditions.join(' OR ') + `)`;
        }

        fallbackQuery += `
          ORDER BY p.is_featured DESC, p.is_premium DESC, p.published_at DESC
          LIMIT ?
        `;

        fallbackParams.push(limit);

        const [fallbackProperties] = await connection.execute(fallbackQuery, fallbackParams);

        // Parse JSON fields for fallback properties
        return fallbackProperties.map((property) => ({
          ...property,
          features: safeJsonParse(property.features, []),
          amenities: safeJsonParse(property.amenities, []),
          property_tags: safeJsonParse(property.property_tags, []),
          square_meters: property.sqft || 0,
        }));
      }

      // Parse JSON fields for matched properties
      return properties.map((property) => ({
        ...property,
        features: safeJsonParse(property.features, []),
        amenities: safeJsonParse(property.amenities, []),
        property_tags: safeJsonParse(property.property_tags, []),
        square_meters: property.sqft || 0,
      }));

    } catch (error) {
      console.error("Error getting recommended properties:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
  // Track property view
  async trackView(propertyId, userId) {
    const connection = await pool.getConnection();

    try {
      // Get current viewed_by_users
      const [result] = await connection.execute(
        'SELECT viewed_by_users, views_count FROM properties WHERE id = ?',
        [propertyId]
      );

      if (result.length === 0) {
        throw new Error('Property not found');
      }

      let viewedByUsers = safeJsonParse(result[0].viewed_by_users, []);
      let viewsCount = result[0].views_count || 0;

      // Only track unique views per user
      if (!viewedByUsers.includes(userId)) {
        viewedByUsers.push(userId);
        viewsCount++;

        await connection.execute(
          'UPDATE properties SET viewed_by_users = ?, views_count = ? WHERE id = ?',
          [JSON.stringify(viewedByUsers), viewsCount, propertyId]
        );

        return { success: true, viewsCount };
      }

      return { success: false, message: 'Already viewed' };

    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }


} // END OF CLASS

// Export as a singleton instance
export default new PropertyModel();