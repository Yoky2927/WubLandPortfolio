// backend/user-service/controllers/document-verification.controller.js
import db from "../../shared/db.js";
import fs from 'fs';
import path from 'path';

// Helper function to send notifications
const sendNotification = async (userId, title, message, type = 'info') => {
    try {
        console.log(`📨 Sending notification to user ${userId}: ${title} - ${message}`);

        // Call the communication service
        const notificationData = {
            userId: parseInt(userId),
            title: title,
            message: message,
            type: type,
            priority: 'high',
            actionUrl: '/profile/verification',
            metadata: {
                entityType: 'user_verification',
                entityId: userId,
                verificationType: type.includes('resubmission') ? 'resubmission_required' : 'verification_update'
            }
        };

        // Use the external notification endpoint
        const response = await fetch('http://localhost:5001/api/external/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || 'communication-service-secret-12345'
            },
            body: JSON.stringify(notificationData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Notification sent to user ${userId}:`, result);
            return true;
        } else {
            const errorText = await response.text();
            console.warn(`⚠️ Failed to send notification to user ${userId}:`, errorText);
            return false;
        }
    } catch (error) {
        console.error('Failed to send notification:', error);
        return false;
    }
};

const uploadInProgress = new Map();
const requestCache = new Map();

setInterval(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    // Clean uploadInProgress
    for (const [key, timestamp] of uploadInProgress.entries()) {
        if (timestamp < fiveMinutesAgo) {
            uploadInProgress.delete(key);
        }
    }

    // Clean requestCache
    for (const [key, { timestamp }] of requestCache.entries()) {
        if (timestamp < fiveMinutesAgo) {
            requestCache.delete(key);
        }
    }
}, 60000);

// 1. Get user verification status
export const getUserVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Get user info
        const [users] = await db.query(`
            SELECT 
                id, username, first_name, last_name, email, role,
                verification_status, verification_step_status,
                has_submitted_documents, documents_submitted_at,
                document_rejection_reason, documents_need_resubmission
            FROM users 
            WHERE id = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get verification documents
        const [documents] = await db.query(`
            SELECT 
                id, user_id, document_type, document_url, 
                document_filename, status, uploaded_at,
                reviewed_by, reviewed_at, review_notes,
                rejection_reason, resubmission_requested,
                version, previous_version_id, created_at
            FROM document_verification_records 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [userId]);

        // Format documents with full URL
        const formattedDocuments = documents.map(doc => ({
            id: doc.id,
            type: doc.document_type,
            url: doc.document_url,
            filename: doc.document_filename,
            status: doc.status,
            uploaded_at: doc.uploaded_at,
            reviewed_at: doc.reviewed_at,
            review_notes: doc.review_notes,
            rejection_reason: doc.rejection_reason,
            version: doc.version,
            size: 0
        }));

        res.json({
            success: true,
            user: users[0],
            documents: formattedDocuments,
            count: formattedDocuments.length
        });
    } catch (error) {
        console.error("Error getting verification status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 2. Upload verification document
export const uploadVerificationDocument = async (req, res) => {
    let uploadKey = null;
    let userUploadKey = null;
    let requestId = null;

    try {
        const userId = req.user.id;
        const documentType = req.body.documentType;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: "Document type is required"
            });
        }

        // === FIX 1: Request ID tracking to prevent duplicates ===
        requestId = req.headers['x-request-id'] || req.body.requestId || `req_${userId}_${Date.now()}`;
        const duplicateCheckKey = `upload_req_${requestId}`;

        if (requestCache.has(duplicateCheckKey)) {
            return res.status(409).json({
                success: false,
                message: "Duplicate upload request detected",
                code: 'DUPLICATE_REQUEST'
            });
        }

        // Store request ID with timestamp
        requestCache.set(duplicateCheckKey, {
            timestamp: Date.now(),
            userId,
            documentType
        });

        // === FIX 2: Upload debouncing (prevent rapid retries) ===
        userUploadKey = `${userId}_${documentType}`;
        uploadKey = `${userUploadKey}_${Date.now()}`;

        // Check if user is already uploading same document type
        if (uploadInProgress.has(userUploadKey)) {
            const lastUploadTime = uploadInProgress.get(userUploadKey);
            const timeSinceLastUpload = Date.now() - lastUploadTime;

            // If user uploaded same document type within last 5 seconds, reject
            if (timeSinceLastUpload < 5000) {
                const waitTime = Math.ceil((5000 - timeSinceLastUpload) / 1000);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitTime} seconds before uploading another ${documentType.replace('_', ' ')}`,
                    code: 'UPLOAD_TOO_FAST',
                    retryAfter: waitTime
                });
            }
        }

        // Mark this upload as in progress
        uploadInProgress.set(userUploadKey, Date.now());

        console.log("=== UPLOAD VERIFICATION DOCUMENT ===");
        console.log("Request ID:", requestId);
        console.log("User ID:", userId);
        console.log("Document Type:", documentType);
        console.log("Content-Type:", req.headers['content-type']);
        console.log("File exists:", !!req.file);

        // === Handle file/document URL ===
        let documentUrl = null;
        let filename = null;

        if (req.file) {
            // Handle file upload (FormData)
            console.log("📤 Processing file upload...");
            const file = req.file;

            // Validate file size (server-side check)
            if (file.size > 10 * 1024 * 1024) { // 10MB
                throw new Error("File size exceeds 10MB limit");
            }

            // Generate unique filename
            const fileName = `user-${userId}-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const filePath = `Uploads/verification-documents/${fileName}`;

            // Ensure upload directory exists
            const uploadDir = 'Uploads/verification-documents';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Move uploaded file to destination
            fs.renameSync(file.path, filePath);

            documentUrl = filePath;
            filename = file.originalname;
            console.log("✅ File saved to:", documentUrl);

        } else if (req.body.documentUrl) {
            // Handle JSON with document URL
            console.log("📤 Processing JSON with document URL...");
            documentUrl = req.body.documentUrl;
            filename = req.body.filename || 'document.jpg';

            // Validate URL format
            if (!documentUrl.startsWith('http') && !documentUrl.startsWith('Uploads/')) {
                if (documentUrl.startsWith('data:')) {
                    // Handle base64 data URL
                    const matches = documentUrl.match(/^data:(.+);base64,(.+)$/);
                    if (!matches) {
                        throw new Error("Invalid base64 data URL format");
                    }

                    const mimeType = matches[1];
                    const base64Data = matches[2];
                    const ext = mimeType.split('/')[1] || 'jpg';

                    // Generate unique filename
                    const fileName = `user-${userId}-${Date.now()}.${ext}`;
                    const filePath = `Uploads/verification-documents/${fileName}`;

                    // Ensure upload directory exists
                    const uploadDir = 'Uploads/verification-documents';
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }

                    // Save base64 data as file
                    const buffer = Buffer.from(base64Data, 'base64');
                    fs.writeFileSync(filePath, buffer);

                    documentUrl = filePath;
                    filename = fileName;
                    console.log("✅ Base64 data saved to:", documentUrl);
                } else {
                    // Assume it's a relative path
                    documentUrl = documentUrl;
                    filename = filename || path.basename(documentUrl);
                }
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "No file or document URL provided",
                received: {
                    hasFile: !!req.file,
                    hasDocumentUrl: !!req.body.documentUrl
                }
            });
        }

        // Get isResubmission from request body
        const isResubmission = req.body.isResubmission === 'true' || req.body.isResubmission === true;

        // === FIX 3: OPTIMIZED DATABASE QUERIES ===
        // Get user info, existing docs, and required types in ONE query
        const [userData] = await db.query(`
            WITH user_info AS (
                SELECT 
                    u.id,
                    u.country,
                    u.nationality,
                    u.verification_step_status,
                    CASE 
                        WHEN u.country = 'Ethiopia' OR u.nationality = 'Ethiopian' 
                             OR u.country LIKE '%ethiopia%' OR u.nationality LIKE '%ethiopian%'
                        THEN 'kebele_id'
                        ELSE 'id_card'
                    END as required_id_type
                FROM users u
                WHERE u.id = ?
            ),
            existing_docs AS (
                SELECT 
                    dvr.id,
                    dvr.status,
                    dvr.document_type
                FROM document_verification_records dvr
                WHERE dvr.user_id = ? 
                    AND dvr.document_type = ?
                    AND dvr.status NOT IN ('archived', 'replaced')
                ORDER BY dvr.created_at DESC
                LIMIT 1
            ),
            user_all_docs AS (
                SELECT DISTINCT document_type
                FROM document_verification_records
                WHERE user_id = ? 
                    AND status IN ('pending', 'submitted', 'reviewing')
                    AND document_type IN ('kebele_id', 'id_card', 'passport', 'proof_of_income')
            )
            SELECT 
                ui.*,
                ed.id as existing_doc_id,
                ed.status as existing_doc_status,
                (SELECT GROUP_CONCAT(document_type) FROM user_all_docs) as uploaded_types
            FROM user_info ui
            LEFT JOIN existing_docs ed ON 1=1
        `, [userId, userId, documentType, userId]);

        if (!userData || userData.length === 0) {
            throw new Error("User data not found");
        }

        const user = userData[0];

        // Check if document already exists and is not a resubmission
        if (user.existing_doc_id && !isResubmission) {
            if (['pending', 'submitted', 'reviewing'].includes(user.existing_doc_status)) {
                return res.status(400).json({
                    success: false,
                    message: `A ${documentType.replace('_', ' ')} document is already uploaded and under review.`,
                    existingStatus: user.existing_doc_status,
                    documentType: documentType
                });
            }
        }

        // If resubmission, mark previous version as archived
        let previousVersionId = null;
        if (user.existing_doc_id && isResubmission) {
            previousVersionId = user.existing_doc_id;

            await db.query(`
                UPDATE document_verification_records 
                SET status = 'archived',
                    updated_at = NOW()
                WHERE id = ?
            `, [previousVersionId]);
        }

        // === Save new document to database ===
        const [result] = await db.query(`
            INSERT INTO document_verification_records 
            (user_id, document_type, document_url, document_filename, 
             status, uploaded_at, previous_version_id) 
            VALUES (?, ?, ?, ?, 'pending', NOW(), ?)
        `, [
            userId,
            documentType,
            documentUrl,
            filename,
            previousVersionId
        ]);

        const documentId = result.insertId;
        console.log("✅ Document saved to database with ID:", documentId);

        // === Determine required document types ===
        const isEthiopian = user.required_id_type === 'kebele_id';
        const requiredTypes = isEthiopian
            ? ['kebele_id', 'proof_of_income']
            : ['id_card', 'proof_of_income'];

        console.log(`📋 User ${userId} is Ethiopian: ${isEthiopian}`);
        console.log(`📋 Required documents:`, requiredTypes);

        // === Check which documents user has uploaded ===
        const uploadedTypes = user.uploaded_types
            ? user.uploaded_types.split(',')
            : [];

        // Add the current document type if not already in list
        if (!uploadedTypes.includes(documentType)) {
            uploadedTypes.push(documentType);
        }

        const missingTypes = requiredTypes.filter(type => !uploadedTypes.includes(type));

        console.log(`📋 User ${userId} uploaded types:`, uploadedTypes);
        console.log(`📋 Missing types:`, missingTypes);

        // === Update user verification status ===
        if (missingTypes.length === 0) {
            // All required documents uploaded
            await db.query(`
              UPDATE users 
              SET verification_step_status = 'submitted',
                  verification_status = 'pending', // SET TO PENDING ONLY WHEN DOCUMENTS ARE SUBMITTED
                  documents_submitted_at = NOW(),
                  has_submitted_documents = true,
                  document_rejection_reason = NULL,
                  updated_at = NOW()
              WHERE id = ?
            `, [userId]);
            console.log(`✅ User ${userId} all required documents submitted, verification_status set to 'pending'`);
        } else {
            // Some documents still missing
            await db.query(`
                UPDATE users 
                SET verification_step_status = 'pending',
                    has_submitted_documents = false,
                    document_rejection_reason = NULL,
                    updated_at = NOW()
                WHERE id = ?
            `, [userId]);
            console.log(`📝 User ${userId} still missing documents: ${missingTypes.join(', ')}`);
        }

        // === Clean up tracking ===
        uploadInProgress.delete(userUploadKey);
        requestCache.delete(duplicateCheckKey);

        // === Send success response ===
        return res.status(200).json({
            success: true,
            message: missingTypes.length === 0
                ? "All required documents uploaded! Verification in progress."
                : `Document uploaded successfully! Still need: ${missingTypes.map(t => t.replace('_', ' ')).join(', ')}`,
            document: {
                id: documentId,
                type: documentType,
                url: documentUrl,
                filename: filename,
                status: 'pending',
                uploaded_at: new Date().toISOString(),
                is_resubmission: isResubmission
            },
            missingDocuments: missingTypes,
            progress: {
                uploaded: uploadedTypes.length,
                required: requiredTypes.length,
                missing: missingTypes
            },
            isEthiopian: isEthiopian,
            requiredTypes: requiredTypes,
            requestId: requestId
        });

    } catch (error) {
        console.error("❌ Error uploading verification document:", error);

        // Clean up tracking on error
        if (userUploadKey) {
            uploadInProgress.delete(userUploadKey);
        }

        if (requestId) {
            requestCache.delete(`upload_req_${requestId}`);
        }

        // Handle specific error types
        if (error.message.includes("File size exceeds")) {
            return res.status(400).json({
                success: false,
                message: error.message,
                code: 'FILE_TOO_LARGE'
            });
        }

        if (error.message.includes("Invalid base64")) {
            return res.status(400).json({
                success: false,
                message: error.message,
                code: 'INVALID_BASE64'
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error uploading verification document",
            error: error.message,
            code: 'UPLOAD_ERROR',
            requestId: requestId || 'unknown'
        });
    }
};

// 3. Get documents for a specific user
export const getDocumentsForUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const [documents] = await db.query(`
            SELECT dvr.*, 
                u.first_name as reviewer_first_name, 
                u.last_name as reviewer_last_name
            FROM document_verification_records dvr
            LEFT JOIN users u ON dvr.reviewed_by = u.id
            WHERE dvr.user_id = ?
            ORDER BY dvr.created_at DESC
        `, [userId]);

        res.json({
            success: true,
            documents,
            count: documents.length
        });
    } catch (error) {
        console.error("Error getting user documents:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 4. Admin: Review a single document
export const reviewDocument = async (req, res) => {
    try {
        const documentId = req.params.documentId;
        const adminId = req.user.id;
        const {
            status,
            feedback,
            rejection_reason,
            requires_resubmission = false,
            resubmission_deadline = null
        } = req.body;

        // Validate required fields
        if (!status || !['approved', 'rejected', 'needs_resubmission'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required (approved/rejected/needs_resubmission)"
            });
        }

        // Get document and user info
        const [documents] = await db.query(`
            SELECT dvr.*, u.id as user_id, u.email, u.first_name, u.last_name
            FROM document_verification_records dvr
            JOIN users u ON dvr.user_id = u.id
            WHERE dvr.id = ?
        `, [documentId]);

        if (documents.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const document = documents[0];
        const userId = document.user_id;

        // Update document
        const [result] = await db.query(`
            UPDATE document_verification_records 
            SET status = ?,
                reviewed_by = ?,
                reviewed_at = NOW(),
                review_notes = ?,
                rejection_reason = ?,
                resubmission_requested = ?,
                resubmission_deadline = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [
            status,
            adminId,
            feedback,
            rejection_reason || feedback,
            requires_resubmission,
            resubmission_deadline,
            documentId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        // Update user verification status
        const userStatus = await updateUserVerificationStatus(userId);

        // Send notification
        await sendNotification(
            userId,
            status === 'approved' ? 'Document Approved' : 'Document Needs Corrections',
            status === 'approved'
                ? `Your ${document.document_type} document has been approved.`
                : `Your ${document.document_type} document needs corrections: ${rejection_reason || feedback}`,
            'verification_update'
        );

        res.json({
            success: true,
            message: `Document ${status} successfully`,
            userVerificationStatus: userStatus
        });

    } catch (error) {
        console.error("Error reviewing document:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 6. Admin: Get pending verifications
export const getPendingVerifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'all' } = req.query;
        const offset = (page - 1) * limit;

        // Build query to get users who have submitted documents OR have pending verification
        let whereClause = "WHERE u.verification_status = 'pending'";
        let whereParams = [];

        if (status !== 'all') {
            whereClause += " AND u.verification_status = ?";
            whereParams.push(status);
        }

        // Only show buyers and renters who have submitted documents
        whereClause += " AND u.role IN ('buyer', 'renter')";
        whereClause += " AND u.has_submitted_documents = true";

        const [users] = await db.query(`
        SELECT 
          u.id, u.first_name, u.last_name, u.email, u.role,
          u.verification_status, u.verification_step_status,
          u.created_at, u.last_verification_review_at,
          u.has_submitted_documents,
          u.documents_submitted_at,
          COUNT(dvr.id) as document_count
        FROM users u
        LEFT JOIN document_verification_records dvr ON u.id = dvr.user_id
        ${whereClause}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `, [...whereParams, parseInt(limit), parseInt(offset)]);

        // Count query
        let countWhereClause = "WHERE u.verification_status = 'pending' AND u.role IN ('buyer', 'renter') AND u.has_submitted_documents = true";
        let countParams = [];

        if (status !== 'all') {
            countWhereClause += " AND u.verification_status = ?";
            countParams.push(status);
        }

        const [[{ total }]] = await db.query(`
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        ${countWhereClause}
      `, countParams);

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error getting pending verifications:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 7. Admin: Get verification statistics
export const getVerificationStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN verification_status = 'verified' AND has_submitted_documents = true THEN 1 ELSE 0 END) as verified,
          SUM(CASE WHEN verification_status = 'pending' AND has_submitted_documents = true THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN verification_status IS NULL AND has_submitted_documents = false THEN 1 ELSE 0 END) as not_submitted,
          SUM(CASE WHEN verification_step_status = 'submitted' AND has_submitted_documents = true THEN 1 ELSE 0 END) as submitted,
          SUM(CASE WHEN verification_step_status = 'reviewing' AND has_submitted_documents = true THEN 1 ELSE 0 END) as reviewing,
          SUM(CASE WHEN verification_step_status = 'needs_resubmission' AND has_submitted_documents = true THEN 1 ELSE 0 END) as needs_resubmission,
          SUM(CASE WHEN verification_status = 'rejected' AND has_submitted_documents = true THEN 1 ELSE 0 END) as rejected
        FROM users
        WHERE role IN ('buyer', 'renter')
      `);

        res.json({
            success: true,
            stats: stats[0],
            updated_at: new Date()
        });
    } catch (error) {
        console.error("Error getting verification stats:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 8. Reject verification with feedback
export const rejectWithFeedback = async (req, res) => {
    try {
        const userId = req.params.userId;
        const adminId = req.user.id;
        const { feedback, reason } = req.body;

        if (!feedback || !reason) {
            return res.status(400).json({
                success: false,
                message: "Feedback and reason are required for rejection"
            });
        }

        // First get current history
        const [currentUser] = await db.query(
            "SELECT verification_history FROM users WHERE id = ?",
            [userId]
        );

        let history = [];
        if (currentUser.length > 0 && currentUser[0].verification_history) {
            try {
                history = JSON.parse(currentUser[0].verification_history);
                if (!Array.isArray(history)) history = [];
            } catch (error) {
                history = [];
            }
        }

        // Add new history entry
        const historyEntry = {
            id: Date.now(),
            status: 'rejected',
            feedback: feedback,
            reason: reason,
            admin_id: adminId,
            timestamp: new Date().toISOString()
        };

        history.unshift(historyEntry);

        // Update user verification status
        await db.query(`
            UPDATE users 
            SET verification_status = 'rejected',
                verification_feedback = ?,
                document_rejection_reason = ?,
                verification_step_status = 'rejected',
                last_verification_review_by = ?,
                last_verification_review_at = NOW(),
                documents_need_resubmission = FALSE,
                verification_history = ?
            WHERE id = ?
        `, [feedback, reason, adminId, JSON.stringify(history), userId]);

        // Send notification
        await sendNotification(
            userId,
            'Verification Rejected',
            `Your verification was rejected. Reason: ${feedback}`,
            'verification_rejected'
        );

        res.json({
            success: true,
            message: "Verification rejected with feedback"
        });

    } catch (error) {
        console.error("Error rejecting verification:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 9. Request resubmission (SIMPLIFIED VERSION)
export const requestResubmission = async (req, res) => {
    try {
        const userId = req.params.userId;
        const adminId = req.user.id;
        const { feedback, deadline = null, documentType = null, specificIssues = [] } = req.body;

        console.log('📝 [RESUBMISSION] Request for user:', userId);

        if (!feedback) {
            return res.status(400).json({
                success: false,
                message: "Feedback is required"
            });
        }

        // First get current history
        const [currentUser] = await db.query(
            "SELECT verification_history, first_name, last_name, email FROM users WHERE id = ?",
            [userId]
        );

        if (currentUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = currentUser[0];
        let history = [];
        if (user.verification_history) {
            try {
                history = JSON.parse(user.verification_history);
                if (!Array.isArray(history)) history = [];
            } catch (error) {
                history = [];
            }
        }

        // Add new history entry
        const historyEntry = {
            id: Date.now(),
            status: 'needs_resubmission',
            feedback: feedback,
            admin_id: adminId,
            deadline: deadline,
            documentType: documentType,
            specificIssues: specificIssues,
            timestamp: new Date().toISOString()
        };

        history.unshift(historyEntry);

        // Update user verification status
        await db.query(`
            UPDATE users 
            SET verification_step_status = 'needs_resubmission',
                verification_feedback = ?,
                documents_need_resubmission = TRUE,
                last_verification_review_by = ?,
                last_verification_review_at = NOW(),
                resubmission_deadline = ?,
                verification_history = ?
            WHERE id = ?
        `, [feedback, adminId, deadline, JSON.stringify(history), userId]);

        // Get admin info
        const [adminInfo] = await db.query(
            "SELECT first_name, last_name FROM users WHERE id = ?",
            [adminId]
        );
        const adminName = adminInfo.length > 0 ?
            `${adminInfo[0].first_name} ${adminInfo[0].last_name}` : 'Admin';

        // Send notification to user with detailed feedback
        const notificationMessage = documentType
            ? `Your ${documentType} needs resubmission. Feedback: ${feedback}`
            : `Your verification documents need resubmission. Feedback: ${feedback}`;

        if (specificIssues.length > 0) {
            notificationMessage += `\n\nSpecific issues:\n${specificIssues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}`;
        }

        if (deadline) {
            notificationMessage += `\n\nPlease resubmit before: ${new Date(deadline).toLocaleDateString()}`;
        }

        await sendNotification(
            userId,
            'Resubmission Required',
            notificationMessage,
            'resubmission_required'
        );

        // Also send to admins about this action
        await sendNotificationToAdmins(
            `Resubmission requested for user ${user.first_name} ${user.last_name}`,
            `Admin ${adminName} requested resubmission for user ${user.email}. Reason: ${feedback}`,
            'system'
        );

        res.json({
            success: true,
            message: "Resubmission requested successfully",
            feedback: feedback,
            deadline: deadline,
            documentType: documentType
        });

    } catch (error) {
        console.error("Error requesting resubmission:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Helper function to send notifications to admins
const sendNotificationToAdmins = async (title, message, type = 'system') => {
    try {
        const notificationData = {
            roles: ['super_admin', 'admin', 'support_admin', 'support_lead'],
            notificationData: {
                title: title,
                message: message,
                type: type,
                priority: 'medium',
                actionUrl: '/admin/verifications',
                metadata: {
                    entityType: 'admin_alert',
                    timestamp: new Date().toISOString()
                }
            }
        };

        const response = await fetch('http://localhost:5001/api/internal/send-to-admins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || 'communication-service-secret-12345'
            },
            body: JSON.stringify(notificationData)
        });

        if (response.ok) {
            console.log('✅ Admin notification sent');
        }
    } catch (error) {
        console.error('Failed to send admin notification:', error);
    }
};;

// 10. Get verification history for a user
export const getVerificationHistory = async (req, res) => {
    try {
        const userId = req.params.userId;

        const [user] = await db.query(`
            SELECT 
                u.verification_history,
                u.id, u.first_name, u.last_name, u.email, u.role,
                u.verification_step_status
            FROM users u
            WHERE u.id = ?
        `, [userId]);

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        let history = [];
        if (user[0].verification_history) {
            try {
                const parsed = JSON.parse(user[0].verification_history);
                if (Array.isArray(parsed)) {
                    history = parsed;
                }
            } catch (error) {
                console.error("Error parsing verification history:", error);
            }
        }

        // Get admin names for each history entry
        const adminIds = history.map(h => h.admin_id).filter(id => id);
        let adminNames = {};

        if (adminIds.length > 0) {
            const [admins] = await db.query(`
                SELECT id, first_name, last_name FROM users 
                WHERE id IN (?)
            `, [adminIds]);

            admins.forEach(admin => {
                adminNames[admin.id] = {
                    first_name: admin.first_name,
                    last_name: admin.last_name
                };
            });
        }

        // Add admin names to history entries
        const historyWithNames = history.map(entry => ({
            ...entry,
            admin_first_name: entry.admin_id ? (adminNames[entry.admin_id]?.first_name || '') : '',
            admin_last_name: entry.admin_id ? (adminNames[entry.admin_id]?.last_name || '') : ''
        }));

        res.json({
            success: true,
            history: historyWithNames,
            count: historyWithNames.length,
            user: {
                id: user[0].id,
                first_name: user[0].first_name,
                last_name: user[0].last_name,
                email: user[0].email,
                role: user[0].role,
                verification_step_status: user[0].verification_step_status
            }
        });

    } catch (error) {
        console.error("Error getting verification history:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 11. Complete user verification (approve/reject)
export const completeUserVerification = async (req, res) => {
    try {
        const userId = req.params.userId;
        const adminId = req.user.id;
        const { overallStatus, feedback, notes } = req.body;

        if (!overallStatus || !['approved', 'rejected'].includes(overallStatus)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required (approved/rejected)"
            });
        }

        // First get current history
        const [currentUser] = await db.query(
            "SELECT verification_history FROM users WHERE id = ?",
            [userId]
        );

        let history = [];
        if (currentUser.length > 0 && currentUser[0].verification_history) {
            try {
                history = JSON.parse(currentUser[0].verification_history);
                if (!Array.isArray(history)) history = [];
            } catch (error) {
                history = [];
            }
        }

        // Add new history entry
        const historyEntry = {
            id: Date.now(),
            status: overallStatus,
            feedback: feedback,
            notes: notes,
            admin_id: adminId,
            timestamp: new Date().toISOString()
        };

        history.unshift(historyEntry);

        // Update user verification
        const [result] = await db.query(`
            UPDATE users 
            SET verification_status = ?,
                verification_feedback = ?,
                verification_notes = ?,
                verification_step_status = ?,
                last_verification_review_by = ?,
                last_verification_review_at = NOW(),
                verified_at = CASE WHEN ? = 'approved' THEN NOW() ELSE NULL END,
                verification_history = ?
            WHERE id = ?
        `, [
            overallStatus,
            feedback,
            notes,
            overallStatus === 'approved' ? 'verified' : 'rejected',
            adminId,
            overallStatus,
            JSON.stringify(history),
            userId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Send notification
        await sendNotification(
            userId,
            overallStatus === 'approved' ? 'Identity Verified!' : 'Verification Rejected',
            overallStatus === 'approved'
                ? 'Your identity has been verified successfully!'
                : `Your verification was rejected. Reason: ${feedback}`,
            'verification_complete'
        );

        res.json({
            success: true,
            message: `User verification ${overallStatus} successfully`
        });
    } catch (error) {
        console.error("Error completing verification:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 12. Get verification status for specific user (admin)
export const getVerificationStatusById = async (req, res) => {
    try {
        const userId = req.params.userId;

        const [user] = await db.query(`
            SELECT 
                id, first_name, last_name, email, role,
                verification_status, verification_feedback, verification_notes,
                document_rejection_reason, documents_need_resubmission,
                verification_step_status, last_verification_review_at,
                has_submitted_documents, documents_submitted_at
            FROM users 
            WHERE id = ?
        `, [userId]);

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: user[0]
        });

    } catch (error) {
        console.error("Error getting verification status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 13. Update verification step
export const updateVerificationStep = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { step_status, feedback } = req.body;

        if (!step_status) {
            return res.status(400).json({
                success: false,
                message: "Step status is required"
            });
        }

        await db.query(`
            UPDATE users 
            SET verification_step_status = ?,
                verification_feedback = ?,
                last_verification_review_at = NOW()
            WHERE id = ?
        `, [step_status, feedback, userId]);

        res.json({
            success: true,
            message: "Verification step updated successfully"
        });

    } catch (error) {
        console.error("Error updating verification step:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 14. Get verified users
export const getVerifiedUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [users] = await db.query(`
            SELECT 
                u.id, u.first_name, u.last_name, u.email, u.role,
                u.verification_status, u.verification_step_status,
                u.created_at, u.last_verification_review_at,
                u.verified_at
            FROM users u
            WHERE u.verification_step_status = 'verified'
                AND u.role IN ('buyer', 'renter')
            ORDER BY u.verified_at DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error("Error getting verified users:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 15. Get rejected users
export const getRejectedUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [users] = await db.query(`
            SELECT 
                u.id, u.first_name, u.last_name, u.email, u.role,
                u.verification_status, u.verification_step_status,
                u.created_at, u.last_verification_review_at,
                u.document_rejection_reason
            FROM users u
            WHERE u.verification_step_status = 'rejected'
                AND u.role IN ('buyer', 'renter')
            ORDER BY u.last_verification_review_at DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error("Error getting rejected users:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 16. Get current user documents
export const getCurrentUserDocuments = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Get verification documents
        const [documents] = await db.query(`
            SELECT 
                id, document_type as type,
                document_url as url,
                document_filename as filename,
                status,
                uploaded_at,
                reviewed_at,
                review_notes,
                rejection_reason,
                version,
                created_at
            FROM document_verification_records 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [userId]);

        // Format URLs to be absolute
        const formattedDocuments = documents.map(doc => ({
            ...doc,
            url: doc.url.startsWith('http') ? doc.url : `http://localhost:5000/${doc.url}`
        }));

        res.json({
            success: true,
            documents: formattedDocuments,
            count: formattedDocuments.length
        });
    } catch (error) {
        console.error("Error getting user documents:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 17. Review individual document
export const reviewIndividualDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const adminId = req.user.id;
        const {
            status,
            feedback,
            rejection_reason,
            requires_resubmission = false,
            resubmission_deadline = null,
            specificInstructions = []
        } = req.body;

        console.log(`📝 [ADMIN] Reviewing document ${documentId}: ${status}`);

        // Validate required fields
        if (!status || !['approved', 'rejected', 'needs_resubmission'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required (approved/rejected/needs_resubmission)"
            });
        }

        if ((status === 'rejected' || status === 'needs_resubmission') && !feedback) {
            return res.status(400).json({
                success: false,
                message: "Feedback is required for rejection or resubmission requests"
            });
        }

        // Get document details first
        const [documents] = await db.query(`
            SELECT dvr.*, u.id as user_id, u.email, u.first_name, u.last_name, u.phone_number
            FROM document_verification_records dvr
            JOIN users u ON dvr.user_id = u.id
            WHERE dvr.id = ?
        `, [documentId]);

        if (documents.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const document = documents[0];
        const userId = document.user_id;

        // Update the document
        const [result] = await db.query(`
            UPDATE document_verification_records 
            SET status = ?,
                reviewed_by = ?,
                reviewed_at = NOW(),
                review_notes = ?,
                rejection_reason = ?,
                resubmission_requested = ?,
                resubmission_deadline = ?,
                specific_instructions = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [
            status,
            adminId,
            feedback,
            rejection_reason || feedback,
            requires_resubmission,
            resubmission_deadline,
            specificInstructions.length > 0 ? JSON.stringify(specificInstructions) : null,
            documentId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        // Update user verification status based on all documents
        const userStatus = await updateUserVerificationStatus(userId);

        // Get updated document
        const [updatedDocs] = await db.query(`
            SELECT * FROM document_verification_records WHERE id = ?
        `, [documentId]);

        // Send notification to user
        let notificationTitle, notificationMessage;

        switch (status) {
            case 'approved':
                notificationTitle = 'Document Approved ✓';
                notificationMessage = `Your ${document.document_type} has been approved and verified.`;
                break;
            case 'rejected':
                notificationTitle = 'Document Rejected ✗';
                notificationMessage = `Your ${document.document_type} was rejected. Reason: ${feedback}`;
                break;
            case 'needs_resubmission':
                notificationTitle = 'Resubmission Required 🔄';
                notificationMessage = `Your ${document.document_type} needs to be resubmitted. Feedback: ${feedback}`;
                if (specificInstructions.length > 0) {
                    notificationMessage += `\n\nInstructions:\n${specificInstructions.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n')}`;
                }
                if (resubmission_deadline) {
                    notificationMessage += `\n\nPlease resubmit by: ${new Date(resubmission_deadline).toLocaleDateString()}`;
                }
                break;
        }

        await sendNotification(
            userId,
            notificationTitle,
            notificationMessage,
            status === 'approved' ? 'success' :
                status === 'rejected' ? 'error' : 'warning'
        );

        res.json({
            success: true,
            message: `Document ${status} successfully`,
            document: updatedDocs[0],
            userVerificationStatus: userStatus,
            feedback: feedback,
            specificInstructions: specificInstructions
        });

    } catch (error) {
        console.error("Error reviewing individual document:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getDocumentFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const { documentId } = req.params;

        const [documents] = await db.query(`
            SELECT 
                id, document_type, status,
                review_notes, rejection_reason, specific_instructions,
                reviewed_at, reviewed_by,
                resubmission_requested, resubmission_deadline
            FROM document_verification_records 
            WHERE user_id = ? AND id = ?
        `, [userId, documentId]);

        if (documents.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const document = documents[0];

        // Get admin info if reviewed
        let adminInfo = null;
        if (document.reviewed_by) {
            const [admins] = await db.query(
                "SELECT first_name, last_name, email FROM users WHERE id = ?",
                [document.reviewed_by]
            );
            adminInfo = admins[0] || null;
        }

        // Parse specific instructions
        let specificInstructions = [];
        if (document.specific_instructions) {
            try {
                specificInstructions = JSON.parse(document.specific_instructions);
                if (!Array.isArray(specificInstructions)) {
                    specificInstructions = [];
                }
            } catch (error) {
                specificInstructions = [];
            }
        }

        res.json({
            success: true,
            feedback: {
                documentType: document.document_type,
                status: document.status,
                reviewNotes: document.review_notes,
                rejectionReason: document.rejection_reason,
                specificInstructions: specificInstructions,
                reviewedAt: document.reviewed_at,
                reviewedBy: adminInfo,
                resubmissionRequested: document.resubmission_requested,
                resubmissionDeadline: document.resubmission_deadline,
                needsResubmission: document.status === 'needs_resubmission'
            }
        });

    } catch (error) {
        console.error("Error getting document feedback:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Helper function to update user verification status
const updateUserVerificationStatus = async (userId) => {
    try {
        // Single query to get all document statuses and update user
        const [result] = await db.query(`
            WITH document_statuses AS (
                SELECT 
                    status,
                    COUNT(*) as count
                FROM document_verification_records 
                WHERE user_id = ? 
                    AND status NOT IN ('archived', 'replaced')
                GROUP BY status
            ),
            status_summary AS (
                SELECT 
                    COALESCE(SUM(CASE WHEN status = 'approved' THEN count ELSE 0 END), 0) as approved_count,
                    COALESCE(SUM(CASE WHEN status = 'rejected' THEN count ELSE 0 END), 0) as rejected_count,
                    COALESCE(SUM(CASE WHEN status = 'needs_resubmission' THEN count ELSE 0 END), 0) as needs_resubmission_count,
                    COALESCE(SUM(CASE WHEN status = 'pending' THEN count ELSE 0 END), 0) as pending_count,
                    COALESCE(SUM(count), 0) as total_count
                FROM document_statuses
            )
            UPDATE users u
            CROSS JOIN status_summary s
            SET 
                u.verification_status = CASE 
                    WHEN s.rejected_count > 0 THEN 'rejected'
                    WHEN s.needs_resubmission_count > 0 THEN 'needs_resubmission'
                    WHEN s.approved_count = s.total_count AND s.total_count > 0 THEN 'approved'
                    WHEN s.pending_count > 0 THEN 'pending'
                    ELSE u.verification_status
                END,
                u.verification_step_status = CASE 
                    WHEN s.rejected_count > 0 THEN 'rejected'
                    WHEN s.needs_resubmission_count > 0 THEN 'needs_resubmission'
                    WHEN s.approved_count = s.total_count AND s.total_count > 0 THEN 'verified'
                    WHEN s.pending_count > 0 THEN 'submitted'
                    ELSE u.verification_step_status
                END,
                u.last_verification_review_at = NOW(),
                u.updated_at = NOW()
            WHERE u.id = ?
        `, [userId, userId]);

        console.log(`✅ Optimized update for user ${userId}`);
        return 'success';

    } catch (error) {
        console.error("Error updating user verification status:", error);
        throw error;
    }
};