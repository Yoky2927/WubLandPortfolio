// backend/property-service/controllers/propertyRequest.controller.js
import PropertyRequestModel from "../models/propertyRequest.model.js";
import PropertyModel from "../models/property.model.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import pool from "../config/database.js";
import NotificationService from "../services/notification.service.js";

class PropertyRequestController {
  // ========== MAIN ENDPOINTS ==========

  // CREATE PROPERTY REQUEST
  createRequest = async (req, res) => {
    try {
      console.log("📝 Creating property request");
      console.log("📦 Request body keys:", Object.keys(req.body));
      console.log(
        "📦 Request files (multer):",
        req.files ? `${req.files.length} files` : "No files",
      );
      console.log("👤 User:", req.user);

      const userId = req.user.id;
      const userRole = req.user.role;

      // Only sellers/landlords can create requests
      if (!["seller", "landlord", "user"].includes(userRole)) {
        return errorResponse(
          res,
          403,
          "Only property owners can create requests",
        );
      }

      // Handle FormData (multer)
      let propertyData = {};
      let propertyImages = [];

      // IMPORTANT: For FormData, property_data comes as a JSON string in req.body
      if (req.body && req.body.property_data) {
        console.log("📦 Found property_data in body");

        try {
          propertyData = JSON.parse(req.body.property_data);
          console.log("📦 Parsed property_data:", propertyData);
        } catch (parseError) {
          console.error("❌ Error parsing property_data:", parseError);
          console.error("📦 Raw property_data:", req.body.property_data);
          return errorResponse(res, 400, "Invalid property_data format");
        }
      } else {
        // Fallback: maybe it's JSON request (not FormData)
        propertyData = req.body || {};
        console.log("📦 Using req.body as property_data:", propertyData);
      }

      // ✅ Handle uploaded files from multer - FIXED VERSION
      if (req.files && req.files.length > 0) {
        console.log(`📸 Multer uploaded ${req.files.length} files`);

        // Debug: Log all files
        req.files.forEach((file, index) => {
          console.log(`📸 File ${index}:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path,
            destination: file.destination,
          });
        });

        // Try to get image metadata
        let imageMetadata = [];
        try {
          if (req.body && req.body.property_images_metadata) {
            imageMetadata = JSON.parse(req.body.property_images_metadata);
            console.log("📦 Image metadata:", imageMetadata);
          }
        } catch (e) {
          console.log("⚠️ Could not parse image metadata:", e.message);
        }

        propertyImages = req.files.map((file, index) => {
          // Get image type from metadata or guess from filename
          let imageType = "";

          // Try to get type from metadata
          if (imageMetadata && imageMetadata[index]) {
            imageType = imageMetadata[index].type || "";
          }

          // If not in metadata, try to guess from filename
          if (!imageType && file.originalname) {
            const filename = file.originalname.toLowerCase();
            if (
              filename.includes("outside") ||
              filename.includes("exterior") ||
              filename.includes("facade")
            ) {
              imageType = "outside_view";
            } else if (
              filename.includes("living") ||
              filename.includes("lounge") ||
              filename.includes("sitting")
            ) {
              imageType = "living_room";
            } else if (
              filename.includes("kitchen") ||
              filename.includes("cooking")
            ) {
              imageType = "kitchen";
            } else if (
              filename.includes("bedroom") ||
              filename.includes("bed")
            ) {
              imageType = "bedroom";
            } else if (
              filename.includes("bathroom") ||
              filename.includes("bath")
            ) {
              imageType = "bathroom";
            } else {
              imageType = "other";
            }
          }

          // IMPORTANT FIX: Convert Windows path to relative path
          let relativePath = "";
          let fullPath = file.path;

          // Check if it's a Windows path
          if (fullPath.includes("\\")) {
            // Convert Windows path to forward slashes
            fullPath = fullPath.replace(/\\/g, "/");

            // Extract just the relative part after 'uploads/temp/'
            const uploadsIndex = fullPath.indexOf("uploads/temp/");
            if (uploadsIndex !== -1) {
              relativePath = fullPath.substring(uploadsIndex);
            } else {
              // Fallback: just use the filename
              relativePath = `uploads/temp/${file.filename}`;
            }
          } else {
            // Already Unix-style path
            relativePath = `uploads/temp/${file.filename}`;
          }

          // Ensure the path starts correctly
          if (!relativePath.startsWith("uploads/")) {
            relativePath = `uploads/temp/${file.filename}`;
          }

          console.log(`🔄 Path conversion: ${file.path} -> ${relativePath}`);

          return {
            filename: file.filename, // Generated filename (e.g., 1769134394198-627265263-outside_view.jpg)
            originalname: file.originalname, // Original filename from user
            mimetype: file.mimetype,
            size: file.size,
            path: relativePath, // Use cleaned relative path
            full_path: file.path, // Keep original for debugging
            destination: file.destination,
            is_primary: index === 0,
            image_order: index,
            type: imageType,
            // Add URL for frontend convenience
            url: `http://localhost:5002/${relativePath}`,
            thumbnail: `http://localhost:5002/${relativePath}`,
          };
        });

        console.log(
          "📸 Processed propertyImages:",
          JSON.stringify(propertyImages, null, 2),
        );
      } else {
        console.log("⚠️ No files uploaded via multer");
      }

      // Prepare request data - IMPORTANT: Fix the property_images format
      const requestData = {
        ...propertyData,
        user_id: userId,
        user_type:
          propertyData.user_type ||
          (userRole === "landlord" ? "leaser" : "seller"),
        // Store property_images as a JSON array - ensure it's properly formatted
        property_images:
          propertyImages.length > 0
            ? JSON.stringify(propertyImages)
            : JSON.stringify([]),
        status: "draft",
        current_step: 1,
        step_status: JSON.stringify([1]),
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Validate required fields
      const requiredFields = ["location", "property_type", "price"];
      const missingFields = requiredFields.filter(
        (field) => !requestData[field],
      );

      if (missingFields.length > 0) {
        return errorResponse(
          res,
          400,
          `Missing required fields: ${missingFields.join(", ")}`,
        );
      }

      // Validate price
      if (isNaN(requestData.price) || parseFloat(requestData.price) <= 0) {
        return errorResponse(res, 400, "Valid price is required");
      }

      // Convert price to number
      requestData.price = parseFloat(requestData.price);

      // Set defaults
      if (!requestData.price_currency) requestData.price_currency = "ETB";
      if (!requestData.verification_method)
        requestData.verification_method = "physical";

      // Ensure beds, baths, sqft are numbers or null
      if (requestData.beds)
        requestData.beds = parseInt(requestData.beds) || null;
      if (requestData.baths)
        requestData.baths = parseFloat(requestData.baths) || null;
      if (requestData.sqft)
        requestData.sqft = parseInt(requestData.sqft) || null;

      console.log("📝 Final request data to save:", {
        ...requestData,
        property_images:
          propertyImages.length > 0
            ? `${propertyImages.length} images`
            : "No images",
        step_status: typeof requestData.step_status,
      });

      // Create request in database
      const request = await PropertyRequestModel.create(requestData);

      console.log(`✅ Property request ${request.id} created successfully`);

      // Log what was actually saved to database
      const [savedRequest] = await pool.execute(
        "SELECT id, property_images FROM property_requests WHERE id = ?",
        [request.id],
      );

      if (savedRequest.length > 0) {
        console.log(
          `📋 Saved request ${request.id} property_images:`,
          savedRequest[0].property_images,
        );

        // Test parse the saved JSON
        try {
          const parsed = JSON.parse(savedRequest[0].property_images);
          console.log(
            `✅ Successfully parsed saved property_images:`,
            Array.isArray(parsed) ? `${parsed.length} images` : parsed,
          );
        } catch (e) {
          console.error(`❌ Failed to parse saved property_images:`, e.message);
        }
      }

      // Try to notify brokers (ignore errors for now)
      try {
        await this.notifyBrokersOfNewRequest(request);
      } catch (notifyError) {
        console.log(
          "⚠️ Notification failed (can be ignored):",
          notifyError.message,
        );
      }

      successResponse(res, 201, "Property request created successfully", {
        request: {
          id: request.id,
          user_type: request.user_type,
          property_type: request.property_type,
          location: request.location,
          price: request.price,
          price_currency: request.price_currency,
          status: request.status,
          current_step: request.current_step,
          property_images: propertyImages, // Return the processed images array
          created_at: request.created_at,
        },
        image_info: {
          count: propertyImages.length,
          urls: propertyImages.map((img) => img.url),
          note: "Images are accessible at the provided URLs",
        },
        nextSteps: [
          "Your property details have been saved",
          "You can now proceed to select a broker",
          "A broker will help list your property",
        ],
      });
    } catch (error) {
      console.error("❌ Error creating property request:", error);
      errorResponse(res, 500, error.message);
    }
  };
  // GET USER'S REQUESTS
  getUserRequests = async (req, res) => {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      console.log(`📋 Getting requests for user ${userId}`);

      const filters = status ? { status } : {};
      const requests = await PropertyRequestModel.findByUserId(userId, filters);

      successResponse(res, 200, "Requests retrieved successfully", {
        requests,
        count: requests.length,
      });
    } catch (error) {
      console.error("Error getting user requests:", error);
      errorResponse(res, 500, error.message);
    }
  };

  // GET BROKER REQUESTS
  getBrokerRequests = async (req, res) => {
    try {
      const brokerId = req.user.id;
      const brokerRole = req.user.role;
      const { status, user_type, search } = req.query;

      console.log(`📋 Getting requests for broker ${brokerId}`);

      // Check if user is a broker
      if (
        ![
          "internal_broker",
          "external_broker",
          "admin",
          "super_admin",
        ].includes(brokerRole)
      ) {
        return errorResponse(res, 403, "Only brokers can view requests");
      }

      const filters = {};
      if (status) filters.status = status;
      if (user_type) filters.user_type = user_type;
      if (search) filters.search = search;

      const requests = await PropertyRequestModel.findByBrokerId(
        brokerId,
        filters,
      );

      successResponse(res, 200, "Broker requests retrieved successfully", {
        requests,
        count: requests.length,
      });
    } catch (error) {
      console.error("Error getting broker requests:", error);
      errorResponse(res, 500, error.message);
    }
  };

  // GET PENDING REQUESTS (for brokers to claim)
  // GET PENDING REQUESTS (for brokers to claim)
  getPendingRequests = async (req, res) => {
    try {
      const brokerRole = req.user.role;
      const brokerId = req.user.id;
      const { property_type, user_type, location } = req.query;

      console.log("📋 Getting pending requests for broker:", brokerId);

      // Check if user is a broker
      if (
        ![
          "internal_broker",
          "external_broker",
          "admin",
          "super_admin",
        ].includes(brokerRole)
      ) {
        return errorResponse(
          res,
          403,
          "Only brokers can view pending requests",
        );
      }

      // IMPORTANT: Brokers should see:
      // 1. Pending requests (not assigned to any broker)
      // 2. Requests assigned to THEM specifically
      const filters = {};
      if (property_type) filters.property_type = property_type;
      if (user_type) filters.user_type = user_type;
      if (location) filters.location = location;

      // Get pending AND assigned to this broker requests
      const [requests] = await pool.execute(
        `SELECT pr.*, 
        u.first_name, u.last_name, u.email, u.phone_number,
        u.profile_picture,
        CASE 
          WHEN pr.assigned_broker_id = ? THEN 'assigned_to_me'
          WHEN pr.assigned_broker_id IS NULL THEN 'available'
          ELSE 'assigned_to_other'
        END as request_status
      FROM property_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE (pr.status = 'pending' OR pr.status = 'assigned')
        AND (pr.assigned_broker_id IS NULL OR pr.assigned_broker_id = ?)
      ORDER BY 
        CASE 
          WHEN pr.status = 'assigned' AND pr.assigned_broker_id = ? THEN 1
          WHEN pr.status = 'pending' THEN 2
          ELSE 3
        END,
        pr.created_at DESC`,
        [brokerId, brokerId, brokerId],
      );

      // Parse JSON fields and format for frontend
      const formattedRequests = requests.map((request) => {
        // Parse property_images if it exists
        let propertyImages = [];
        if (request.property_images) {
          try {
            const parsedImages = JSON.parse(request.property_images);

            // Make sure it's an array
            const imagesArray = Array.isArray(parsedImages)
              ? parsedImages
              : [parsedImages];

            // Process each image to add proper URLs
            propertyImages = imagesArray
              .map((img, index) => {
                if (typeof img === "string") {
                  // If it's just a filename string
                  return {
                    filename: img,
                    url: `http://localhost:5002/uploads/temp/${img}`,
                    thumbnail: `http://localhost:5002/uploads/temp/${img}`,
                    type: "property",
                    is_primary: index === 0,
                  };
                } else if (typeof img === "object" && img !== null) {
                  // It's an image object with properties
                  const filename = img.filename || img.name || `image_${index}`;
                  const path = img.path || "";

                  // Generate proper URL
                  let url;
                  if (img.url && typeof img.url === "string") {
                    // If url is already set, use it
                    url = img.url;
                  } else if (path) {
                    // Use path to generate URL
                    const cleanPath = path.startsWith("/")
                      ? path.substring(1)
                      : path;
                    url = `http://localhost:5002/${cleanPath}`;
                  } else {
                    // Fallback to filename in temp folder
                    url = `http://localhost:5002/uploads/temp/${filename}`;
                  }

                  return {
                    ...img,
                    filename: filename,
                    url: url,
                    thumbnail: url,
                    is_primary: img.is_primary || index === 0,
                  };
                }
                return null;
              })
              .filter((img) => img !== null);

            console.log(
              `✅ Processed ${propertyImages.length} images for request ${request.id}`,
            );
          } catch (error) {
            console.error(
              "Error parsing property_images for request",
              request.id,
              ":",
              error.message,
            );
            console.error("Raw property_images:", request.property_images);
          }
        }

        // Parse property_data if it exists
        let propertyData = {};
        if (request.property_data) {
          try {
            propertyData = JSON.parse(request.property_data);
          } catch (error) {
            console.error("Error parsing property_data:", error);
          }
        }

        // Parse step_status if it exists
        let stepStatus = [];
        if (request.step_status) {
          try {
            stepStatus = JSON.parse(request.step_status);
          } catch (error) {
            console.error("Error parsing step_status:", error);
          }
        }

        return {
          id: request.id,
          request_id: request.id,
          title: request.property_type || "Property Request",
          description: request.description || "No description provided",
          budget: request.price || 0,
          price: request.price || 0,
          property_type: request.property_type || "house",
          location: request.location || "Address not specified",
          client_name:
            request.first_name && request.last_name
              ? `${request.first_name} ${request.last_name}`
              : "Unknown Client",
          client_phone: request.phone_number || "N/A",
          client_email: request.email || "N/A",
          status: request.status || "pending",
          request_status: request.request_status || "available",
          created_at: request.created_at || new Date().toISOString(),
          updated_at: request.updated_at,
          assigned_broker_id: request.assigned_broker_id,
          broker_id: request.assigned_broker_id,
          images: propertyImages, // This now has proper URLs
          property_data: propertyData,
          step_status: stepStatus,
          current_step: request.current_step || 1,
          user_id: request.user_id,
          user_type: request.user_type || "seller",
          price_currency: request.price_currency || "ETB",
          verification_method: request.verification_method || "physical",

          // Debug info
          _debug: {
            has_property_images: !!request.property_images,
            property_images_length: request.property_images?.length,
            processed_images_count: propertyImages.length,
            image_urls: propertyImages.map((img) => img.url),
          },
        };
      });

      console.log(
        `✅ Found ${formattedRequests.length} requests for broker ${brokerId}`,
      );

      // Log image info for debugging
      formattedRequests.forEach((req, index) => {
        if (req.images && req.images.length > 0) {
          console.log(`📸 Request ${req.id} has ${req.images.length} images:`);
          req.images.forEach((img, imgIndex) => {
            console.log(`   Image ${imgIndex}: ${img.url || "No URL"}`);
          });
        }
      });

      successResponse(res, 200, "Pending requests retrieved successfully", {
        requests: formattedRequests,
        count: formattedRequests.length,
        stats: {
          total: formattedRequests.length,
          available: formattedRequests.filter(
            (r) => r.request_status === "available",
          ).length,
          assigned_to_me: formattedRequests.filter(
            (r) => r.request_status === "assigned_to_me",
          ).length,
          assigned_to_other: formattedRequests.filter(
            (r) => r.request_status === "assigned_to_other",
          ).length,
        },
        note: "These requests are available for you to claim",
      });
    } catch (error) {
      console.error("Error getting pending requests:", error);
      errorResponse(res, 500, error.message);
    }
  };

  // Add this method to the PropertyRequestController class
  debugPropertyImages = async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log("🔍 Debugging property images for request:", requestId);
      console.log("👤 User:", { userId, userRole });

      // Get the request directly from database
      const [requests] = await pool.execute(
        "SELECT id, property_images, user_id, status FROM property_requests WHERE id = ?",
        [requestId],
      );

      if (requests.length === 0) {
        return errorResponse(res, 404, "Request not found");
      }

      const request = requests[0];

      // Check permissions
      const isOwner = request.user_id === userId;
      const isAssignedBroker = request.assigned_broker_id === userId;
      const isAdmin = ["admin", "super_admin"].includes(userRole);

      if (!isOwner && !isAssignedBroker && !isAdmin) {
        return errorResponse(res, 403, "Not authorized to view this request");
      }

      console.log("📸 Raw property_images from DB:", request.property_images);
      console.log("📸 Type:", typeof request.property_images);
      console.log("📸 Length:", request.property_images?.length);

      let parsedImages;
      let parseError = null;

      try {
        if (request.property_images) {
          // Try to parse as JSON
          parsedImages = JSON.parse(request.property_images);
          console.log("✅ Parsed JSON successfully");
          console.log("📸 Parsed type:", typeof parsedImages);
          console.log("📸 Is array?", Array.isArray(parsedImages));

          if (Array.isArray(parsedImages)) {
            console.log("📸 Array length:", parsedImages.length);
            if (parsedImages.length > 0) {
              console.log("📸 First item:", parsedImages[0]);
              console.log("📸 First item type:", typeof parsedImages[0]);

              // Try to parse first item if it's a string
              if (typeof parsedImages[0] === "string") {
                try {
                  const firstItemParsed = JSON.parse(parsedImages[0]);
                  console.log("📸 First item re-parsed:", firstItemParsed);
                } catch (e) {
                  console.log(
                    "📸 First item is plain string:",
                    parsedImages[0],
                  );
                }
              }
            }
          }
        } else {
          console.log("📸 property_images is null or empty");
        }
      } catch (parseErr) {
        parseError = parseErr.message;
        console.error("❌ Parse error:", parseErr);
        console.error(
          "❌ Raw string that failed:",
          request.property_images?.substring(0, 200),
        );
      }

      // Also check the property_data for images
      let propertyData = {};
      try {
        if (request.property_data) {
          propertyData = JSON.parse(request.property_data);
          console.log("📦 Property data parsed:", propertyData);
        }
      } catch (e) {
        console.error("❌ Error parsing property_data:", e);
      }

      successResponse(res, 200, "Debug info", {
        request: {
          id: request.id,
          user_id: request.user_id,
          status: request.status,
          has_property_images: !!request.property_images,
          property_images_length: request.property_images?.length,
          property_images_raw: request.property_images,
          property_data: propertyData,
        },
        parse: {
          parsedImages,
          parseError,
          isArray: Array.isArray(parsedImages),
          arrayLength: Array.isArray(parsedImages) ? parsedImages.length : null,
        },
        permissions: {
          isOwner,
          isAssignedBroker,
          isAdmin,
          hasAccess: isOwner || isAssignedBroker || isAdmin,
        },
        testUrls: {
          // Test URLs for debugging
          getPendingRequests: "GET /api/requests/pending",
          getBrokerRequests: "GET /api/requests/broker",
          getRequestById: `GET /api/requests/${requestId}`,
        },
      });
    } catch (error) {
      console.error("Debug error:", error);
      errorResponse(res, 500, error.message);
    }
  };
  // BROKER ACCEPT REQUEST
  brokerAcceptRequest = async (req, res) => {
    try {
      const brokerId = req.user.id;
      const brokerRole = req.user.role;
      const { requestId } = req.params; // This should come from URL params, not body

      console.log(`✅ Broker ${brokerId} accepting request ${requestId}`);
      console.log("📋 URL params:", req.params);
      console.log("📋 Request body:", req.body);

      // Check if user is a broker
      if (
        ![
          "internal_broker",
          "external_broker",
          "admin",
          "super_admin",
        ].includes(brokerRole)
      ) {
        return errorResponse(res, 403, "Only brokers can accept requests");
      }

      // Check if requestId is valid
      if (!requestId || isNaN(parseInt(requestId))) {
        return errorResponse(res, 400, "Invalid request ID");
      }

      // Accept the request
      const updatedRequest = await PropertyRequestModel.brokerAcceptRequest(
        requestId,
        brokerId,
      );

      if (!updatedRequest) {
        return errorResponse(res, 404, "Property request not found");
      }

      // ... rest of your code ...

      successResponse(res, 200, "Request accepted successfully", {
        request: updatedRequest,
        nextSteps: [
          "Contact the client to discuss property details",
          "Start creating the property listing draft",
          "Use the chat feature for communication",
        ],
        workflowStep: 2,
        showChat: true,
      });
    } catch (error) {
      console.error("❌ Error accepting request:", error);
      errorResponse(res, 500, error.message);
    }
  };

  // CREATE PROPERTY FROM REQUEST (BROKER ACTION)
  createPropertyFromRequest = async (req, res) => {
    try {
      const brokerId = req.user.id;
      const brokerRole = req.user.role;
      const { requestId } = req.params;
      const propertyData = req.body;

      console.log(`🏠 Creating property from request ${requestId}`);

      // Check if user is a broker
      if (
        ![
          "internal_broker",
          "external_broker",
          "admin",
          "super_admin",
        ].includes(brokerRole)
      ) {
        return errorResponse(
          res,
          403,
          "Only brokers can create properties from requests",
        );
      }

      // Get the request
      const request = await PropertyRequestModel.findById(requestId);

      if (!request) {
        return errorResponse(res, 404, "Property request not found");
      }

      // Check if broker is assigned to this request
      if (request.assigned_broker_id !== brokerId) {
        return errorResponse(res, 403, "You are not assigned to this request");
      }

      // Prepare property data
      const fullPropertyData = {
        ...propertyData,
        owner_user_id: request.user_id,
        assigned_broker_id: brokerId,
        created_by_user_id: brokerId,
        title: propertyData.title || `Property from Request #${requestId}`,
        description: propertyData.description || request.description || "",
        address: propertyData.address || request.location,
        property_status: "pending_client_approval", // Start workflow
        property_source: "client_listed",
      };

      // Create the property
      const property = await PropertyModel.create(fullPropertyData);

      // Update request to next step
      await PropertyRequestModel.updateStep(requestId, 3, {
        property_id: property.id,
        property_title: property.title,
        draft_created_at: new Date().toISOString(),
      });

      // Notify client about draft
      await this.notifyClientOfDraftCreation(
        request.user_id,
        property.id,
        brokerId,
      );

      // Move request to next workflow step
      await PropertyRequestModel.moveToNextStep(requestId);

      // ✅ Send notification via NotificationService
      await NotificationService.notifyDraftCreated(
        property.id,
        request.user_id,
        brokerId,
        property.title,
      );

      successResponse(res, 201, "Property draft created successfully", {
        property,
        requestStep: 3,
        nextAction: "client_review",
        message: "The client has been notified to review the draft",
      });
    } catch (error) {
      console.error("Error creating property from request:", error);
      errorResponse(res, 500, error.message);
    }
  };

  // CLIENT APPROVE PROPERTY DRAFT
  clientApproveDraft = async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { propertyId } = req.params;
      const { notes } = req.body;

      console.log(`✅ Client ${userId} approving property ${propertyId}`);

      // Check if user is owner
      if (!["seller", "landlord", "user"].includes(userRole)) {
        return errorResponse(
          res,
          403,
          "Only property owners can approve drafts",
        );
      }

      // Get property
      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Check ownership
      if (property.owner_user_id !== userId) {
        return errorResponse(res, 403, "You do not own this property");
      }

      // Check status
      if (property.property_status !== "pending_client_approval") {
        return errorResponse(
          res,
          400,
          `Property must be pending client approval. Current status: ${property.property_status}`,
        );
      }

      // Update property status
      const updatedProperty = await PropertyModel.update(propertyId, {
        property_status: "pending_admin_approval",
        updated_by: userId,
        notes: notes || "Client approved draft",
      });

      // Find associated request
      const [requests] = await pool.execute(
        `SELECT id FROM property_requests 
         WHERE user_id = ? AND assigned_broker_id = ? 
         ORDER BY created_at DESC LIMIT 1`,
        [userId, property.assigned_broker_id],
      );

      if (requests.length > 0) {
        // Update request to next step
        await PropertyRequestModel.updateStep(requests[0].id, 4, {
          property_approved_by_client_at: new Date().toISOString(),
          client_notes: notes,
        });

        await PropertyRequestModel.moveToNextStep(requests[0].id);
      }

      // Get user details for notifications
      const [clientInfo] = await pool.execute(
        "SELECT first_name, last_name FROM users WHERE id = ?",
        [userId],
      );

      const clientName =
        clientInfo.length > 0
          ? `${clientInfo[0].first_name} ${clientInfo[0].last_name}`
          : "Client";

      // Notify broker
      await this.notifyBrokerOfClientApproval(
        property.assigned_broker_id,
        propertyId,
        userId,
      );

      // Notify admins
      await this.notifyAdminsOfNewListing(propertyId, property.title, userId);

      // ✅ Send notifications via NotificationService
      await NotificationService.notifyClientApproved(
        propertyId,
        property.assigned_broker_id,
        property.title,
      );

      await NotificationService.notifyAdminApprovalNeeded(
        propertyId,
        property.title,
        clientName,
      );

      successResponse(
        res,
        200,
        "Property approved and sent for admin verification",
        {
          property: updatedProperty,
          nextStep: "admin_review",
          estimatedTime: "24-48 hours",
          message: "Your property is now pending admin verification",
        },
      );
    } catch (error) {
      console.error("Error approving property draft:", error);
      errorResponse(res, 500, error.message);
    }
  };

  // CLIENT REQUEST CHANGES
  clientRequestChanges = async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { propertyId } = req.params;
      const { changesRequested, notes } = req.body;

      console.log(
        `✏️ Client ${userId} requesting changes for property ${propertyId}`,
      );

      if (!changesRequested) {
        return errorResponse(
          res,
          400,
          "Please specify what changes are needed",
        );
      }

      // Check if user is owner
      if (!["seller", "landlord", "user"].includes(userRole)) {
        return errorResponse(
          res,
          403,
          "Only property owners can request changes",
        );
      }

      // Get property
      const property = await PropertyModel.findById(propertyId);

      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Check ownership
      if (property.owner_user_id !== userId) {
        return errorResponse(res, 403, "You do not own this property");
      }

      // Check status
      if (property.property_status !== "pending_client_approval") {
        return errorResponse(
          res,
          400,
          `Property must be pending client approval. Current status: ${property.property_status}`,
        );
      }

      // Update property status back to draft
      const updatedProperty = await PropertyModel.update(propertyId, {
        property_status: "draft",
        updated_by: userId,
        notes: `Client requested changes: ${changesRequested}. ${notes || ""}`,
      });

      // Notify broker
      await this.notifyBrokerOfChangeRequest(
        property.assigned_broker_id,
        propertyId,
        changesRequested,
        notes,
      );

      successResponse(res, 200, "Change request sent to broker", {
        property: updatedProperty,
        message: "Your broker has been notified of the requested changes",
      });
    } catch (error) {
      console.error("Error requesting changes:", error);
      errorResponse(res, 500, error.message);
    }
  };

  // GET REQUEST WORKFLOW STATUS
  getRequestWorkflow = async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log(`📊 Getting workflow for request ${requestId}`);

      const request = await PropertyRequestModel.findById(requestId);

      if (!request) {
        return errorResponse(res, 404, "Property request not found");
      }

      // Check permissions
      const isOwner = request.user_id === userId;
      const isAssignedBroker = request.assigned_broker_id === userId;
      const isAdmin = ["admin", "super_admin"].includes(userRole);

      if (!isOwner && !isAssignedBroker && !isAdmin) {
        return errorResponse(res, 403, "Not authorized to view this request");
      }

      // Get associated property if exists
      let property = null;
      if (request.property_data?.property_id) {
        property = await PropertyModel.findById(
          request.property_data.property_id,
        );
      }

      // Define workflow steps
      const workflowSteps = [
        {
          step: 1,
          name: "Request Submitted",
          description: "Client submitted property request",
        },
        {
          step: 2,
          name: "Broker Assigned",
          description: "Broker accepted the request",
        },
        {
          step: 3,
          name: "Property Draft Created",
          description: "Broker created property listing draft",
        },
        {
          step: 4,
          name: "Client Review",
          description: "Client reviewing the property draft",
        },
        {
          step: 5,
          name: "Admin Verification",
          description: "Admin verifying the property",
        },
        {
          step: 6,
          name: "Property Live",
          description: "Property published and active",
        },
      ];

      successResponse(res, 200, "Workflow retrieved successfully", {
        request,
        property,
        workflowSteps,
        currentStep: request.current_step,
        completedSteps: request.step_status || [],
        nextStep: request.current_step < 6 ? request.current_step + 1 : null,
        canChat: isAssignedBroker || isOwner,
        chatParticipants: {
          client: request.user_id,
          broker: request.assigned_broker_id,
        },
      });
    } catch (error) {
      console.error("Error getting request workflow:", error);
      errorResponse(res, 500, error.message);
    }
  };

  assignBroker = async (req, res) => {
    try {
      const { requestId } = req.params;
      const { brokerId } = req.body;
      const userId = req.user.id;

      console.log(
        `🤝 Client assigning broker ${brokerId} to request ${requestId}`,
      );

      // Verify the request belongs to the user
      const [requests] = await pool.execute(
        "SELECT * FROM property_requests WHERE id = ? AND user_id = ?",
        [requestId, userId],
      );

      if (requests.length === 0) {
        return errorResponse(res, 404, "Property request not found");
      }

      const request = requests[0];

      // Check if request is in draft status
      if (request.status !== "draft") {
        return errorResponse(
          res,
          400,
          "Cannot assign broker to a request that is not in draft status",
        );
      }

      // Verify broker exists and is active
      const [brokers] = await pool.execute(
        "SELECT * FROM users WHERE id = ? AND role IN ('internal_broker', 'external_broker') AND status = 'active'",
        [brokerId],
      );

      if (brokers.length === 0) {
        return errorResponse(res, 404, "Broker not found or not active");
      }

      const broker = brokers[0];

      // Update the request with broker assignment
      await pool.execute(
        `UPDATE property_requests 
       SET assigned_broker_id = ?, 
           selected_broker_id = ?,
           status = 'assigned', 
           broker_selected_at = NOW(),
           assigned_at = NOW(),
           current_step = 2,
           updated_at = NOW() 
       WHERE id = ?`,
        [brokerId, brokerId, requestId],
      );

      // Add to workflow history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: "client_broker_assignment",
        user_id: userId,
        broker_id: brokerId,
        notes: `Client assigned broker ${broker.first_name} ${broker.last_name} to the request`,
        metadata: {
          broker_name: `${broker.first_name} ${broker.last_name}`,
          broker_email: broker.email,
          broker_phone: broker.phone_number,
          assignment_type: "client_selected",
        },
      };

      // Get existing workflow history
      const [currentHistory] = await pool.execute(
        "SELECT workflow_history FROM property_requests WHERE id = ?",
        [requestId],
      );

      let workflowHistory = [];
      if (currentHistory[0]?.workflow_history) {
        try {
          workflowHistory = JSON.parse(currentHistory[0].workflow_history);
        } catch (e) {
          console.log("⚠️ Could not parse workflow history:", e.message);
        }
      }

      workflowHistory.push(historyEntry);

      // Update workflow history
      await pool.execute(
        "UPDATE property_requests SET workflow_history = ? WHERE id = ?",
        [JSON.stringify(workflowHistory), requestId],
      );

      // Update step status
      await this.updateStepStatus(requestId, 2, "completed");

      // Get updated request with broker details
      const [updatedRequests] = await pool.execute(
        `SELECT pr.*, 
        u.first_name as broker_first_name,
        u.last_name as broker_last_name,
        u.email as broker_email,
        u.phone_number as broker_phone,
        u.profile_picture as broker_profile_picture,
        u.brokerage_firm,
        u.commission_rate,
        u.experience_years
      FROM property_requests pr
      LEFT JOIN users u ON pr.assigned_broker_id = u.id
      WHERE pr.id = ?`,
        [requestId],
      );

      const updatedRequest = updatedRequests[0];

      // ✅ Send notifications
      try {
        // Notify broker
        await NotificationService.sendNotification({
          userId: brokerId,
          title: "New Property Request Assigned",
          message: `You have been assigned to a ${request.property_type} request in ${request.location}. Price: ${request.price} ${request.price_currency}`,
          type: "info",
          actionUrl: `/broker/requests/${requestId}`,
          metadata: {
            entityType: "property_request",
            entityId: requestId,
            priority: "medium",
          },
        });

        // Notify client
        await NotificationService.sendNotification({
          userId: userId,
          title: "Broker Successfully Assigned",
          message: `Broker ${broker.first_name} ${broker.last_name} has been assigned to your property request. They will contact you soon.`,
          type: "success",
          actionUrl: `/dashboard/requests/${requestId}`,
          metadata: {
            entityType: "property_request",
            entityId: requestId,
            brokerId: brokerId,
          },
        });
      } catch (notifyError) {
        console.log(
          "⚠️ Notification failed (can be ignored):",
          notifyError.message,
        );
      }

      successResponse(res, 200, "Broker assigned successfully", {
        request: {
          id: updatedRequest.id,
          status: updatedRequest.status,
          current_step: updatedRequest.current_step,
          broker: {
            id: brokerId,
            name: `${broker.first_name} ${broker.last_name}`,
            email: broker.email,
            phone: broker.phone_number,
            profile_picture: broker.profile_picture,
            brokerage_firm: broker.brokerage_firm,
            commission_rate: broker.commission_rate,
            experience_years: broker.experience_years,
          },
          assigned_at: new Date().toISOString(),
        },
        nextSteps: [
          "Your broker has been notified",
          "The broker will contact you within 24 hours",
          "You can now proceed to schedule property inspection",
        ],
      });
    } catch (error) {
      console.error("❌ Error assigning broker:", error);
      errorResponse(res, 500, error.message);
    }
  };

  // Helper function to update step status
  updateStepStatus = async (requestId, step, status) => {
    try {
      // Get current step status
      const [requests] = await pool.execute(
        "SELECT step_status FROM property_requests WHERE id = ?",
        [requestId],
      );

      let stepStatus = [];
      if (requests.length > 0 && requests[0].step_status) {
        try {
          stepStatus = JSON.parse(requests[0].step_status);
        } catch (e) {
          console.log("⚠️ Could not parse step status:", e.message);
        }
      }

      // Update or add the step status
      const stepIndex = stepStatus.findIndex((s) => s.step === step);
      if (stepIndex >= 0) {
        stepStatus[stepIndex] = {
          step,
          status,
          updated_at: new Date().toISOString(),
        };
      } else {
        stepStatus.push({ step, status, created_at: new Date().toISOString() });
      }

      // Save back to database
      await pool.execute(
        "UPDATE property_requests SET step_status = ? WHERE id = ?",
        [JSON.stringify(stepStatus), requestId],
      );
    } catch (error) {
      console.error("Error updating step status:", error);
    }
  };

  // GET WORKFLOW STATS
  getWorkflowStats = async (req, res) => {
    try {
      const userRole = req.user.role;
      const brokerId = req.user.id;

      console.log(`📈 Getting workflow stats for user ${brokerId}`);

      let stats;
      if (["internal_broker", "external_broker"].includes(userRole)) {
        stats = await PropertyRequestModel.getWorkflowStats(brokerId);
      } else if (["admin", "super_admin"].includes(userRole)) {
        stats = await PropertyRequestModel.getWorkflowStats();
      } else {
        return errorResponse(res, 403, "Access denied");
      }

      successResponse(res, 200, "Workflow stats retrieved", stats);
    } catch (error) {
      console.error("Error getting workflow stats:", error);
      errorResponse(res, 500, error.message);
    }
  };

  // ========== HELPER METHODS (also arrow functions) ==========

  notifyBrokersOfNewRequest = async (request) => {
    try {
      console.log(`📢 Notifying brokers of new request ${request.id}`);

      // FIX: Remove is_active check since it doesn't exist in your users table
      const [brokers] = await pool.execute(
        "SELECT id FROM users WHERE role IN ('internal_broker', 'external_broker')",
        // Removed: AND is_active = 1
      );

      console.log(`📢 Found ${brokers.length} brokers to notify`);

      // Only proceed if there are brokers
      if (brokers.length === 0) {
        console.log("⚠️ No brokers found to notify");
        return;
      }

      for (const broker of brokers) {
        try {
          await NotificationService.sendNotification({
            userId: broker.id,
            title: "New Property Request",
            message: `New ${request.property_type} request in ${request.location}. Price: ${request.price} ${request.price_currency}`,
            type: "info",
            actionUrl: `/broker/requests/${request.id}`,
            metadata: {
              entityType: "property_request",
              entityId: request.id,
              priority: "medium",
            },
          });
        } catch (brokerError) {
          console.error(
            `❌ Failed to notify broker ${broker.id}:`,
            brokerError.message,
          );
        }
      }

      console.log(`✅ Notified ${brokers.length} brokers about new request`);
    } catch (error) {
      console.error("Error notifying brokers:", error.message);
      // Don't throw - this shouldn't fail the main request
    }
  };

  notifyClientOfBrokerAssignment = async (clientId, brokerId, requestId) => {
    try {
      console.log(`📢 Notifying client ${clientId} of broker assignment`);

      // Get broker details
      const [brokerInfo] = await pool.execute(
        "SELECT first_name, last_name FROM users WHERE id = ?",
        [brokerId],
      );

      const brokerName =
        brokerInfo.length > 0
          ? `${brokerInfo[0].first_name} ${brokerInfo[0].last_name}`
          : "Professional Broker";

      await NotificationService.sendNotification({
        userId: clientId,
        title: "Broker Assigned",
        message: `Your property request has been assigned to broker ${brokerName}. You can now discuss details.`,
        type: "success",
        actionUrl: `/dashboard/requests/${requestId}`,
        metadata: {
          entityType: "property_request",
          entityId: requestId,
          brokerId: brokerId,
          priority: "high",
        },
      });

      // Also send chat availability notification
      await NotificationService.notifyChatAvailable(
        requestId,
        clientId,
        brokerId,
        "Client", // clientName
        brokerName,
      );
    } catch (error) {
      console.error("Error notifying client:", error);
    }
  };

  notifyClientOfDraftCreation = async (clientId, propertyId, brokerId) => {
    try {
      console.log(`📢 Notifying client ${clientId} of draft creation`);

      // Get property details
      const [propertyInfo] = await pool.execute(
        "SELECT title FROM properties WHERE id = ?",
        [propertyId],
      );

      const propertyTitle =
        propertyInfo.length > 0 ? propertyInfo[0].title : "Your property draft";

      await NotificationService.notifyDraftCreated(
        propertyId,
        clientId,
        brokerId,
        propertyTitle,
      );
    } catch (error) {
      console.error("Error notifying client:", error);
    }
  };

  notifyBrokerOfClientApproval = async (brokerId, propertyId, clientId) => {
    try {
      console.log(`📢 Notifying broker ${brokerId} of client approval`);

      // Get property details
      const [propertyInfo] = await pool.execute(
        "SELECT title FROM properties WHERE id = ?",
        [propertyId],
      );

      const propertyTitle =
        propertyInfo.length > 0 ? propertyInfo[0].title : "Property draft";

      await NotificationService.notifyClientApproved(
        propertyId,
        brokerId,
        propertyTitle,
      );
    } catch (error) {
      console.error("Error notifying broker:", error);
    }
  };

  notifyBrokerOfChangeRequest = async (
    brokerId,
    propertyId,
    changes,
    notes,
  ) => {
    try {
      console.log(`📢 Notifying broker ${brokerId} of change request`);

      // Get property details
      const [propertyInfo] = await pool.execute(
        "SELECT title FROM properties WHERE id = ?",
        [propertyId],
      );

      const propertyTitle =
        propertyInfo.length > 0 ? propertyInfo[0].title : "Property";

      await NotificationService.sendNotification({
        userId: brokerId,
        title: "Client Requested Changes",
        message: `Client requested changes to "${propertyTitle}": ${changes}`,
        type: "warning",
        actionUrl: `/broker/properties/${propertyId}/edit`,
        metadata: {
          entityType: "property",
          entityId: propertyId,
          changesRequested: changes,
          notes: notes || "",
          priority: "high",
        },
      });
    } catch (error) {
      console.error("Error notifying broker:", error);
    }
  };

  notifyAdminsOfNewListing = async (propertyId, title, clientId) => {
    try {
      console.log(`📢 Notifying admins of new listing ${propertyId}`);

      // Get admin users
      const [admins] = await pool.execute(
        "SELECT id, first_name, last_name FROM users WHERE role IN ('admin', 'super_admin')",
      );

      for (const admin of admins) {
        await NotificationService.sendNotification({
          userId: admin.id,
          title: "New Listing for Approval",
          message: `New property "${title}" requires admin verification.`,
          type: "warning",
          actionUrl: `/admin/properties/${propertyId}/review`,
          metadata: {
            entityType: "property",
            entityId: propertyId,
            clientId: clientId,
            priority: "high",
          },
        });
      }

      console.log(`✅ Notified ${admins.length} admins about new listing`);
    } catch (error) {
      console.error("Error notifying admins:", error);
    }
  };
}

export default new PropertyRequestController();
