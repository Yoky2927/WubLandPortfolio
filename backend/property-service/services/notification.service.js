// backend/property-service/services/notification.service.js
import axios from 'axios';

class NotificationService {
  constructor() {
    this.communicationServiceUrl = process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:5001';
  }

  async sendNotification(type, data) {
    try {
      console.log(`📤 Sending notification to communication-service: ${type}`, data);
      
      const response = await axios.post(
        `${this.communicationServiceUrl}/api/notifications/trigger`,
        {
          type,
          data,
          timestamp: new Date().toISOString()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Service-Auth': process.env.INTERNAL_SERVICE_KEY || 'internal-secret-key'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send notification:', error.message);
      // Don't throw error - notification failure shouldn't break main flow
      return { success: false, error: error.message };
    }
  }

  // ========== SELLER/LANDLORD NOTIFICATIONS ==========

  async notifyBrokerAssigned(requestId, clientId, brokerId, brokerName) {
    return this.sendNotification('BROKER_ASSIGNED', {
      requestId,
      clientId,
      brokerId,
      brokerName,
      message: `Your broker ${brokerName} has been assigned to your property request. They will contact you within 24 hours.`,
      priority: 'high',
      actionUrl: `/seller-leaser?step=2`,
      metadata: {
        requestId,
        brokerId,
        brokerName,
        entityType: 'property_request',
        entityId: requestId
      }
    });
  }

  async notifyInspectionScheduled(requestId, clientId, brokerId, inspectionDate) {
    return this.sendNotification('INSPECTION_SCHEDULED', {
      requestId,
      clientId,
      brokerId,
      inspectionDate,
      message: `Property inspection has been scheduled for ${new Date(inspectionDate).toLocaleDateString()}.`,
      priority: 'medium',
      actionUrl: `/seller-leaser?step=3`,
      metadata: {
        requestId,
        brokerId,
        inspectionDate,
        entityType: 'property_request',
        entityId: requestId
      }
    });
  }

  async notifyInspectionCompleted(requestId, clientId, brokerId) {
    return this.sendNotification('INSPECTION_COMPLETED', {
      requestId,
      clientId,
      brokerId,
      message: 'Property inspection has been completed. Your broker will now prepare the listing proposal.',
      priority: 'medium',
      actionUrl: `/seller-leaser?step=4`,
      metadata: {
        requestId,
        brokerId,
        entityType: 'property_request',
        entityId: requestId
      }
    });
  }

  async notifyListingProposalReady(propertyId, clientId, brokerId, propertyTitle) {
    return this.sendNotification('LISTING_PROPOSAL_READY', {
      propertyId,
      clientId,
      brokerId,
      propertyTitle,
      message: `Listing proposal for "${propertyTitle}" is ready for your review and approval.`,
      priority: 'high',
      actionUrl: `/workflow/properties/${propertyId}/review`,
      metadata: {
        propertyId,
        brokerId,
        propertyTitle,
        entityType: 'property',
        entityId: propertyId
      }
    });
  }

  async notifyAdminApproval(propertyId, clientId, brokerId, propertyTitle, isApproved, feedback = null) {
    return this.sendNotification(isApproved ? 'ADMIN_APPROVAL_GRANTED' : 'ADMIN_APPROVAL_REJECTED', {
      propertyId,
      clientId,
      brokerId,
      propertyTitle,
      isApproved,
      feedback,
      message: isApproved 
        ? `🎉 Your property "${propertyTitle}" has been approved by admin and is now live!`
        : `⚠️ Your property "${propertyTitle}" needs revisions: ${feedback || 'Please check admin feedback'}`,
      priority: 'high',
      actionUrl: isApproved 
        ? `/properties/${propertyId}`
        : `/workflow/properties/${propertyId}/status`,
      metadata: {
        propertyId,
        brokerId,
        propertyTitle,
        isApproved,
        feedback,
        entityType: 'property',
        entityId: propertyId
      }
    });
  }

  async notifyPropertyPublished(propertyId, title, clientId, isPremium) {
    return this.sendNotification('PROPERTY_PUBLISHED', {
      propertyId,
      title,
      clientId,
      isPremium,
      message: `✅ Your property "${title}" is now ${isPremium ? 'premium ' : ''}live on the marketplace!`,
      priority: 'medium',
      actionUrl: `/properties/${propertyId}`,
      metadata: {
        propertyId,
        title,
        isPremium,
        entityType: 'property',
        entityId: propertyId
      }
    });
  }

  async notifyContractReady(propertyId, clientId, brokerId, propertyTitle) {
    return this.sendNotification('CONTRACT_READY', {
      propertyId,
      clientId,
      brokerId,
      propertyTitle,
      message: `📄 Contract for "${propertyTitle}" is ready for your review and signing.`,
      priority: 'high',
      actionUrl: `/transactions/properties/${propertyId}/contract`,
      metadata: {
        propertyId,
        brokerId,
        propertyTitle,
        entityType: 'property',
        entityId: propertyId
      }
    });
  }

  async notifyPaymentReceived(propertyId, clientId, amount, currency) {
    return this.sendNotification('PAYMENT_RECEIVED', {
      propertyId,
      clientId,
      amount,
      currency,
      message: `💰 Payment of ${currency} ${amount} received for your property.`,
      priority: 'high',
      actionUrl: `/transactions/payments`,
      metadata: {
        propertyId,
        amount,
        currency,
        entityType: 'transaction',
        entityId: propertyId
      }
    });
  }

  // ========== BUYER/RENTER NOTIFICATIONS ==========

  async notifyVerificationComplete(userId, userName) {
    return this.sendNotification('VERIFICATION_COMPLETE', {
      userId,
      userName,
      message: '🎉 Your identity verification is complete! You can now explore properties.',
      priority: 'high',
      actionUrl: `/buyer-renter`,
      metadata: {
        userId,
        userName,
        entityType: 'user',
        entityId: userId
      }
    });
  }

  async notifyNewPropertyMatch(userId, propertyId, propertyTitle, matchReason) {
    return this.sendNotification('NEW_PROPERTY_MATCH', {
      userId,
      propertyId,
      propertyTitle,
      matchReason,
      message: `🏡 New property match: "${propertyTitle}" matches your preferences (${matchReason}).`,
      priority: 'medium',
      actionUrl: `/properties/${propertyId}`,
      metadata: {
        userId,
        propertyId,
        propertyTitle,
        matchReason,
        entityType: 'property',
        entityId: propertyId
      }
    });
  }

  async notifyOfferSubmitted(offerId, userId, propertyTitle, amount) {
    return this.sendNotification('OFFER_SUBMITTED', {
      offerId,
      userId,
      propertyTitle,
      amount,
      message: `📨 Your offer of ${amount} for "${propertyTitle}" has been submitted.`,
      priority: 'medium',
      actionUrl: `/transactions/offers/${offerId}`,
      metadata: {
        offerId,
        propertyTitle,
        amount,
        entityType: 'offer',
        entityId: offerId
      }
    });
  }

  async notifyOfferStatusUpdate(offerId, userId, propertyTitle, status, brokerFeedback = null) {
    return this.sendNotification('OFFER_STATUS_UPDATE', {
      offerId,
      userId,
      propertyTitle,
      status,
      brokerFeedback,
      message: `📊 Your offer for "${propertyTitle}" has been ${status}. ${brokerFeedback ? `Feedback: ${brokerFeedback}` : ''}`,
      priority: 'high',
      actionUrl: `/transactions/offers/${offerId}`,
      metadata: {
        offerId,
        propertyTitle,
        status,
        brokerFeedback,
        entityType: 'offer',
        entityId: offerId
      }
    });
  }

  async notifyAppointmentScheduled(appointmentId, userId, propertyTitle, appointmentDate) {
    return this.sendNotification('APPOINTMENT_SCHEDULED', {
      appointmentId,
      userId,
      propertyTitle,
      appointmentDate,
      message: `📅 Viewing appointment scheduled for "${propertyTitle}" on ${new Date(appointmentDate).toLocaleDateString()}.`,
      priority: 'medium',
      actionUrl: `/appointments/${appointmentId}`,
      metadata: {
        appointmentId,
        propertyTitle,
        appointmentDate,
        entityType: 'appointment',
        entityId: appointmentId
      }
    });
  }

  async notifyAppointmentUpdated(appointmentId, userId, propertyTitle, changes) {
    return this.sendNotification('APPOINTMENT_UPDATED', {
      appointmentId,
      userId,
      propertyTitle,
      changes,
      message: `✏️ Your viewing appointment for "${propertyTitle}" has been updated: ${changes}.`,
      priority: 'medium',
      actionUrl: `/appointments/${appointmentId}`,
      metadata: {
        appointmentId,
        propertyTitle,
        changes,
        entityType: 'appointment',
        entityId: appointmentId
      }
    });
  }

  async notifyAppointmentCancelled(appointmentId, userId, propertyTitle, reason) {
    return this.sendNotification('APPOINTMENT_CANCELLED', {
      appointmentId,
      userId,
      propertyTitle,
      reason,
      message: `❌ Viewing appointment for "${propertyTitle}" has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      priority: 'high',
      actionUrl: `/properties/${propertyTitle.split(' ')[0]}`,
      metadata: {
        appointmentId,
        propertyTitle,
        reason,
        entityType: 'appointment',
        entityId: appointmentId
      }
    });
  }

  async notifyPaymentSuccessful(transactionId, userId, amount, currency, propertyTitle) {
    return this.sendNotification('PAYMENT_SUCCESSFUL', {
      transactionId,
      userId,
      amount,
      currency,
      propertyTitle,
      message: `✅ Payment of ${currency} ${amount} for "${propertyTitle}" was successful!`,
      priority: 'high',
      actionUrl: `/transactions/${transactionId}`,
      metadata: {
        transactionId,
        amount,
        currency,
        propertyTitle,
        entityType: 'transaction',
        entityId: transactionId
      }
    });
  }

  async notifyPaymentFailed(transactionId, userId, amount, currency, propertyTitle, errorMessage) {
    return this.sendNotification('PAYMENT_FAILED', {
      transactionId,
      userId,
      amount,
      currency,
      propertyTitle,
      errorMessage,
      message: `❌ Payment of ${currency} ${amount} for "${propertyTitle}" failed: ${errorMessage}`,
      priority: 'urgent',
      actionUrl: `/transactions/${transactionId}/retry`,
      metadata: {
        transactionId,
        amount,
        currency,
        propertyTitle,
        errorMessage,
        entityType: 'transaction',
        entityId: transactionId
      }
    });
  }

  async notifyContractSigned(contractId, userId, propertyTitle) {
    return this.sendNotification('CONTRACT_SIGNED', {
      contractId,
      userId,
      propertyTitle,
      message: `📝 Contract for "${propertyTitle}" has been successfully signed!`,
      priority: 'high',
      actionUrl: `/transactions/contracts/${contractId}`,
      metadata: {
        contractId,
        propertyTitle,
        entityType: 'contract',
        entityId: contractId
      }
    });
  }

  // ========== BROKER NOTIFICATIONS ==========

  async notifyBrokerNewRequest(requestId, brokerId, clientName, propertyType) {
    return this.sendNotification('BROKER_NEW_REQUEST', {
      requestId,
      brokerId,
      clientName,
      propertyType,
      message: `🎯 New property request from ${clientName} for ${propertyType}`,
      priority: 'high',
      actionUrl: `/broker/requests/${requestId}`,
      metadata: {
        requestId,
        clientName,
        propertyType,
        entityType: 'property_request',
        entityId: requestId
      }
    });
  }

  async notifyBrokerClientResponse(requestId, brokerId, clientName, propertyTitle, isApproved) {
    return this.sendNotification('BROKER_CLIENT_RESPONSE', {
      requestId,
      brokerId,
      clientName,
      propertyTitle,
      isApproved,
      message: `📨 ${clientName} has ${isApproved ? 'approved' : 'requested changes to'} "${propertyTitle}"`,
      priority: 'medium',
      actionUrl: `/workflow/properties/${propertyTitle.split(' ')[0]}/status`,
      metadata: {
        requestId,
        clientName,
        propertyTitle,
        isApproved,
        entityType: 'property_request',
        entityId: requestId
      }
    });
  }

  // ========== SUPPORT NOTIFICATIONS ==========

  async notifySupportTicketCreated(ticketId, userId, issueType) {
    return this.sendNotification('SUPPORT_TICKET_CREATED', {
      ticketId,
      userId,
      issueType,
      message: `🆘 Support ticket created for ${issueType}. We'll get back to you soon.`,
      priority: 'medium',
      actionUrl: `/support/tickets/${ticketId}`,
      metadata: {
        ticketId,
        issueType,
        entityType: 'support_ticket',
        entityId: ticketId
      }
    });
  }

  async notifySupportTicketUpdated(ticketId, userId, status, adminName) {
    return this.sendNotification('SUPPORT_TICKET_UPDATED', {
      ticketId,
      userId,
      status,
      adminName,
      message: `📋 Your support ticket status updated to ${status} by ${adminName}.`,
      priority: 'medium',
      actionUrl: `/support/tickets/${ticketId}`,
      metadata: {
        ticketId,
        status,
        adminName,
        entityType: 'support_ticket',
        entityId: ticketId
      }
    });
  }

  // ========== SYSTEM NOTIFICATIONS ==========

  async notifySystemAnnouncement(userId, title, message, announcementId) {
    return this.sendNotification('SYSTEM_ANNOUNCEMENT', {
      userId,
      title,
      message,
      announcementId,
      priority: 'medium',
      actionUrl: `/announcements/${announcementId}`,
      metadata: {
        announcementId,
        title,
        entityType: 'announcement',
        entityId: announcementId
      }
    });
  }

  async notifyMaintenanceScheduled(userId, startTime, endTime, affectedServices) {
    return this.sendNotification('MAINTENANCE_SCHEDULED', {
      userId,
      startTime,
      endTime,
      affectedServices,
      message: `🔧 System maintenance scheduled from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}. Affected: ${affectedServices.join(', ')}`,
      priority: 'high',
      actionUrl: `/status`,
      metadata: {
        startTime,
        endTime,
        affectedServices,
        entityType: 'system',
        entityId: 'maintenance'
      }
    });
  }

  // ========== CHAT NOTIFICATIONS ==========

  async notifyChatAvailable(requestId, clientId, brokerId, brokerName) {
    return this.sendNotification('CHAT_AVAILABLE', {
      requestId,
      clientId,
      brokerId,
      brokerName,
      message: `💬 Chat is now available with your broker ${brokerName}. Click to start chatting!`,
      priority: 'medium',
      actionUrl: `/chat/${requestId}`,
      metadata: {
        requestId,
        brokerId,
        brokerName,
        chatData: {
          participants: [clientId, brokerId],
          context: `property_request_${requestId}`,
          autoOpen: true
        }
      }
    });
  }

  async notifyNewMessage(conversationId, userId, senderName, messagePreview) {
    return this.sendNotification('NEW_MESSAGE', {
      conversationId,
      userId,
      senderName,
      messagePreview,
      message: `✉️ New message from ${senderName}: ${messagePreview.substring(0, 50)}...`,
      priority: 'medium',
      actionUrl: `/chat/${conversationId}`,
      metadata: {
        conversationId,
        senderName,
        messagePreview,
        entityType: 'chat',
        entityId: conversationId
      }
    });
  }
}

export default new NotificationService();