import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Eye, UserCheck, UserX, FileText, Shield, Search, Clock,
  CheckCircle, XCircle, AlertCircle, Phone, Mail, Calendar,
  MapPin, User, BadgeCheck, FileCheck, ExternalLink, ChevronRight,
  Filter, Download, Loader2, Users, AlertTriangle, Home, Building,
  CreditCard, Key, Lock, Check, X, Image, File, Archive,
  ShieldCheck, ShieldAlert, RotateCw, RefreshCw, MessageCircle,
  ZoomIn, ZoomOut, Maximize2, Minimize2, FileSearch, Info,
  History, FileUp, FileArchive, FileDigit, FileKey, FileSignature,
  Clock3, Star, ThumbsUp, ThumbsDown, Edit, Trash2, Save
} from "lucide-react";
import { apiCall } from "../../../utils/api.endpoints";

const UserVerification = ({ theme, setToast }) => {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [showDocumentsViewer, setShowDocumentsViewer] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showResubmissionModal, setShowResubmissionModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [actionType, setActionType] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentActionType, setDocumentActionType] = useState(null);
  const [documentFeedback, setDocumentFeedback] = useState("");
  const [showDocumentFeedbackModal, setShowDocumentFeedbackModal] = useState(false);
  const [verificationStats, setVerificationStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    needs_resubmission: 0,
    total: 0,
    today: 0
  });

  // Refs to prevent duplicate calls
  const isFetchingDocuments = useRef(false);
  const lastFetchTime = useRef(0);
  const fetchTimeoutRef = useRef(null);

  const isDark = theme === "dark";

  // Color configuration
  const colors = {
    primary: isDark ? "amber-400" : "amber-600",
    primaryBg: isDark ? "amber-400/10" : "amber-50",
    primaryHover: isDark ? "amber-500" : "amber-700",
    success: isDark ? "green-400" : "green-600",
    successBg: isDark ? "green-400/10" : "green-50",
    danger: isDark ? "red-400" : "red-600",
    dangerBg: isDark ? "red-400/10" : "red-50",
    warning: isDark ? "orange-400" : "orange-600",
    warningBg: isDark ? "orange-400/10" : "orange-50",
    info: isDark ? "blue-400" : "blue-600",
    infoBg: isDark ? "blue-400/10" : "blue-50",
  };

  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => {
      fetchVerificationStats();
    }, 300000);

    return () => {
      clearInterval(interval);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await fetchPendingVerifications();
      await fetchVerifiedUsers();
      await fetchRejectedUsers();
      await fetchVerificationStats();
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Failed to load verification data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingVerifications = async () => {
    try {
      const response = await apiCall("GET_PENDING_USER_VERIFICATIONS");
      if (response && Array.isArray(response.users)) {
        setPendingVerifications(response.users);
      } else {
        setPendingVerifications([]);
      }
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      setPendingVerifications([]);
    }
  };

  const fetchVerifiedUsers = async () => {
    try {
      const response = await apiCall("GET_VERIFIED_USERS");
      console.log("✅ Verified users API response:", response); // Add logging

      if (Array.isArray(response?.users || response)) {
        const users = Array.isArray(response) ? response : response.users;
        console.log(`📊 Fetched ${users.length} verified users:`, users);
        setVerifiedUsers(users);
      } else {
        console.warn("⚠️ Verified users response is not an array:", response);
        setVerifiedUsers([]);
      }
    } catch (error) {
      console.error("Error fetching verified users:", error);
      setVerifiedUsers([]);
    }
  };

  const fetchRejectedUsers = async () => {
    try {
      const response = await apiCall("GET_REJECTED_USERS");
      if (Array.isArray(response)) {
        setRejectedUsers(response);
      } else {
        setRejectedUsers([]);
      }
    } catch (error) {
      console.error("Error fetching rejected users:", error);
      setRejectedUsers([]);
    }
  };

  const fetchVerificationStats = async () => {
    try {
      const response = await apiCall("GET_VERIFICATION_STATS");
      if (response && response.stats) {
        const stats = response.stats;
        const totalPending = (parseInt(stats.pending) || 0) +
          (parseInt(stats.submitted) || 0) +
          (parseInt(stats.reviewing) || 0);

        setVerificationStats({
          pending: totalPending,
          approved: parseInt(stats.verified) || 0,
          rejected: parseInt(stats.rejected) || 0,
          needs_resubmission: parseInt(stats.needs_resubmission) || 0,
          total: parseInt(stats.total_users) || 0,
          today: totalPending
        });
      }
    } catch (error) {
      console.error("Error fetching verification stats:", error);
    }
  };

  const fetchUserDocuments = useCallback(async (userId) => {
    const now = Date.now();
    if (isFetchingDocuments.current || (now - lastFetchTime.current < 1000)) {
      return { success: false, documents: userDocuments };
    }

    try {
      isFetchingDocuments.current = true;
      lastFetchTime.current = now;

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/verification/documents/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.documents)) {
        const formattedDocuments = data.documents.map(doc => {
          let documentUrl = doc.document_url || doc.url || '';

          if (documentUrl && !documentUrl.startsWith('http')) {
            if (documentUrl.startsWith('/')) {
              documentUrl = `http://localhost:5000${documentUrl}`;
            } else {
              documentUrl = `http://localhost:5000/${documentUrl}`;
            }
          }

          return {
            id: doc.id,
            type: doc.document_type || 'unknown',
            url: documentUrl,
            filename: doc.document_filename || 'document',
            status: doc.status || 'pending',
            uploaded_at: doc.uploaded_at || doc.created_at,
            reviewed_at: doc.reviewed_at,
            review_notes: doc.review_notes,
            rejection_reason: doc.rejection_reason,
            document_type: doc.document_type,
            document_url: documentUrl,
            document_filename: doc.document_filename,
            label: doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Document'
          };
        });

        setUserDocuments(formattedDocuments);
        return { success: true, documents: formattedDocuments };
      }

      setUserDocuments([]);
      return { success: false, documents: [] };

    } catch (error) {
      console.error('Error fetching user documents:', error);
      setUserDocuments([]);
      return { success: false, documents: [] };
    } finally {
      isFetchingDocuments.current = false;
    }
  }, [userDocuments]);

  const fetchVerificationHistory = async (userId) => {
    try {
      const response = await apiCall("GET_VERIFICATION_HISTORY", { userId: userId });
      if (response && response.success && Array.isArray(response.history)) {
        setVerificationHistory(response.history);
      } else {
        setVerificationHistory([]);
      }
    } catch (error) {
      console.error("Error fetching verification history:", error);
      setVerificationHistory([]);
    }
  };

  const handleViewDocuments = async (user) => {
    setSelectedUser(user);
    setProcessingAction(user.id);
    try {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      fetchTimeoutRef.current = setTimeout(async () => {
        await Promise.all([
          fetchUserDocuments(user.id),
          fetchVerificationHistory(user.id)
        ]);
        setShowDocumentsViewer(true);
      }, 100);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleOpenFeedbackModal = (user, type) => {
    setSelectedUser(user);
    setActionType(type);

    // Generate auto message when opening modal
    if (type === 'approve') {
      setFeedbackText(`Congratulations ${user.first_name}! Your identity verification has been successfully approved. You now have full access to all ${user.role.replace('_', ' ')} features on WubLand. Welcome aboard!`);
    } else if (type === 'reject') {
      setFeedbackText(`Dear ${user.first_name},\n\nYour verification request could not be approved at this time. The submitted documents require further review.\n\nPlease contact our support team for specific details regarding your case.`);
    } else {
      setFeedbackText("");
    }

    if (type === 'resubmission') {
      setShowResubmissionModal(true);
    } else {
      setShowFeedbackModal(true);
    }
  };

  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.style.display = 'none';

    const container = e.target.parentElement;
    const errorDiv = document.createElement('div');
    errorDiv.className = `p-4 text-center ${isDark ? 'text-red-300' : 'text-red-600'}`;
    errorDiv.innerHTML = `
      <AlertCircle className="w-12 h-12 mx-auto mb-2" />
      <p class="font-medium">Failed to load image</p>
      <p class="text-sm mt-1">URL: ${e.target.src}</p>
      <button onclick="window.open('${e.target.src}', '_blank')" class="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm">
        Try downloading instead
      </button>
    `;
    container.appendChild(errorDiv);
  };

  const handleOpenDocumentFeedbackModal = (document, actionType) => {
    setSelectedDocument(document);
    setDocumentActionType(actionType);
    setDocumentFeedback("");
    setShowDocumentFeedbackModal(true);
  };

  const handleDocumentAction = async (document, actionType, feedback = '') => {
    if (!selectedUser || !document) return;

    try {
      setProcessingAction(`${actionType}-${document.id}`);

      const response = await apiCall('UPDATE_DOCUMENT_STATUS', {
        documentId: document.id
      }, {
        data: {
          status: actionType === 'approve' ? 'approved' :
            actionType === 'reject' ? 'rejected' : 'needs_resubmission',
          feedback: feedback,
          requires_resubmission: actionType === 'needs_resubmission'
        },
        method: 'POST'
      });

      if (response.success) {
        setUserDocuments(prev => prev.map(doc =>
          doc.id === document.id
            ? {
              ...doc,
              status: actionType === 'approve' ? 'approved' :
                actionType === 'reject' ? 'rejected' : 'needs_resubmission',
              feedback: feedback,
              reviewed_at: new Date().toISOString()
            }
            : doc
        ));

        await sendDocumentNotification(selectedUser.id, document.document_type, actionType, feedback);
        await checkAndUpdateUserVerification(selectedUser.id);

        showToast(`Document ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'requires resubmission'}`, "success");
        await fetchUserDocuments(selectedUser.id);
      }
    } catch (error) {
      console.error('Error updating document:', error);
      showToast(`Failed to update document: ${error.message}`, "error");
    } finally {
      setProcessingAction(null);
    }
  };

  const checkAndUpdateUserVerification = async (userId) => {
    try {
      const response = await apiCall('GET_USER_DOCUMENTS', { userId });
      if (response.success && Array.isArray(response.documents)) {
        const allApproved = response.documents.every(doc => doc.status === 'approved');
        const anyRejected = response.documents.some(doc => doc.status === 'rejected');
        const anyNeedsResubmission = response.documents.some(doc => doc.status === 'needs_resubmission');

        let userStatus = 'pending';
        if (allApproved) userStatus = 'verified';
        else if (anyRejected) userStatus = 'rejected';
        else if (anyNeedsResubmission) userStatus = 'needs_resubmission';

        await apiCall('UPDATE_USER_VERIFICATION_STATUS', { id: userId }, {
          data: {
            verification_status: userStatus,
            verification_step_status: userStatus
          }
        });

        return userStatus;
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const sendDocumentNotification = async (userId, documentType, action, feedback) => {
    try {
      const documentLabels = {
        'kebele_id': 'Kebele ID',
        'proof_of_income': 'Proof of Income',
        'business_license': 'Business License',
        'tax_id': 'Tax ID',
        'id_card': 'ID Card',
        'passport': 'Passport'
      };

      const notificationData = {
        userId: userId,
        type: 'document',
        title: action === 'approve' ? 'Document Approved' :
          action === 'reject' ? 'Document Rejected' :
            'Document Needs Resubmission',
        message: `${documentLabels[documentType] || documentType}: ${feedback || getDefaultDocumentMessage(action)}`,
        status: action,
        document_type: documentType,
        action_url: '/buyer-renter?step=2&resubmit=true'
      };

      await apiCall("EXTERNAL_NOTIFICATION", {}, {
        data: notificationData,
        method: 'POST'
      });
    } catch (error) {
      console.error("Error sending document notification:", error);
    }
  };

  const getDefaultDocumentMessage = (action) => {
    switch (action) {
      case 'approve': return 'Your document has been approved.';
      case 'reject': return 'Your document was rejected.';
      case 'needs_resubmission': return 'Your document requires resubmission.';
      default: return 'Your document status has been updated.';
    }
  };

  const sendVerificationNotification = async (userId, action, feedback) => {
    try {
      const notificationData = {
        userId: userId,
        type: 'verification',
        title: action === 'approve' ? 'Verification Approved' :
          action === 'reject' ? 'Verification Rejected' :
            'Resubmission Required',
        message: feedback || getDefaultNotificationMessage(action),
        status: action,
        verification_reason: feedback,
        action_url: '/profile/verification'
      };

      // Use the correct API endpoint with internal token
      const response = await apiCall("EXTERNAL_NOTIFICATION", {}, {
        data: notificationData,
        method: 'POST',
        // Add internal token header
        headers: {
          'x-internal-token': 'communication-service-secret-12345'
        }
      });

      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      // Don't throw error - notification failure shouldn't block verification
      return null;
    }
  };

  const getDefaultNotificationMessage = (action) => {
    switch (action) {
      case 'approve': return 'Your identity verification has been approved. You can now explore properties.';
      case 'reject': return 'Your verification was rejected. Please contact support for details.';
      case 'resubmission': return 'Your verification requires resubmission. Please upload corrected documents.';
      default: return 'Your verification status has been updated.';
    }
  };

  const showToast = (message, type = "info") => {
    if (setToast) {
      setToast({
        show: true,
        message,
        type,
      });
    }
  };

  const getCurrentUsers = () => {
    switch (activeTab) {
      case 'pending':
        return pendingVerifications.filter(user =>
          ['pending', 'submitted', 'reviewing', 'needs_resubmission'].includes(
            user.verification_step_status
          )
        );
      case 'approved': return verifiedUsers;
      case 'rejected': return rejectedUsers;
      default: return [];
    }
  };

  const filteredUsers = getCurrentUsers().filter(user => {
    const matchesSearch = searchTerm === "" ||
      `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone_number && user.phone_number.includes(searchTerm));

    const matchesRole = filterRole === "all" || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (status) => {
    const configs = {
      pending: {
        icon: Clock,
        label: 'Awaiting Review',
        color: 'amber',
        bg: isDark ? 'bg-amber-900/30' : 'bg-amber-100',
        textColor: isDark ? 'text-amber-300' : 'text-amber-800',
        count: pendingVerifications.filter(user =>
          ['pending', 'submitted', 'reviewing', 'needs_resubmission'].includes(
            user.verification_step_status
          )
        ).length
      },
      approved: {
        icon: CheckCircle,
        label: 'Verified',
        color: 'green',
        bg: isDark ? 'bg-green-900/30' : 'bg-green-100',
        textColor: isDark ? 'text-green-300' : 'text-green-800',
        count: verifiedUsers.length
      },
      rejected: {
        icon: XCircle,
        label: 'Rejected',
        color: 'red',
        bg: isDark ? 'bg-red-900/30' : 'bg-red-100',
        textColor: isDark ? 'text-red-300' : 'text-red-800',
        count: rejectedUsers.length
      }
    };

    return configs[status] || configs['pending'];
  };

  const getRoleBadgeColor = (role) => {
    const roleConfigs = {
      'buyer': {
        icon: Home,
        bg: isDark ? 'bg-blue-900/30' : 'bg-blue-100',
        text: isDark ? 'text-blue-300' : 'text-blue-800'
      },
      'renter': {
        icon: Key,
        bg: isDark ? 'bg-green-900/30' : 'bg-green-100',
        text: isDark ? 'text-green-300' : 'text-green-800'
      },
      'seller': {
        icon: CreditCard,
        bg: isDark ? 'bg-purple-900/30' : 'bg-purple-100',
        text: isDark ? 'text-purple-300' : 'text-purple-800'
      },
      'landlord': {
        icon: Building,
        bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100',
        text: isDark ? 'text-orange-300' : 'text-orange-800'
      },
      'broker': {
        icon: User,
        bg: isDark ? 'bg-amber-900/30' : 'bg-amber-100',
        text: isDark ? 'text-amber-300' : 'text-amber-800'
      },
      'external_broker': {
        icon: Building,
        bg: isDark ? 'bg-amber-900/30' : 'bg-amber-100',
        text: isDark ? 'text-amber-300' : 'text-amber-800'
      },
      'internal_broker': {
        icon: Building,
        bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100',
        text: isDark ? 'text-orange-300' : 'text-orange-800'
      }
    };

    return roleConfigs[role] || { icon: User, bg: isDark ? 'bg-gray-700' : 'bg-gray-100', text: isDark ? 'text-gray-300' : 'text-gray-800' };
  };

  // Resubmission Modal
  // Resubmission Modal - FIXED VERSION
  const ResubmissionModal = () => {
    if (!showResubmissionModal || !selectedUser) return null;

    // Use separate state for resubmission modal only
    const [resubmissionFeedback, setResubmissionFeedback] = useState("");
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [documentSpecificFeedback, setDocumentSpecificFeedback] = useState({});

    useEffect(() => {
      if (selectedUser) {
        fetchUserDocuments(selectedUser.id).then(result => {
          if (result.success && result.documents.length > 0) {
            const pendingDocs = result.documents.filter(doc =>
              doc.status === 'pending' || doc.status === ''
            );
            setSelectedDocuments(pendingDocs.map(doc => doc.id));

            const initialFeedback = {};
            pendingDocs.forEach(doc => {
              initialFeedback[doc.id] = '';
            });
            setDocumentSpecificFeedback(initialFeedback);
          }
        });
      }
    }, [selectedUser]);

    useEffect(() => {
      if (selectedUser) {
        fetchUserDocuments(selectedUser.id).then(result => {
          if (result.success && result.documents.length > 0) {
            const pendingDocs = result.documents.filter(doc =>
              doc.status === 'pending' || doc.status === ''
            );
            setSelectedDocuments(pendingDocs.map(doc => doc.id));

            const initialFeedback = {};
            pendingDocs.forEach(doc => {
              initialFeedback[doc.id] = '';
            });
            setDocumentSpecificFeedback(initialFeedback);

            // AUTO-GENERATE MESSAGE HERE
            const autoMessage = `Dear ${selectedUser.first_name},\n\nWe need the following documents to be resubmitted:\n\n${pendingDocs.map(doc => `• ${doc.label}: Please provide a clearer, well-lit image with all corners visible`).join('\n')}\n\nPlease ensure documents are:\n- Recent (within 6 months)\n- High resolution and clear\n- Complete (all edges visible)\n- Unedited and original`;

            setResubmissionFeedback(autoMessage);
          }
        });
      }
    }, [selectedUser]);

    const handleDocumentToggle = (docId) => {
      setSelectedDocuments(prev =>
        prev.includes(docId)
          ? prev.filter(id => id !== docId)
          : [...prev, docId]
      );
    };

    const handleDocumentFeedbackChange = (docId, feedback) => {
      setDocumentSpecificFeedback(prev => ({
        ...prev,
        [docId]: feedback
      }));
    };

    const handleSubmitResubmission = async () => {
      if (!selectedUser) return;

      try {
        setProcessingAction(`resubmission-${selectedUser.id}`);

        const documentFeedback = selectedDocuments.map(docId => ({
          documentId: docId,
          feedback: documentSpecificFeedback[docId] || 'Please resubmit this document'
        }));

        const payload = {
          feedback: resubmissionFeedback.trim(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          documents: documentFeedback,
          specificInstructions: resubmissionFeedback.trim()
        };

        const response = await apiCall('REQUEST_RESUBMISSION', {
          userId: selectedUser.id
        }, {
          data: payload,
          method: 'POST'
        });

        if (response && response.success) {
          // Update each document status individually
          for (const docId of selectedDocuments) {
            await apiCall('UPDATE_DOCUMENT_STATUS', {
              documentId: docId
            }, {
              data: {
                status: 'needs_resubmission',
                feedback: documentSpecificFeedback[docId] || 'Needs resubmission',
                requires_resubmission: true
              },
              method: 'POST'
            });
          }

          // Update UI
          setPendingVerifications(prev => prev.map(user =>
            user.id === selectedUser.id
              ? {
                ...user,
                verification_step_status: 'needs_resubmission',
                verification_feedback: resubmissionFeedback.trim(),
                documents_need_resubmission: true
              }
              : user
          ));

          showToast(`Resubmission requested for ${selectedDocuments.length} document(s). User has been notified.`, "success");

          // Close modal and reset states
          setShowResubmissionModal(false);
          setResubmissionFeedback(""); // Use local state
          setActionType(null);
          setSelectedUser(null);
          setSelectedDocuments([]);
          setDocumentSpecificFeedback({});

          // Refresh data
          await fetchVerificationStats();
          await fetchAllData();
        }
      } catch (error) {
        console.error('Error:', error);
        showToast(`Failed: ${error.message}`, "error");
      } finally {
        setProcessingAction(null);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
        <div className={`max-w-4xl w-full rounded-xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"} p-6 max-h-[90vh] overflow-y-auto`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDark ? `bg-orange-900/30` : `bg-orange-100`}`}>
              <AlertCircle className={`w-6 h-6 ${isDark ? `text-orange-400` : `text-orange-600`}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Request Document Resubmission
              </h3>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {selectedUser.first_name} {selectedUser.last_name} • {selectedUser.role}
              </p>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Select specific documents that need to be resubmitted
              </p>
            </div>
          </div>

          {userDocuments.length > 0 && (
            <div className="mb-6">
              <h4 className={`font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Select documents needing resubmission:
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto p-2">
                {userDocuments.map((doc) => (
                  <div key={doc.id} className={`p-3 rounded-lg border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={() => handleDocumentToggle(doc.id)}
                          className="w-4 h-4 rounded"
                        />
                        <div>
                          <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                            {doc.label || doc.document_type?.replace('_', ' ')}
                          </p>
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            {doc.filename || 'Document'} • {doc.status || 'pending'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        className={`p-1.5 rounded ${isDark ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300"}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedDocuments.includes(doc.id) && (
                      <div className="mt-3">
                        <textarea
                          placeholder={`Specific feedback for ${doc.label || 'this document'}...`}
                          value={documentSpecificFeedback[doc.id] || ''}
                          onChange={(e) => handleDocumentFeedbackChange(doc.id, e.target.value)}
                          className={`w-full p-2 text-sm rounded border ${isDark ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          rows="2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FIXED: Use separate state for resubmission feedback */}
          <div className="mb-6">
            <label className={`block mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              General instructions for the user:
            </label>
            <textarea
              value={resubmissionFeedback}
              onChange={(e) => setResubmissionFeedback(e.target.value)}
              placeholder="e.g., Please upload clearer images. Make sure all text is visible..."
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 ${isDark
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              rows="4"
            />
          </div>

          <div className={`p-4 rounded-lg mb-4 ${isDark ? "bg-orange-900/20 border border-orange-800" : "bg-orange-50 border border-orange-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className={`w-5 h-5 ${isDark ? "text-orange-400" : "text-orange-600"}`} />
              <span className={`font-medium ${isDark ? "text-orange-300" : "text-orange-800"}`}>
                What will happen:
              </span>
            </div>
            <ul className={`text-sm space-y-1 ${isDark ? "text-orange-200" : "text-orange-700"}`}>
              <li>• User will receive a notification with your feedback</li>
              <li>• Selected documents will be marked as "needs resubmission"</li>
              <li>• User will have 7 days to resubmit documents</li>
              <li>• User's verification status will update to "Needs Resubmission"</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowResubmissionModal(false);
                setResubmissionFeedback(""); // Clear local state
                setActionType(null);
                setSelectedDocuments([]);
                setSelectedUser(null);
              }}
              className={`px-4 py-2 rounded-lg ${isDark
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitResubmission}
              disabled={!resubmissionFeedback.trim() || processingAction || selectedDocuments.length === 0}
              className={`px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {processingAction ? (
                <Loader2 className="w-5 h-5 animate-spin inline" />
              ) : (
                `Request Resubmission (${selectedDocuments.length} docs)`
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Feedback Modal for Approve/Reject
  const FeedbackModal = () => {
    if (!showFeedbackModal || !selectedUser || actionType === 'resubmission') return null;

    const actionLabels = {
      'approve': {
        title: 'Approve Verification',
        icon: CheckCircle,
        color: 'green',
        description: 'Approve all documents and complete user verification'
      },
      'reject': {
        title: 'Reject Verification',
        icon: XCircle,
        color: 'red',
        description: 'Reject the verification request entirely'
      }
    };

    const actionLabel = actionLabels[actionType];
    if (!actionLabel) return null;

    const Icon = actionLabel.icon;

    const handleSubmitFeedback = async () => {
      if (!selectedUser || !actionType) return;

      try {
        setProcessingAction(`${actionType}-${selectedUser.id}`);

        let endpointKey;
        let payload = {
          feedback: feedbackText.trim()
        };

        if (actionType === 'approve') {
          endpointKey = 'ADMIN_COMPLETE_VERIFICATION';
          payload = {
            ...payload,
            overallStatus: 'approved',
            notes: feedbackText.trim()
          };
        } else if (actionType === 'reject') {
          endpointKey = 'REJECT_WITH_FEEDBACK';
          payload = {
            ...payload,
            reason: feedbackText.trim()
          };
        }

        const response = await apiCall(endpointKey, {
          userId: selectedUser.id
        }, {
          data: payload,
          method: 'POST'
        });

        if (response && response.success) {
          // Remove from pending verifications
          setPendingVerifications(prev => prev.filter(user => user.id !== selectedUser.id));

          if (actionType === 'approve') {
            // Add to verified users
            const updatedUser = {
              ...selectedUser,
              verification_status: 'approved',
              verification_step_status: 'verified',
              verified_at: new Date().toISOString()
            };
            setVerifiedUsers(prev => [updatedUser, ...prev]);

            // Remove from rejected users if they were there
            setRejectedUsers(prev => prev.filter(user => user.id !== selectedUser.id));
          } else if (actionType === 'reject') {
            // Add to rejected users
            const updatedUser = {
              ...selectedUser,
              verification_status: 'rejected',
              verification_step_status: 'rejected',
              document_rejection_reason: feedbackText.trim()
            };
            setRejectedUsers(prev => [updatedUser, ...prev]);

            // Remove from verified users if they were there
            setVerifiedUsers(prev => prev.filter(user => user.id !== selectedUser.id));
          }

          showToast(
            `Verification ${actionType === 'approve' ? 'approved' : 'rejected'} successfully.`,
            "success"
          );

          // Optional: You can comment this out since backend handles notifications
          // await sendVerificationNotification(selectedUser.id, actionType, feedbackText);

          setShowFeedbackModal(false);
          setFeedbackText("");
          setActionType(null);
          setSelectedUser(null);

          // Force refresh data from server
          await fetchAllData();
        }
      } catch (error) {
        console.error('Error:', error);
        showToast(`Failed: ${error.message}`, "error");
      } finally {
        setProcessingAction(null);
      }
    };


    return (
      <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
        <div className={`max-w-md w-full rounded-xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"} p-6 max-h-[90vh] overflow-y-auto`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDark ? `bg-${actionLabel.color}-900/30` : `bg-${actionLabel.color}-100`}`}>
              <Icon className={`w-6 h-6 ${isDark ? `text-${actionLabel.color}-400` : `text-${actionLabel.color}-600`}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {actionLabel.title}
              </h3>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {selectedUser.first_name} {selectedUser.last_name} • {selectedUser.role}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className={`block ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {actionType === 'approve'
                  ? 'Optional welcome message:'
                  : 'Reason for rejection:'}
              </label>
              <button
                type="button"
                onClick={() => {
                  if (actionType === 'approve') {
                    setFeedbackText(`Congratulations ${selectedUser.first_name}! Your identity verification has been successfully approved. You now have full access to all ${selectedUser.role.replace('_', ' ')} features on WubLand. Welcome aboard!`);
                  } else if (actionType === 'reject') {
                    setFeedbackText(`Dear ${selectedUser.first_name},\n\nYour verification request could not be approved at this time. The submitted documents require further review.\n\nPlease contact our support team for specific details regarding your case.`);
                  }
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${isDark
                  ? actionType === 'approve' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                  : actionType === 'approve' ? "bg-green-100 hover:bg-green-200 text-green-700" : "bg-red-100 hover:bg-red-200 text-red-700"
                  }`}
              >
                <MessageCircle className="w-3 h-3" />
                Auto Message
              </button>
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={
                actionType === 'approve'
                  ? 'e.g., Welcome to WubLand! Your verification is complete.'
                  : 'e.g., Documents are unclear or expired. Please contact support.'
              }
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 ${isDark
                ? `bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-${actionType === 'approve' ? 'green' : 'red'}-500`
                : `bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-${actionType === 'approve' ? 'green' : 'red'}-500`
                }`}
              rows="4"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowFeedbackModal(false);
                setFeedbackText("");
                setActionType(null);
                setSelectedUser(null);
              }}
              className={`px-4 py-2 rounded-lg ${isDark
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitFeedback}
              disabled={processingAction}
              className={`px-4 py-2 rounded-lg ${actionType === 'approve'
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {processingAction ? (
                <Loader2 className="w-5 h-5 animate-spin inline" />
              ) : (
                actionType === 'approve' ? "Approve" : "Reject"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Document Feedback Modal
  const DocumentFeedbackModal = () => {
    if (!showDocumentFeedbackModal || !selectedDocument) return null;

    const actionLabels = {
      'approve': { title: 'Approve Document', icon: CheckCircle, color: 'green' },
      'reject': { title: 'Reject Document', icon: XCircle, color: 'red' },
      'needs_resubmission': { title: 'Request Document Resubmission', icon: AlertCircle, color: 'orange' }
    };

    const actionLabel = actionLabels[documentActionType] || actionLabels['needs_resubmission'];
    const Icon = actionLabel.icon;

    const handleSubmit = async () => {
      if (!selectedDocument || !documentFeedback.trim()) {
        showToast("Please provide feedback for the document", "warning");
        return;
      }

      try {
        await handleDocumentAction(selectedDocument, documentActionType, documentFeedback);
        setShowDocumentFeedbackModal(false);
        setSelectedDocument(null);
        setDocumentActionType(null);
        setDocumentFeedback("");
      } catch (error) {
        console.error('Error submitting document feedback:', error);
      }
    };

    const handleGenerateAutoMessage = () => {
      const messages = {
        'approve': `Your ${selectedDocument.label} has been verified successfully. Thank you for providing clear documentation.`,
        'reject': `Your ${selectedDocument.label} could not be approved. Please ensure the document is current, clear, and shows all required information.`,
        'needs_resubmission': `Your ${selectedDocument.label} needs to be resubmitted. Please upload a clearer image where all text is legible and all corners are visible.`
      };

      setDocumentFeedback(messages[documentActionType] || messages['needs_resubmission']);
    };

    return (
      <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
        <div className={`max-w-md w-full rounded-xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDark ? `bg-${actionLabel.color}-900/30` : `bg-${actionLabel.color}-100`}`}>
              <Icon className={`w-6 h-6 ${isDark ? `text-${actionLabel.color}-400` : `text-${actionLabel.color}-600`}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {actionLabel.title}
              </h3>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {selectedDocument.label || selectedDocument.document_type}
              </p>
            </div>
          </div>

          {/* Textarea section with Auto button */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
                {documentActionType === 'approve'
                  ? "Provide optional feedback for this document (user will see this):"
                  : "Provide feedback for this document (user will see this):"}
              </p>
              <button
                type="button"
                onClick={handleGenerateAutoMessage}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${isDark
                  ? documentActionType === 'approve'
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : documentActionType === 'reject'
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-orange-600 hover:bg-orange-700 text-white"
                  : documentActionType === 'approve'
                    ? "bg-green-100 hover:bg-green-200 text-green-700"
                    : documentActionType === 'reject'
                      ? "bg-red-100 hover:bg-red-200 text-red-700"
                      : "bg-orange-100 hover:bg-orange-200 text-orange-700"
                  }`}
              >
                <MessageCircle className="w-3 h-3" />
                Auto
              </button>
            </div>
            <textarea
              value={documentFeedback}
              onChange={(e) => setDocumentFeedback(e.target.value)}
              placeholder={
                documentActionType === 'approve'
                  ? "e.g., Document verified successfully..."
                  : documentActionType === 'reject'
                    ? "e.g., Document is blurry, ID is expired..."
                    : "e.g., Please upload a clearer image of this document..."
              }
              className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 ${isDark
                ? `bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-${actionLabel.color}-500`
                : `bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-${actionLabel.color}-500`
                }`}
              rows="4"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowDocumentFeedbackModal(false);
                setSelectedDocument(null);
                setDocumentActionType(null);
                setDocumentFeedback("");
              }}
              className={`px-4 py-2 rounded-lg ${isDark
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!documentFeedback.trim() || processingAction}
              className={`px-4 py-2 rounded-lg ${actionLabel.color === 'green'
                ? "bg-green-600 hover:bg-green-700"
                : actionLabel.color === 'red'
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-orange-600 hover:bg-orange-700"
                } text-white disabled:opacity-50`}
            >
              {processingAction ? (
                <Loader2 className="w-5 h-5 animate-spin inline" />
              ) : (
                actionLabel.title
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // User Documents Viewer
  const UserDocumentsViewer = () => {
    if (!showDocumentsViewer || !selectedUser) return null;

    const [selectedImage, setSelectedImage] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);
    const [activeDocumentIndex, setActiveDocumentIndex] = useState(0);

    const roleConfig = getRoleBadgeColor(selectedUser.role);
    const statusConfig = getStatusBadge(selectedUser.verification_status || 'pending');
    const RoleIcon = roleConfig.icon;
    const StatusIcon = statusConfig.icon;

    const handleDownload = (url, filename) => {
      if (!url) return;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleViewImage = (doc, index) => {
      if (!doc) return;

      const docUrl = doc.document_url || doc.url || '';

      if (!docUrl) {
        console.warn('No URL found for document:', doc);
        return;
      }

      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(docUrl);

      if (isImage) {
        setSelectedImage({
          url: docUrl,
          label: doc.label || (doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Document'),
          type: doc.document_type || doc.type || 'unknown',
          uploaded_at: doc.uploaded_at || doc.created_at
        });
        setActiveDocumentIndex(index);
        setZoomLevel(1);
        setRotation(0);
      } else {
        window.open(docUrl, '_blank');
      }
    };

    const handleNextDocument = () => {
      if (userDocuments.length === 0) return;
      const nextIndex = (activeDocumentIndex + 1) % userDocuments.length;
      handleViewImage(userDocuments[nextIndex], nextIndex);
    };

    const handlePrevDocument = () => {
      if (userDocuments.length === 0) return;
      const prevIndex = (activeDocumentIndex - 1 + userDocuments.length) % userDocuments.length;
      handleViewImage(userDocuments[prevIndex], prevIndex);
    };

    const getFileIcon = (type, url) => {
      if (!type && !url) return <File className="w-5 h-5" />;

      const cleanType = type || 'unknown';
      const extension = url ? url.split('.').pop().toLowerCase() : '';

      const fileIcons = {
        'kebele_id': FileKey,
        'proof_of_income': FileDigit,
        'business_license': FileSignature,
        'tax_id': FileArchive,
        'id_card': BadgeCheck,
        'passport': FileText,
        'additional_document': File,
        'unknown': File
      };

      const IconComponent = fileIcons[cleanType] ||
        (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) ? Image :
          extension === 'pdf' ? FileText : File);

      return <IconComponent className="w-5 h-5" />;
    };

    const safeDocuments = userDocuments.map((doc, index) => ({
      id: doc.id || index,
      type: doc.document_type || doc.type || 'unknown',
      url: doc.document_url || doc.url || '',
      filename: doc.document_filename || doc.filename || `document-${index + 1}`,
      status: doc.status || 'pending',
      uploaded_at: doc.uploaded_at || doc.created_at,
      reviewed_at: doc.reviewed_at,
      review_notes: doc.review_notes,
      rejection_reason: doc.rejection_reason,
      document_type: doc.document_type || doc.type,
      document_url: doc.document_url || doc.url,
      document_filename: doc.document_filename || doc.filename,
      label: doc.label || (doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Document')
    }));

    const hasMultipleImages = safeDocuments.filter(doc =>
      doc.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.url)
    ).length > 1;

    return (
      <>
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
          onClick={() => {
            setShowDocumentsViewer(false);
            setSelectedUser(null);
            setSelectedImage(null);
          }}
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-6xl rounded-2xl shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} flex flex-col max-h-[90vh] overflow-hidden`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
                  <FileSearch className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <div className="flex-1">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Verification Documents
                  </h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedUser.first_name} {selectedUser.last_name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${roleConfig.bg} ${roleConfig.text}`}>
                      <RoleIcon className="w-3 h-3 inline mr-1" />
                      {selectedUser.role.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.textColor}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {statusConfig.label}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                      {safeDocuments.length} document(s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenFeedbackModal(selectedUser, 'approve')}
                  disabled={processingAction}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleOpenFeedbackModal(selectedUser, 'resubmission')}
                  disabled={processingAction}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <AlertCircle className="w-4 h-4" />
                  Request Fix
                </button>
                <button
                  onClick={() => handleOpenFeedbackModal(selectedUser, 'reject')}
                  disabled={processingAction}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => {
                    setShowDocumentsViewer(false);
                    setSelectedUser(null);
                    setSelectedImage(null);
                  }}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
              <div className={`w-96 border-r ${isDark ? 'border-gray-800' : 'border-gray-200'} overflow-y-auto`}>
                <div className="p-6">
                  <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Uploaded Documents ({safeDocuments.length})
                  </h3>

                  {safeDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <Archive className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-400'}`} />
                      <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        No documents submitted
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        User has not uploaded any verification documents
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeDocuments.map((doc, index) => {
                        const docUrl = doc.url || doc.document_url || '';
                        const isImage = docUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(docUrl);
                        const Icon = getFileIcon(doc.type, docUrl);
                        const docStatus = getStatusBadge(doc.status || 'pending');
                        const isActive = selectedImage && selectedImage.url === docUrl;

                        return (
                          <div
                            key={doc.id}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${isActive ? 'ring-2 ring-amber-500' : ''} ${isDark
                              ? 'bg-gray-800/50 hover:bg-gray-800 border-gray-700 hover:border-gray-600'
                              : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                            onClick={() => handleViewImage(doc, index)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                {Icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {doc.label}
                                  </p>
                                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${docStatus.bg} ${docStatus.textColor}`}>
                                    <docStatus.icon className="w-3 h-3" />
                                    <span>{docStatus.label}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                    {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Unknown date'}
                                  </span>
                                  <div className="flex gap-2">
                                    {isImage ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewImage(doc, index);
                                        }}
                                        className={`p-1.5 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                        title="View"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownload(docUrl, doc.filename || doc.document_filename || doc.label);
                                        }}
                                        className={`p-1.5 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                        title="Download"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(docUrl, '_blank');
                                      }}
                                      className={`p-1.5 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                      title="Open in new tab"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex">
                {selectedImage ? (
                  <div className="flex-1 flex flex-col">
                    <div className={`p-4 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {selectedImage.label}
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Uploaded: {selectedImage.uploaded_at ? new Date(selectedImage.uploaded_at).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasMultipleImages && (
                            <>
                              <button
                                onClick={handlePrevDocument}
                                className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                title="Previous document"
                              >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                              </button>
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {activeDocumentIndex + 1} / {safeDocuments.length}
                              </span>
                              <button
                                onClick={handleNextDocument}
                                className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                                title="Next document"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                            disabled={zoomLevel >= 3}
                            title="Zoom in"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.5))}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                            disabled={zoomLevel <= 0.5}
                            title="Zoom out"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRotation(r => (r + 90) % 360)}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                            title="Rotate"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(selectedImage.url, selectedImage.label)}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setFullscreen(!fullscreen)}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                          >
                            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                      <div className={`relative ${fullscreen ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : ''}`}>
                        {fullscreen && (
                          <button
                            onClick={() => setFullscreen(false)}
                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg z-10"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        )}
                        <img
                          src={selectedImage.url}
                          alt={selectedImage.label}
                          className={`transition-all duration-200 ${fullscreen ? 'max-w-full max-h-full object-contain' : 'max-w-full max-h-full'}`}
                          style={{
                            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                            cursor: zoomLevel > 1 ? 'grab' : 'default'
                          }}
                          onMouseDown={(e) => {
                            if (zoomLevel > 1) {
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startTransform = e.target.style.transform;

                              const handleMouseMove = (moveEvent) => {
                                const dx = moveEvent.clientX - startX;
                                const dy = moveEvent.clientY - startY;
                                e.target.style.transform = `${startTransform} translate(${dx}px, ${dy}px)`;
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }
                          }}
                          onError={handleImageError}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                      <Image className={`w-20 h-20 mx-auto mb-6 ${isDark ? 'text-gray-700' : 'text-gray-400'}`} />
                      <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Select a document to preview
                      </h3>
                      <p className={`text-sm mb-6 max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Click on any document from the list to view it here.
                        Images will be displayed, PDFs and other files can be downloaded or opened in a new tab.
                      </p>
                      <div className="flex flex-col gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <Eye className="w-4 h-4" />
                          </div>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            Click the eye icon to view images
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <Download className="w-4 h-4" />
                          </div>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            Click the download icon to save files
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <ExternalLink className="w-4 h-4" />
                          </div>
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            Click the external link to open in new tab
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`w-64 border-l ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'} overflow-y-auto`}>
                  <div className="p-6">
                    <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <History className="w-4 h-4" />
                      Verification History
                    </h4>
                    {verificationHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock3 className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-400'}`} />
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          No verification history found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {verificationHistory.map((entry, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {entry.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {entry.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                              {entry.status === 'needs_resubmission' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {entry.status}
                              </span>
                            </div>
                            {entry.feedback && (
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {entry.feedback}
                              </p>
                            )}
                            {entry.admin_first_name && (
                              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Reviewed by: {entry.admin_first_name} {entry.admin_last_name}
                              </p>
                            )}
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Stat Card Component
  const StatCard = ({ label, value, icon: Icon, color, isDark }) => (
    <div className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{label}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${isDark ? `bg-${color}-900/30` : `bg-${color}-100`}`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? "bg-amber-400/10" : "bg-amber-100"}`}>
              <Shield className={`w-6 h-6 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
            </div>
            <h2 className={`text-2xl lg:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              User Verification
            </h2>
          </div>
          <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Review identity documents and manage user verification status
          </p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={loading}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${isDark
            ? "bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50"
            : "bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50"
            }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total"
          value={verificationStats.total}
          icon={Users}
          color="blue"
          isDark={isDark}
        />
        <StatCard
          label="Pending"
          value={verificationStats.pending}
          icon={Clock}
          color="amber"
          isDark={isDark}
        />
        <StatCard
          label="Approved"
          value={verificationStats.approved}
          icon={CheckCircle}
          color="green"
          isDark={isDark}
        />
        <StatCard
          label="Rejected"
          value={verificationStats.rejected}
          icon={XCircle}
          color="red"
          isDark={isDark}
        />
        <StatCard
          label="Resubmission"
          value={verificationStats.needs_resubmission}
          icon={AlertCircle}
          color="orange"
          isDark={isDark}
        />
        <StatCard
          label="Today"
          value={verificationStats.today}
          icon={Calendar}
          color="purple"
          isDark={isDark}
        />
      </div>

      {/* Tabs */}
      <div className={`p-1 rounded-xl border ${isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"}`}>
        <div className="flex space-x-1">
          {['pending', 'approved', 'rejected'].map((tab) => {
            const isActive = activeTab === tab;
            const configs = {
              pending: { icon: Clock, label: 'Pending', color: 'amber', count: verificationStats.pending },
              approved: { icon: CheckCircle, label: 'Approved', color: 'green', count: verificationStats.approved },
              rejected: { icon: XCircle, label: 'Rejected', color: 'red', count: verificationStats.rejected }
            };
            const config = configs[tab];
            const Icon = config.icon;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                  ? `bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 text-white shadow-lg`
                  : isDark
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{config.label}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${isActive
                  ? "bg-white/20"
                  : isDark
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-700"
                  }`}>
                  {config.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${isDark ? "text-gray-400" : "text-gray-600"} w-5 h-5`} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 ${isDark
              ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:border-amber-500"
              : "bg-white text-black border-gray-300 placeholder-gray-500 focus:border-amber-500"
              }`}
          />
        </div>
        <div className="flex gap-3">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 ${isDark
              ? "bg-gray-700 text-white border-gray-600"
              : "bg-white text-black border-gray-300"
              }`}
          >
            <option value="all">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="renter">Renters</option>
            <option value="seller">Sellers</option>
            <option value="external_broker">External Brokers</option>
            <option value="internal_broker">Internal Brokers</option>
            <option value="landlord">Landlords</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 ${isDark
              ? "bg-gray-700 text-white border-gray-600"
              : "bg-white text-black border-gray-300"
              }`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="reviewing">Reviewing</option>
            <option value="needs_resubmission">Needs Resubmission</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Loading verification data...
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border-2 border-dashed transition-colors duration-200 ${isDark
          ? "border-gray-700 text-gray-400 bg-gray-800/50"
          : "border-gray-300 text-gray-500 bg-gray-50"
          }`}>
          <Shield className="w-20 h-20 mx-auto mb-4 opacity-50" />
          <h3 className={`text-lg font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            No {activeTab} verifications found
          </h3>
          <p className="text-sm opacity-75">
            {searchTerm || filterRole !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria"
              : `No users with ${activeTab} verification status`}
          </p>
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden border transition-all duration-200 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`transition-colors duration-200 ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    Role & Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    Status & Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors duration-200 ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
                {filteredUsers.map((user) => {
                  const roleConfig = getRoleBadgeColor(user.role);
                  const statusConfig = getStatusBadge(user.verification_status || 'pending');
                  const RoleIcon = roleConfig.icon;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={user.id} className={`transition-all duration-200 ${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <div>
                            <h4 className="font-medium">{user.first_name} {user.last_name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${roleConfig.bg} ${roleConfig.text}`}>
                              <RoleIcon className="w-3 h-3 inline mr-1" />
                              {user.role.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm truncate max-w-[200px]">{user.email}</span>
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{user.phone_number}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.textColor}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusConfig.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {user.updated_at ? new Date(user.updated_at).toLocaleDateString() :
                              user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDocuments(user)}
                            disabled={processingAction === user.id}
                            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                            title="Review Documents"
                          >
                            {processingAction === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                            Review
                          </button>
                          {activeTab === 'pending' && (
                            <>
                              <button
                                onClick={() => handleOpenFeedbackModal(user, 'approve')}
                                disabled={processingAction === `approve-${user.id}`}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                                title="Approve"
                              >
                                {processingAction === `approve-${user.id}` ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleOpenFeedbackModal(user, 'resubmission')}
                                disabled={processingAction === `resubmission-${user.id}`}
                                className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                                title="Request Resubmission"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenFeedbackModal(user, 'reject')}
                                disabled={processingAction === `reject-${user.id}`}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals - Resubmission appears on top */}
      <ResubmissionModal />
      <FeedbackModal />
      <UserDocumentsViewer />
      <DocumentFeedbackModal />
    </div>
  );
};

export default UserVerification;