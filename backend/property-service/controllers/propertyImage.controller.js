// controllers/propertyImage.controller.js
import PropertyModel from "../models/property.model.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

class PropertyImageController {
  
  async uploadImages(req, res) {
    try {
      const { id } = req.params;
      const files = req.files;
      const userId = req.user.id;
      
      if (!files || files.length === 0) {
        return errorResponse(res, 400, "No files uploaded");
      }
      
      const uploadedImages = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create thumbnail
        const thumbnailFilename = `thumb-${file.filename}`;
        const thumbnailPath = path.join('uploads/property-images/thumbnails', thumbnailFilename);
        
        // Ensure thumbnail directory exists
        const thumbnailDir = path.dirname(thumbnailPath);
        if (!fs.existsSync(thumbnailDir)) {
          fs.mkdirSync(thumbnailDir, { recursive: true });
        }
        
        // Generate thumbnail (300x300)
        await sharp(file.path)
          .resize(300, 300, { fit: 'cover' })
          .toFile(thumbnailPath);
        
        const imageData = {
          image_url: `/uploads/property-images/${file.filename}`,
          thumbnail_url: `/uploads/property-images/thumbnails/${thumbnailFilename}`,
          caption: req.body[`caption_${i}`] || req.body.caption || '',
          alt_text: req.body[`alt_text_${i}`] || req.body.alt_text || file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          width: 0, // You can extract from image metadata if needed
          height: 0,
          is_primary: uploadedImages.length === 0 && i === 0, // First image is primary
          uploaded_by_user_id: userId
        };
        
        const image = await PropertyModel.addImage(id, imageData);
        uploadedImages.push(image);
      }
      
      successResponse(res, 200, "Images uploaded successfully", {
        images: uploadedImages,
        total: uploadedImages.length
      });
      
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
  
  async uploadFloorPlan(req, res) {
    try {
      const { id } = req.params;
      const file = req.file;
      const userId = req.user.id;
      
      if (!file) {
        return errorResponse(res, 400, "No file uploaded");
      }
      
      // For floor plans, we might not create thumbnails
      const floorPlanData = {
        image_url: `/uploads/property-images/${file.filename}`,
        thumbnail_url: `/uploads/property-images/${file.filename}`, // Same as original for floor plans
        caption: req.body.caption || 'Floor Plan',
        alt_text: req.body.alt_text || 'Property Floor Plan',
        file_size: file.size,
        mime_type: file.mimetype,
        width: 0,
        height: 0,
        is_primary: false, // Floor plans are never primary
        uploaded_by_user_id: userId,
        image_order: 999 // High order to separate from regular images
      };
      
      const floorPlan = await PropertyModel.addImage(id, floorPlanData);
      
      successResponse(res, 200, "Floor plan uploaded successfully", {
        ...floorPlan,
        is_floor_plan: true
      });
      
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
  
  async getPropertyImages(req, res) {
    try {
      const { id } = req.params;
      
      const images = await PropertyModel.getImages(id);
      
      successResponse(res, 200, "Property images retrieved successfully", images);
      
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
  
  async getFloorPlans(req, res) {
    try {
      const { id } = req.params;
      
      const floorPlans = await PropertyModel.getFloorPlans(id);
      
      successResponse(res, 200, "Floor plans retrieved successfully", floorPlans);
      
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
  
  async setPrimaryImage(req, res) {
    try {
      const { imageId } = req.params;
      const { propertyId } = req.body;
      
      if (!propertyId) {
        return errorResponse(res, 400, "Property ID is required");
      }
      
      const result = await PropertyModel.setPrimaryImage(propertyId, imageId);
      
      if (result) {
        successResponse(res, 200, "Primary image set successfully");
      } else {
        errorResponse(res, 404, "Image not found");
      }
      
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
  
  async deleteImage(req, res) {
    try {
      const { imageId } = req.params;
      const { propertyId } = req.body;
      const userId = req.user.id;
      
      if (!propertyId) {
        return errorResponse(res, 400, "Property ID is required");
      }
      
      const result = await PropertyModel.deleteImage(imageId, userId);
      
      if (result) {
        successResponse(res, 200, "Image deleted successfully");
      } else {
        errorResponse(res, 404, "Image not found");
      }
      
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
  
  async updateImageDetails(req, res) {
    try {
      const { imageId } = req.params;
      const updates = req.body;
      
      const allowedUpdates = ['caption', 'alt_text', 'image_order'];
      const validUpdates = {};
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          validUpdates[field] = updates[field];
        }
      });
      
      if (Object.keys(validUpdates).length === 0) {
        return errorResponse(res, 400, "No valid updates provided");
      }
      
      // You'll need to add an updateImage method to PropertyModel
      // const result = await PropertyModel.updateImage(imageId, validUpdates);
      
      successResponse(res, 200, "Image details updated successfully");
      
    } catch (error) {
      errorResponse(res, 500, error.message);
    }
  }
}

export default new PropertyImageController();