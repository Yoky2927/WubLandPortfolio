// backend/property-service/models/propertyRequest.model.js
import pool from "../config/database.js";

// Helper function
const safeJsonParse = (str, defaultValue = []) => {
  try {
    return str ? JSON.parse(str) : defaultValue;
  } catch (error) {
    console.error("JSON parse error:", error);
    return defaultValue;
  }
};

class PropertyRequestModel {
  async create(requestData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Extract and validate all fields from your table schema
      const {
        user_id,
        user_type = "seller",
        property_type = "house",
        location,
        price = null,
        price_currency = "ETB",
        verification_method = "physical",
        description = "",
        property_image_url = null,
        property_images = [],
        current_step = 1,
        step_status = [1],
        selected_broker_id = null,
        status = "draft", // Changed from "pending" to "draft" to match your logs
        assigned_broker_id = null,
        property_data = {},
        notes = "",
      } = requestData;

      // IMPORTANT: Validate required fields
      if (!user_id) throw new Error("user_id is required");
      if (!property_type) throw new Error("property_type is required");
      if (!location) throw new Error("location is required");
      if (!price && price !== 0) throw new Error("price is required");

      // IMPORTANT: This matches your table schema exactly
      const query = `
      INSERT INTO property_requests (
        user_id, user_type, property_type, location, price, 
        price_currency, verification_method, description, 
        property_image_url, property_images, current_step, 
        step_status, selected_broker_id, status, assigned_broker_id, 
        property_data, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      // Convert arrays/objects to JSON strings
      const propertyImagesJson = JSON.stringify(property_images);
      const stepStatusJson = JSON.stringify(step_status);

      // Create property_data JSON including beds, baths, sqft if provided
      const enhancedPropertyData = {
        ...property_data,
        beds: requestData.beds || null,
        baths: requestData.baths || null,
        sqft: requestData.sqft || null,
      };
      const propertyDataJson = JSON.stringify(enhancedPropertyData);

      const values = [
        user_id,
        user_type,
        property_type,
        location || "",
        price,
        price_currency,
        verification_method,
        description,
        property_image_url,
        propertyImagesJson,
        current_step,
        stepStatusJson,
        selected_broker_id,
        status,
        assigned_broker_id,
        propertyDataJson,
        notes,
      ];

      console.log("📝 Creating property request with values:", {
        user_id,
        user_type,
        property_type,
        location,
        price,
        status,
        current_step,
      });

      const [result] = await connection.execute(query, values);
      const requestId = result.insertId;

      await connection.commit();
      console.log(`✅ Property request ${requestId} created successfully`);

      return await this.findById(requestId);
    } catch (error) {
      await connection.rollback();
      console.error("❌ Error creating property request:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(id) {
    try {
      const query = `
        SELECT pr.*, 
          u.first_name, u.last_name, u.email, u.phone_number,
          u.profile_picture,
          b.first_name as broker_first_name,
          b.last_name as broker_last_name,
          b.email as broker_email
        FROM property_requests pr
        LEFT JOIN users u ON pr.user_id = u.id
        LEFT JOIN users b ON pr.assigned_broker_id = b.id
        WHERE pr.id = ?
      `;
      const [requests] = await pool.execute(query, [id]);

      if (requests.length === 0) return null;

      const request = requests[0];

      // Parse JSON fields
      return {
        ...request,
        property_images: safeJsonParse(request.property_images, []),
        step_status: safeJsonParse(request.step_status, []),
        property_data: safeJsonParse(request.property_data, {}),
      };
    } catch (error) {
      console.error("Error finding property request by ID:", error);
      throw error;
    }
  }

  async findByBrokerId(brokerId, filters = {}) {
    try {
      let whereClauses = ["pr.assigned_broker_id = ?"];
      const values = [brokerId];

      if (filters.status) {
        whereClauses.push("pr.status = ?");
        values.push(filters.status);
      }

      if (filters.user_type) {
        whereClauses.push("pr.user_type = ?");
        values.push(filters.user_type);
      }

      const where = whereClauses.join(" AND ");

      const query = `
        SELECT pr.*, 
          u.first_name, u.last_name, u.email, u.phone_number,
          u.profile_picture
        FROM property_requests pr
        LEFT JOIN users u ON pr.user_id = u.id
        WHERE ${where}
        ORDER BY pr.created_at DESC
      `;

      const [requests] = await pool.execute(query, values);

      return requests.map((request) => ({
        ...request,
        property_images: safeJsonParse(request.property_images, []),
        step_status: safeJsonParse(request.step_status, []),
        property_data: safeJsonParse(request.property_data, {}),
      }));
    } catch (error) {
      console.error("Error finding property requests by broker ID:", error);
      throw error;
    }
  }

  async findByUserId(userId, filters = {}) {
    try {
      let whereClauses = ["pr.user_id = ?"];
      const values = [userId];

      if (filters.status) {
        whereClauses.push("pr.status = ?");
        values.push(filters.status);
      }

      const where = whereClauses.join(" AND ");

      const query = `
        SELECT pr.*, 
          u.first_name, u.last_name, u.email, u.phone_number,
          u.profile_picture,
          b.first_name as broker_first_name,
          b.last_name as broker_last_name,
          b.email as broker_email
        FROM property_requests pr
        LEFT JOIN users u ON pr.user_id = u.id
        LEFT JOIN users b ON pr.assigned_broker_id = b.id
        WHERE ${where}
        ORDER BY pr.created_at DESC
      `;

      const [requests] = await pool.execute(query, values);

      return requests.map((request) => ({
        ...request,
        property_images: safeJsonParse(request.property_images, []),
        step_status: safeJsonParse(request.step_status, []),
        property_data: safeJsonParse(request.property_data, {}),
      }));
    } catch (error) {
      console.error("Error finding property requests by user ID:", error);
      throw error;
    }
  }

  async getPendingRequests(filters = {}, brokerId = null) {
    try {
      let whereClauses = [];
      const values = [];

      // If brokerId is provided, show requests assigned to them OR pending
      if (brokerId) {
        whereClauses.push("(pr.status IN ('pending', 'assigned'))");
        whereClauses.push(
          "(pr.assigned_broker_id IS NULL OR pr.assigned_broker_id = ?)",
        );
        values.push(brokerId);
      } else {
        // For admin view or general view
        whereClauses.push('pr.status = "pending"');
      }

      if (filters.property_type) {
        whereClauses.push("pr.property_type = ?");
        values.push(filters.property_type);
      }

      if (filters.user_type) {
        whereClauses.push("pr.user_type = ?");
        values.push(filters.user_type);
      }

      if (filters.location) {
        whereClauses.push("pr.location LIKE ?");
        values.push(`%${filters.location}%`);
      }

      const where =
        whereClauses.length > 0 ? whereClauses.join(" AND ") : "1=1";

      const query = `
      SELECT pr.*, 
        u.first_name, u.last_name, u.email, u.phone_number,
        u.profile_picture,
        b.first_name as broker_first_name,
        b.last_name as broker_last_name
      FROM property_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN users b ON pr.assigned_broker_id = b.id
      WHERE ${where}
      ORDER BY 
        CASE 
          WHEN pr.status = 'assigned' AND pr.assigned_broker_id = ? THEN 1
          WHEN pr.status = 'pending' THEN 2
          ELSE 3
        END,
        pr.created_at DESC
    `;

      // Add brokerId again for ORDER BY clause
      if (brokerId) {
        values.push(brokerId);
      }

      console.log("📋 Executing query for pending requests:", {
        query,
        values,
      });

      const [requests] = await pool.execute(query, values);

      return requests.map((request) => ({
        ...request,
        property_images: this.safeJsonParse(request.property_images, []),
        step_status: this.safeJsonParse(request.step_status, []),
        property_data: this.safeJsonParse(request.property_data, {}),
        // Add client info
        client_name:
          request.first_name && request.last_name
            ? `${request.first_name} ${request.last_name}`
            : "Unknown Client",
        client_phone: request.phone_number || "N/A",
        client_email: request.email || "N/A",
        broker_name:
          request.broker_first_name && request.broker_last_name
            ? `${request.broker_first_name} ${request.broker_last_name}`
            : null,
      }));
    } catch (error) {
      console.error("Error getting pending requests:", error);
      throw error;
    }
  }

  async update(id, updates) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const updateFields = {};

      // Handle each field properly
      if (updates.property_type !== undefined)
        updateFields.property_type = updates.property_type;
      if (updates.location !== undefined)
        updateFields.location = updates.location;
      if (updates.price !== undefined) updateFields.price = updates.price;
      if (updates.description !== undefined)
        updateFields.description = updates.description;
      if (updates.status !== undefined) updateFields.status = updates.status;
      if (updates.current_step !== undefined)
        updateFields.current_step = updates.current_step;
      if (updates.assigned_broker_id !== undefined)
        updateFields.assigned_broker_id = updates.assigned_broker_id;
      if (updates.notes !== undefined) updateFields.notes = updates.notes;

      // Handle JSON fields
      if (updates.property_images !== undefined) {
        updateFields.property_images = JSON.stringify(updates.property_images);
      }
      if (updates.step_status !== undefined) {
        updateFields.step_status = JSON.stringify(updates.step_status);
      }
      if (updates.property_data !== undefined) {
        updateFields.property_data = JSON.stringify(updates.property_data);
      }

      // Set timestamps
      if (updates.assigned_broker_id && !updates.assigned_at) {
        updateFields.assigned_at = new Date();
      }

      updateFields.updated_at = new Date();

      if (Object.keys(updateFields).length === 0) {
        throw new Error("No valid fields to update");
      }

      const setClause = Object.keys(updateFields)
        .map((field) => `${field} = ?`)
        .join(", ");
      const values = [...Object.values(updateFields), id];

      const query = `UPDATE property_requests SET ${setClause} WHERE id = ?`;

      console.log("📝 Updating property request:", { id, updateFields });

      const [result] = await connection.execute(query, values);

      if (result.affectedRows === 0) {
        throw new Error("Property request not found");
      }

      await connection.commit();

      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      console.error("Error updating property request:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async brokerAcceptRequest(requestId, brokerId) {
    try {
      const request = await this.findById(requestId);

      if (!request) {
        throw new Error("Property request not found");
      }

      if (request.status !== "pending") {
        throw new Error(
          `Request is not pending. Current status: ${request.status}`,
        );
      }

      // Update to assigned status
      const updatedRequest = await this.update(requestId, {
        status: "assigned",
        assigned_broker_id: brokerId,
        current_step: 2,
        step_status: [1, 2],
      });

      return updatedRequest;
    } catch (error) {
      console.error("Error in broker accept request:", error);
      throw error;
    }
  }

  async updateStep(id, step, additionalData = {}) {
    try {
      const request = await this.findById(id);
      if (!request) throw new Error("Property request not found");

      // Get current step status
      const currentSteps = Array.isArray(request.step_status)
        ? request.step_status
        : [];

      // Add new step if not already included
      if (!currentSteps.includes(step)) {
        currentSteps.push(step);
      }

      // Prepare update data
      const updateData = {
        current_step: step,
        step_status: currentSteps,
        updated_at: new Date(),
      };

      // Merge additional data into property_data
      if (Object.keys(additionalData).length > 0) {
        const currentPropertyData =
          typeof request.property_data === "object"
            ? request.property_data
            : {};

        updateData.property_data = {
          ...currentPropertyData,
          ...additionalData,
        };
      }

      return await this.update(id, updateData);
    } catch (error) {
      console.error("Error updating request step:", error);
      throw error;
    }
  }

  async moveToNextStep(id) {
    try {
      const request = await this.findById(id);
      if (!request) throw new Error("Property request not found");

      const nextStep = request.current_step + 1;
      return await this.updateStep(id, nextStep);
    } catch (error) {
      console.error("Error moving to next step:", error);
      throw error;
    }
  }

  async getWorkflowStats(brokerId = null) {
    try {
      let query = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned_requests,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests
      FROM property_requests
      WHERE 1=1
    `;

      const params = [];

      if (brokerId) {
        query += " AND assigned_broker_id = ?";
        params.push(brokerId);
      }

      const [stats] = await pool.execute(query, params);

      // Get step distribution
      const [stepStats] = await pool.execute(
        `
      SELECT 
        current_step,
        COUNT(*) as count
      FROM property_requests
      WHERE assigned_broker_id = ? OR ? IS NULL
      GROUP BY current_step
      ORDER BY current_step
    `,
        [brokerId, brokerId],
      );

      return {
        ...stats[0],
        step_distribution: stepStats,
      };
    } catch (error) {
      console.error("Error getting workflow stats:", error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const [result] = await pool.execute(
        "DELETE FROM property_requests WHERE id = ?",
        [id],
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting property request:", error);
      throw error;
    }
  }
}

export default new PropertyRequestModel();
