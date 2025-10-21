import { BrokerVerification } from '../models/brokerVerification.model.js';
import { SupportActivity } from '../models/supportActivity.model.js';

export const submitVerificationRequest = async (req, res) => {
  try {
    const { businessLicenseNumber, businessLicenseDocument, additionalDocuments } = req.body;
    const brokerId = req.user.id;

    // Check if user is actually a broker
    if (req.user.role !== 'broker') {
      return res.status(400).json({ error: 'Only brokers can submit verification requests' });
    }

    const verificationRequest = await BrokerVerification.submitVerificationRequest({
      brokerId,
      businessLicenseNumber,
      businessLicenseDocument,
      additionalDocuments
    });

    // Log activity
    await SupportActivity.create(
      req.user.username,
      'broker_verification_submitted',
      verificationRequest.id,
      'broker_verification',
      `Broker ${req.user.username} submitted verification documents`
    );

    // Notify admins via WebSocket
    req.io.emit('new_broker_verification', {
      brokerId,
      requestId: verificationRequest.id,
      brokerName: `${req.user.first_name} ${req.user.last_name}`
    });

    res.json({
      success: true,
      message: 'Verification request submitted successfully. Admin review required.',
      requestId: verificationRequest.id
    });
  } catch (error) {
    console.error('Verification request error:', error);
    res.status(500).json({ error: 'Failed to submit verification request' });
  }
};

export const getBrokerVerificationStatus = async (req, res) => {
  try {
    const brokerId = req.user.id;
    const status = await BrokerVerification.getVerificationStatus(brokerId);
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
};

export const getAllPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const verifications = await BrokerVerification.getPendingVerifications(page, limit);
    
    res.json({
      success: true,
      verifications: verifications.data,
      total: verifications.total,
      page: parseInt(page),
      totalPages: Math.ceil(verifications.total / limit)
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
};

export const reviewVerificationRequest = async (req, res) => {
  try {
    const { requestId, status, reviewNotes, rejectionReason } = req.body;
    const adminId = req.user.id;

    const result = await BrokerVerification.reviewVerificationRequest({
      requestId,
      status,
      reviewNotes,
      rejectionReason,
      reviewedBy: adminId
    });

    // Log activity
    await SupportActivity.create(
      req.user.username,
      'broker_verification_reviewed',
      requestId,
      'broker_verification',
      `Reviewed broker verification request: ${status}`
    );

    // Notify broker via WebSocket
    req.io.emit('broker_verification_updated', {
      brokerId: result.broker.id,
      status: result.broker.broker_status,
      requestId
    });

    res.json({
      success: true,
      message: `Verification request ${status} successfully`,
      broker: result.broker
    });
  } catch (error) {
    console.error('Review verification error:', error);
    res.status(500).json({ error: 'Failed to review verification request' });
  }
};

export const updateBrokerStatus = async (req, res) => {
  try {
    const { brokerId, status, notes } = req.body;
    const adminId = req.user.id;

    const broker = await BrokerVerification.updateBrokerStatus({
      brokerId,
      status,
      notes,
      updatedBy: adminId
    });

    // Log activity
    await SupportActivity.create(
      req.user.username,
      'broker_status_updated',
      brokerId,
      'broker',
      `Updated broker status to ${status}`
    );

    // Notify broker via WebSocket
    req.io.emit('broker_status_updated', {
      brokerId,
      status,
      notes
    });

    res.json({
      success: true,
      message: `Broker status updated to ${status}`,
      broker
    });
  } catch (error) {
    console.error('Update broker status error:', error);
    res.status(500).json({ error: 'Failed to update broker status' });
  }
};

export const getBrokerAnalytics = async (req, res) => {
  try {
    const analytics = await BrokerVerification.getAnalytics();
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get broker analytics error:', error);
    res.status(500).json({ error: 'Failed to get broker analytics' });
  }
};