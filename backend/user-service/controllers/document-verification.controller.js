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
    try {
        const userId = req.user.id;

        console.log("=== UPLOAD VERIFICATION DOCUMENT ===");
        console.log("User ID:", userId);
        console.log("Request body:", req.body);
        console.log("File exists:", !!req.file);
        console.log("Content-Type:", req.headers['content-type']);

        let documentUrl = null;
        let filename = null;
        let fileBuffer = null;

        // Check if request contains file (FormData) or JSON with URL
        if (req.file) {
            // Handle file upload (FormData)
            console.log("📤 Processing file upload...");
            const file = req.file;

            // Generate unique filename
            const fileName = `user-${userId}-${Date.now()}-${file.originalname}`;
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
                // If it's a base64 data URL, handle it
                if (documentUrl.startsWith('data:')) {
                    const matches = documentUrl.match(/^data:(.+);base64,(.+)$/);
                    if (matches) {
                        const mimeType = matches[1];
                        const base64Data = matches[2];
                        const ext = mimeType.split('/')[1];

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
                        return res.status(400).json({
                            success: false,
                            message: "Invalid base64 data URL format"
                        });
                    }
                } else {
                    // Assume it's a relative path
                    documentUrl = documentUrl;
                    filename = filename || path.basename(documentUrl);
                }
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "No file or document URL provided. Please provide either a file upload or a document URL.",
                received: {
                    hasFile: !!req.file,
                    hasDocumentUrl: !!req.body.documentUrl,
                    bodyKeys: Object.keys(req.body)
                }
            });
        }

        // Get document type from request body
        const documentType = req.body.documentType;

        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: "Document type is required"
            });
        }

        // Get isResubmission from request body
        const isResubmission = req.body.isResubmission === 'true' || req.body.isResubmission === true;

        // Check if this specific document type already exists for the user
        const [existingDocs] = await db.query(`
            SELECT id, status, document_type 
            FROM document_verification_records 
            WHERE user_id = ? AND document_type = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [userId, documentType]);

        let existingDocument = existingDocs.length > 0 ? existingDocs[0] : null;

        // If document exists and is not a resubmission, check its status
        if (existingDocument && !isResubmission) {
            if (['pending', 'submitted', 'reviewing'].includes(existingDocument.status)) {
                return res.status(400).json({
                    success: false,
                    message: `A ${documentType.replace('_', ' ')} document is already uploaded and under review.`,
                    existingStatus: existingDocument.status,
                    documentType: documentType
                });
            }
        }

        // If resubmission, mark previous version
        let previousVersionId = null;
        if (existingDocument && isResubmission) {
            previousVersionId = existingDocument.id;

            // Archive previous version
            await db.query(`
                UPDATE document_verification_records 
                SET status = 'archived',
                    updated_at = NOW()
                WHERE id = ?
            `, [previousVersionId]);
        }

        // Save new document to database
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

        console.log("✅ Document saved to database with ID:", result.insertId);

        // [Rest of your existing code for user verification status...]
        // Get user info to determine if Ethiopian
        const [userInfo] = await db.query(`
            SELECT id, country, nationality 
            FROM users 
            WHERE id = ?
        `, [userId]);

        // Determine if user is Ethiopian
        const user = userInfo[0] || {};
        const isEthiopian = user.country === 'Ethiopia' ||
            user.nationality === 'Ethiopian' ||
            (user.country && user.country.toLowerCase().includes('ethiopia')) ||
            (user.nationality && user.nationality.toLowerCase().includes('ethiopian'));

        // Define required document types based on user location
        const requiredTypes = isEthiopian
            ? ['kebele_id', 'proof_of_income']
            : ['id_card', 'proof_of_income'];

        console.log(`📋 User ${userId} is Ethiopian: ${isEthiopian}`);
        console.log(`📋 Required documents:`, requiredTypes);

        // Check if user has submitted all required documents
        const [allUserDocs] = await db.query(`
            SELECT document_type, status 
            FROM document_verification_records 
            WHERE user_id = ? 
            AND status IN ('pending', 'submitted', 'reviewing')
            AND document_type IN ('kebele_id', 'id_card', 'passport', 'proof_of_income')
        `, [userId]);

        // Check which required documents are uploaded
        const uploadedTypes = allUserDocs.map(doc => doc.document_type);
        const missingTypes = requiredTypes.filter(type => !uploadedTypes.includes(type));

        console.log(`📋 User ${userId} uploaded types:`, uploadedTypes);
        console.log(`📋 Missing types:`, missingTypes);

        // Update user verification status
        if (missingTypes.length === 0) {
            // All required documents uploaded
            await db.query(`
                UPDATE users 
                SET verification_step_status = 'submitted',
                    documents_submitted_at = NOW(),
                    verification_status = 'pending',
                    has_submitted_documents = true
                WHERE id = ?
            `, [userId]);
            console.log(`✅ User ${userId} all required documents submitted`);
        } else {
            // Some documents still missing
            await db.query(`
                UPDATE users 
                SET verification_step_status = 'pending',
                    has_submitted_documents = false,
                    document_rejection_reason = NULL
                WHERE id = ?
            `, [userId]);
            console.log(`📝 User ${userId} still missing documents: ${missingTypes.join(', ')}`);
        }

        return res.status(200).json({
            success: true,
            message: missingTypes.length === 0
                ? "All required documents uploaded! Verification in progress."
                : `Document uploaded! Still need: ${missingTypes.map(t => t.replace('_', ' ')).join(', ')}`,
            document: {
                id: result.insertId,
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
            requiredTypes: requiredTypes
        });

    } catch (error) {
        console.error("Error uploading verification document:", error);
        return res.status(500).json({
            success: false,
            message: "Error uploading verification document",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

        // Build query dynamically based on status
        let whereClause = "WHERE u.verification_step_status IN ('pending', 'submitted', 'reviewing', 'needs_resubmission')";
        let whereParams = [];

        if (status !== 'all') {
            whereClause += " AND u.verification_step_status = ?";
            whereParams.push(status);
        }

        whereClause += " AND u.role IN ('buyer', 'renter')";

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
        let countWhereClause = "WHERE u.verification_step_status IN ('pending', 'submitted', 'reviewing', 'needs_resubmission') AND u.role IN ('buyer', 'renter')";
        let countParams = [];

        if (status !== 'all') {
            countWhereClause += " AND u.verification_step_status = ?";
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
                SUM(CASE WHEN verification_step_status = 'verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN verification_step_status IN ('pending', 'submitted', 'reviewing') THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN verification_step_status = 'submitted' THEN 1 ELSE 0 END) as submitted,
                SUM(CASE WHEN verification_step_status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
                SUM(CASE WHEN verification_step_status = 'needs_resubmission' THEN 1 ELSE 0 END) as needs_resubmission,
                SUM(CASE WHEN verification_step_status = 'rejected' THEN 1 ELSE 0 END) as rejected
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
        // Get all user's documents
        const [documents] = await db.query(`
            SELECT status, document_type
            FROM document_verification_records 
            WHERE user_id = ? 
            AND status NOT IN ('archived', 'replaced')
        `, [userId]);

        if (documents.length === 0) return;

        const statusCounts = {
            approved: 0,
            rejected: 0,
            needs_resubmission: 0,
            pending: 0,
            total: documents.length
        };

        documents.forEach(doc => {
            if (statusCounts[doc.status] !== undefined) {
                statusCounts[doc.status]++;
            }
        });

        let userVerificationStatus = 'pending';
        let userStepStatus = 'pending';

        // Determine overall status based on document statuses
        if (statusCounts.rejected > 0) {
            userVerificationStatus = 'rejected';
            userStepStatus = 'rejected';
        } else if (statusCounts.needs_resubmission > 0) {
            userVerificationStatus = 'needs_resubmission';
            userStepStatus = 'needs_resubmission';
        } else if (statusCounts.approved === statusCounts.total) {
            userVerificationStatus = 'approved';
            userStepStatus = 'verified';
        } else if (statusCounts.pending > 0) {
            userVerificationStatus = 'pending';
            userStepStatus = 'submitted';
        }

        // Update user verification status
        await db.query(`
            UPDATE users 
            SET verification_status = ?,
                verification_step_status = ?,
                last_verification_review_at = NOW()
            WHERE id = ?
        `, [userVerificationStatus, userStepStatus, userId]);

        console.log(`✅ Updated user ${userId} verification status: ${userVerificationStatus}`);

        return userVerificationStatus;

    } catch (error) {
        console.error("Error updating user verification status:", error);
        throw error;
    }
};