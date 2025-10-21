import db from "../../shared/db.js";

export const BrokerVerification = {
  submitVerificationRequest: async (requestData) => {
    const [result] = await db.query(
      `INSERT INTO broker_verification_requests 
       (broker_id, business_license_number, business_license_document, additional_documents, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [
        requestData.brokerId,
        requestData.businessLicenseNumber,
        requestData.businessLicenseDocument,
        JSON.stringify(requestData.additionalDocuments || [])
      ]
    );

    // Update user broker status
    await db.query(
      `UPDATE users SET broker_status = 'pending_verification' WHERE id = ?`,
      [requestData.brokerId]
    );

    return { id: result.insertId, ...requestData };
  },

  getVerificationStatus: async (brokerId) => {
    const [userRows] = await db.query(
      `SELECT broker_status, business_license_verified, verified_at 
       FROM users WHERE id = ?`,
      [brokerId]
    );

    const [requestRows] = await db.query(
      `SELECT status, submitted_at, reviewed_at, review_notes, rejection_reason
       FROM broker_verification_requests 
       WHERE broker_id = ? 
       ORDER BY submitted_at DESC LIMIT 1`,
      [brokerId]
    );

    return {
      brokerStatus: userRows[0]?.broker_status || 'inactive',
      businessLicenseVerified: userRows[0]?.business_license_verified || false,
      verificationRequest: requestRows[0] || null
    };
  },

  getPendingVerifications: async (page, limit) => {
    const offset = (page - 1) * limit;
    
    const [rows] = await db.query(
      `SELECT vr.*, u.username, u.email, u.first_name, u.last_name, u.broker_type
       FROM broker_verification_requests vr
       JOIN users u ON vr.broker_id = u.id
       WHERE vr.status = 'pending'
       ORDER BY vr.submitted_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM broker_verification_requests WHERE status = 'pending'`
    );

    return { data: rows, total };
  },

  reviewVerificationRequest: async (reviewData) => {
    const [requestRows] = await db.query(
      `SELECT broker_id FROM broker_verification_requests WHERE id = ?`,
      [reviewData.requestId]
    );

    if (!requestRows.length) {
      throw new Error('Verification request not found');
    }

    const brokerId = requestRows[0].broker_id;

    // Update verification request
    await db.query(
      `UPDATE broker_verification_requests 
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), 
           review_notes = ?, rejection_reason = ?
       WHERE id = ?`,
      [
        reviewData.status,
        reviewData.reviewedBy,
        reviewData.reviewNotes,
        reviewData.rejectionReason,
        reviewData.requestId
      ]
    );

    // Update user status based on review
    let userStatus = 'inactive';
    let businessLicenseVerified = false;

    if (reviewData.status === 'approved') {
      userStatus = 'active';
      businessLicenseVerified = true;
    } else if (reviewData.status === 'rejected') {
      userStatus = 'rejected';
    }

    await db.query(
      `UPDATE users 
       SET broker_status = ?, business_license_verified = ?, 
           verified_by = ?, verified_at = NOW()
       WHERE id = ?`,
      [userStatus, businessLicenseVerified, reviewData.reviewedBy, brokerId]
    );

    const [brokerRows] = await db.query(
      `SELECT * FROM users WHERE id = ?`,
      [brokerId]
    );

    return { broker: brokerRows[0] };
  },

  updateBrokerStatus: async (statusData) => {
    await db.query(
      `UPDATE users SET broker_status = ? WHERE id = ?`,
      [statusData.status, statusData.brokerId]
    );

    const [brokerRows] = await db.query(
      `SELECT * FROM users WHERE id = ?`,
      [statusData.brokerId]
    );

    return brokerRows[0];
  },

  getAnalytics: async () => {
    const [[{ totalBrokers }]] = await db.query(
      `SELECT COUNT(*) as totalBrokers FROM users WHERE role = 'broker'`
    );

    const [[{ pendingVerifications }]] = await db.query(
      `SELECT COUNT(*) as pendingVerifications FROM broker_verification_requests WHERE status = 'pending'`
    );

    const [[{ activeBrokers }]] = await db.query(
      `SELECT COUNT(*) as activeBrokers FROM users WHERE role = 'broker' AND broker_status = 'active'`
    );

    const [statusDistribution] = await db.query(
      `SELECT broker_status, COUNT(*) as count 
       FROM users WHERE role = 'broker' 
       GROUP BY broker_status`
    );

    return {
      totalBrokers,
      pendingVerifications,
      activeBrokers,
      statusDistribution
    };
  }
};