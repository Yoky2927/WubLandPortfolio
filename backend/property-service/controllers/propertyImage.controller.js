// backend/property-service/controllers/propertyImage.controller.js - FIXED
import { successResponse, errorResponse } from '../utils/responseHandler.js';

// ADD DEBUG LOGGING
console.log('🔧 Loading PropertyImageController...');

class PropertyImageController {
    // Get all images for a property
    async getPropertyImages(req, res) {
        try {
            console.log('📸 getPropertyImages called for property:', req.params.id);
            
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                console.log('❌ Invalid property ID:', id);
                return errorResponse(res, 400, 'Valid property ID is required');
            }
            
            // Lazy load PropertyModel to avoid import issues
            const PropertyModel = await import('../models/property.model.js');
            
            console.log('📸 Fetching images from database...');
            const images = await PropertyModel.default.getImages(id);
            console.log('📸 Found images:', images.length);
            
            // Separate regular images from floor plans
            const regularImages = images.filter(img => {
                const caption = img.caption || '';
                return !caption.toLowerCase().includes('floor plan') &&
                       !caption.toLowerCase().includes('floorplan') &&
                       (img.image_order || 0) < 999;
            });
            
            console.log('📸 Regular images:', regularImages.length);
            
            successResponse(res, 200, 'Property images retrieved successfully', {
                images: regularImages,
                count: regularImages.length
            });
        } catch (error) {
            console.error('❌ getPropertyImages ERROR:', error.message);
            console.error('❌ Stack trace:', error.stack);
            errorResponse(res, 500, error.message);
        }
    }

    // Get floor plans for a property
    async getFloorPlans(req, res) {
        try {
            console.log('📐 getFloorPlans called for property:', req.params.id);
            
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return errorResponse(res, 400, 'Valid property ID is required');
            }
            
            // Lazy load PropertyModel
            const PropertyModel = await import('../models/property.model.js');
            
            const floorPlans = await PropertyModel.default.getFloorPlans(id);
            
            successResponse(res, 200, 'Floor plans retrieved successfully', {
                floor_plans: floorPlans,
                count: floorPlans.length
            });
        } catch (error) {
            console.error('❌ getFloorPlans ERROR:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    // Upload images for a property
    async uploadImages(req, res) {
        try {
            const { id } = req.params;
            const files = req.files;
            const userId = req.user?.id;
            
            if (!id || isNaN(id)) {
                return errorResponse(res, 400, 'Valid property ID is required');
            }
            
            if (!files || files.length === 0) {
                return errorResponse(res, 400, 'No images uploaded');
            }
            
            // Lazy load PropertyModel
            const PropertyModel = await import('../models/property.model.js');
            
            // Check if property exists
            const property = await PropertyModel.default.findById(id);
            if (!property) {
                return errorResponse(res, 404, 'Property not found');
            }
            
            const uploadedImages = [];
            
            // Process each image
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                const imageData = {
                    image_url: `/uploads/property-images/${file.filename}`,
                    thumbnail_url: `/uploads/property-images/${file.filename}`,
                    caption: req.body[`caption_${i}`] || req.body.caption || '',
                    alt_text: req.body[`alt_text_${i}`] || req.body.alt_text || file.originalname,
                    file_size: file.size,
                    mime_type: file.mimetype,
                    width: 0,
                    height: 0,
                    is_primary: i === 0 && !property.images?.some(img => img.is_primary),
                    image_order: i,
                    uploaded_by_user_id: userId
                };
                
                const uploadedImage = await PropertyModel.default.addImage(id, imageData);
                uploadedImages.push(uploadedImage);
            }
            
            successResponse(res, 201, 'Images uploaded successfully', {
                images: uploadedImages,
                count: uploadedImages.length
            });
        } catch (error) {
            console.error('❌ uploadImages ERROR:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    // Upload floor plan for a property
    async uploadFloorPlan(req, res) {
        try {
            const { id } = req.params;
            const file = req.file;
            const userId = req.user?.id;
            
            if (!id || isNaN(id)) {
                return errorResponse(res, 400, 'Valid property ID is required');
            }
            
            if (!file) {
                return errorResponse(res, 400, 'No floor plan file uploaded');
            }
            
            // Lazy load PropertyModel
            const PropertyModel = await import('../models/property.model.js');
            
            // Check if property exists
            const property = await PropertyModel.default.findById(id);
            if (!property) {
                return errorResponse(res, 404, 'Property not found');
            }
            
            const floorPlanData = {
                image_url: `/uploads/property-images/${file.filename}`,
                thumbnail_url: `/uploads/property-images/${file.filename}`,
                caption: req.body.caption || 'Floor Plan',
                alt_text: req.body.alt_text || file.originalname,
                file_size: file.size,
                mime_type: file.mimetype,
                width: 0,
                height: 0,
                is_primary: false,
                image_order: 999,
                uploaded_by_user_id: userId
            };
            
            const floorPlan = await PropertyModel.default.addFloorPlan(id, floorPlanData);
            
            successResponse(res, 201, 'Floor plan uploaded successfully', {
                floor_plan: floorPlan
            });
        } catch (error) {
            console.error('❌ uploadFloorPlan ERROR:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    // Delete property image
    async deleteImage(req, res) {
        try {
            const { imageId } = req.params;
            const { propertyId } = req.body;
            const userId = req.user?.id;
            
            if (!imageId || isNaN(imageId)) {
                return errorResponse(res, 400, 'Valid image ID is required');
            }
            
            if (!propertyId || isNaN(propertyId)) {
                return errorResponse(res, 400, 'Valid property ID is required');
            }
            
            // Lazy load PropertyModel
            const PropertyModel = await import('../models/property.model.js');
            
            // Check if property exists
            const property = await PropertyModel.default.findById(propertyId);
            if (!property) {
                return errorResponse(res, 404, 'Property not found');
            }
            
            const deleted = await PropertyModel.default.deleteImage(imageId, userId);
            
            if (!deleted) {
                return errorResponse(res, 404, 'Image not found or already deleted');
            }
            
            successResponse(res, 200, 'Image deleted successfully');
        } catch (error) {
            console.error('❌ deleteImage ERROR:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    // Set primary image for a property
    async setPrimaryImage(req, res) {
        try {
            const { imageId } = req.params;
            const { propertyId } = req.body;
            
            if (!imageId || isNaN(imageId)) {
                return errorResponse(res, 400, 'Valid image ID is required');
            }
            
            if (!propertyId || isNaN(propertyId)) {
                return errorResponse(res, 400, 'Valid property ID is required');
            }
            
            // Lazy load PropertyModel
            const PropertyModel = await import('../models/property.model.js');
            
            // Check if property exists
            const property = await PropertyModel.default.findById(propertyId);
            if (!property) {
                return errorResponse(res, 404, 'Property not found');
            }
            
            const updated = await PropertyModel.default.setPrimaryImage(propertyId, imageId);
            
            if (!updated) {
                return errorResponse(res, 404, 'Image not found or not associated with this property');
            }
            
            successResponse(res, 200, 'Primary image updated successfully');
        } catch (error) {
            console.error('❌ setPrimaryImage ERROR:', error.message);
            errorResponse(res, 500, error.message);
        }
    }
}

console.log('✅ PropertyImageController loaded successfully');

// Export as instance
export default new PropertyImageController();