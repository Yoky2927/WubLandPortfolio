// backend/property-service/controllers/propertyDocument.controller.js
import PropertyDocumentModel from "../models/propertyDocument.model.js";
import PropertyModel from "../models/property.model.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import pool from '../config/database.js';

class PropertyDocumentController {
  // Upload a document for a property
  async uploadDocument(req, res) {
    try {
      const { property_id } = req.params;
      const documentData = req.body;
      const files = req.files || {};
      
      console.log("📄 Uploading document for property:", property_id);
      console.log("📄 Document data:", documentData);
      console.log("📄 Files:", Object.keys(files));

      // Validate required fields
      if (!property_id || !documentData.title || !documentData.document_type) {
        return errorResponse(res, 400, "Missing required fields: property_id, title, document_type");
      }

      // Check if property exists
      const property = await PropertyModel.findById(property_id);
      if (!property) {
        return errorResponse(res, 404, "Property not found");
      }

      // Check if user has permission to upload documents
      // Owner, assigned broker, or admin can upload
      const userId = req.user?.id;
      const canUpload = 
        property.owner_user_id === userId ||
        property.assigned_broker_id === userId ||
        req.user?.role === 'admin' ||
        req.user?.role === 'super_admin';

      if (!canUpload) {
        return errorResponse(res, 403, "Not authorized to upload documents for this property");
      }

      // Handle file upload
      let documentUrl = documentData.document_url;
      let fileName = documentData.file_name;
      let fileSize = documentData.file_size;
      let mimeType = documentData.mime_type;

      if (files.document && files.document[0]) {
        const documentFile = files.document[0];
        documentUrl = `/uploads/property-documents/${documentFile.filename}`;
        fileName = documentFile.originalname;
        fileSize = documentFile.size;
        mimeType = documentFile.mimetype;
      }

      if (!documentUrl) {
        return errorResponse(res, 400, "No document file provided");
      }

      // Prepare document data
      const fullDocumentData = {
        property_id: parseInt(property_id),
        document_type: documentData.document_type,
        title: documentData.title,
        description: documentData.description || '',
        document_url: documentUrl,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        is_public: documentData.is_public || false,
        expiration_date: documentData.expiration_date || null,
        uploaded_by_user_id: userId,
        verification_status: 'pending', // Default to pending
        verification_feedback: null,
        verified_by_user_id: null,
        verified_at: null
      };

      // Save to database
      const document = await PropertyDocumentModel.create(fullDocumentData);
      
      // Log activity
      console.log(`✅ Document uploaded: ${document.title} (ID: ${document.id})`);

      successResponse(res, 201, "Document uploaded successfully", document);

    } catch (error) {
      console.error("❌ Upload document error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Get all documents for a property
  async getPropertyDocuments(req, res) {
    try {
      const { property_id } = req.params;
      const { document_type, status, is_public, include_expired } = req.query;
      
      console.log(`📄 Getting documents for property ${property_id}`);

      const filters = {
        document_type,
        status,
        is_public: is_public === 'true',
        include_expired: include_expired === 'true'
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const documents = await PropertyDocumentModel.findByPropertyId(property_id, filters);

      // Check user permissions to see private documents
      const userId = req.user?.id;
      const isOwnerOrBroker = await this.checkDocumentPermissions(property_id, userId);
      
      // Filter out private documents if user doesn't have permission
      const filteredDocuments = documents.filter(doc => {
        if (doc.is_public) return true;
        return isOwnerOrBroker;
      });

      successResponse(res, 200, "Documents retrieved successfully", filteredDocuments);

    } catch (error) {
      console.error("❌ Get documents error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Get pending documents for broker review
  async getPendingDocuments(req, res) {
    try {
      const brokerId = req.user?.id;
      
      if (!brokerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      console.log(`📄 Getting pending documents for broker ${brokerId}`);

      const documents = await PropertyDocumentModel.findPendingByBrokerId(brokerId);

      successResponse(res, 200, "Pending documents retrieved successfully", documents);

    } catch (error) {
      console.error("❌ Get pending documents error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Get single document
  async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`📄 Getting document ${id}`);

      const document = await PropertyDocumentModel.findById(id);
      
      if (!document) {
        return errorResponse(res, 404, "Document not found");
      }

      // Check permissions
      const userId = req.user?.id;
      const isOwnerOrBroker = await this.checkDocumentPermissions(document.property_id, userId);
      
      if (!document.is_public && !isOwnerOrBroker) {
        return errorResponse(res, 403, "Not authorized to view this document");
      }

      successResponse(res, 200, "Document retrieved successfully", document);

    } catch (error) {
      console.error("❌ Get document error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Update document verification status (Broker approval)
  async verifyDocument(req, res) {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;
      const brokerId = req.user?.id;

      console.log(`✅ Verifying document ${id} with status: ${status}`);

      if (!['approved', 'rejected'].includes(status)) {
        return errorResponse(res, 400, "Invalid status. Use 'approved' or 'rejected'");
      }

      // Verify the document exists
      const document = await PropertyDocumentModel.findById(id);
      if (!document) {
        return errorResponse(res, 404, "Document not found");
      }

      // Security Check: Only the assigned broker or admin can verify
      const property = await PropertyModel.findById(document.property_id);
      
      const isAssignedBroker = property.assigned_broker_id === parseInt(brokerId);
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
      
      if (!isAssignedBroker && !isAdmin) {
        return errorResponse(res, 403, "You are not the assigned broker for this property");
      }

      // Update the document status
      const verificationData = {
        verification_status: status,
        verified_by_user_id: brokerId,
        verification_feedback: feedback || null,
        verified_at: new Date()
      };

      const updatedDocument = await PropertyDocumentModel.updateVerification(id, verificationData);

      // If document is approved and it's a critical document, update property status
      if (status === 'approved' && this.isCriticalDocument(document.document_type)) {
        await this.handleCriticalDocumentApproval(document.property_id, document.document_type);
      }

      successResponse(res, 200, `Document ${status} successfully`, updatedDocument);

    } catch (error) {
      console.error("❌ Verify document error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Update document metadata
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;

      console.log(`📄 Updating document ${id}`);

      if (Object.keys(updates).length === 0) {
        return errorResponse(res, 400, "No updates provided");
      }

      const document = await PropertyDocumentModel.findById(id);
      if (!document) {
        return errorResponse(res, 404, "Document not found");
      }

      // Check permissions
      const isOwnerOrBroker = await this.checkDocumentPermissions(document.property_id, userId);
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
      
      if (!isOwnerOrBroker && !isAdmin) {
        return errorResponse(res, 403, "Not authorized to update this document");
      }

      // Don't allow updating verification fields directly
      const restrictedFields = [
        'verification_status',
        'verified_by_user_id',
        'verification_feedback',
        'verified_at'
      ];
      
      for (const field of restrictedFields) {
        if (updates[field] !== undefined) {
          delete updates[field];
        }
      }

      const updatedDocument = await PropertyDocumentModel.update(id, updates);

      successResponse(res, 200, "Document updated successfully", updatedDocument);

    } catch (error) {
      console.error("❌ Update document error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Delete document
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      console.log(`🗑️ Deleting document ${id}`);

      const document = await PropertyDocumentModel.findById(id);
      if (!document) {
        return errorResponse(res, 404, "Document not found");
      }

      // Check permissions
      const isOwnerOrBroker = await this.checkDocumentPermissions(document.property_id, userId);
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
      
      if (!isOwnerOrBroker && !isAdmin) {
        return errorResponse(res, 403, "Not authorized to delete this document");
      }

      const deleted = await PropertyDocumentModel.delete(id);

      if (!deleted) {
        return errorResponse(res, 500, "Failed to delete document");
      }

      successResponse(res, 200, "Document deleted successfully");

    } catch (error) {
      console.error("❌ Delete document error:", error);
      errorResponse(res, 500, error.message);
    }
  }

  // Helper: Check document permissions
  async checkDocumentPermissions(propertyId, userId) {
    if (!userId) return false;
    
    const property = await PropertyModel.findById(propertyId);
    if (!property) return false;

    return (
      property.owner_user_id === parseInt(userId) ||
      property.assigned_broker_id === parseInt(userId) ||
      property.created_by_user_id === parseInt(userId)
    );
  }

  // Helper: Check if document type is critical
  isCriticalDocument(documentType) {
    const criticalTypes = ['deed', 'survey', 'certificate', 'permit'];
    return criticalTypes.includes(documentType);
  }

  // Helper: Handle critical document approval
  async handleCriticalDocumentApproval(propertyId, documentType) {
    console.log(`🚨 Critical document approved: ${documentType} for property ${propertyId}`);
    
    // Check if all critical documents are approved
    const criticalDocuments = await PropertyDocumentModel.findByPropertyId(propertyId, {
      document_type: ['deed', 'survey', 'certificate', 'permit']
    });

    const allApproved = criticalDocuments.every(doc => 
      doc.verification_status === 'approved'
    );

    if (allApproved && criticalDocuments.length > 0) {
      // Update property status to active if all critical documents are approved
      await PropertyModel.update(propertyId, {
        property_status: 'active'
      });
      console.log(`✅ All critical documents approved. Property ${propertyId} marked as active.`);
    }
  }
}

export default new PropertyDocumentController();