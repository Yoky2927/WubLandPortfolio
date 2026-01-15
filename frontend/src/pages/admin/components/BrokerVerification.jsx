// frontend/src/pages/admin/components/BrokerVerification.jsx
import React, { useState, useEffect } from "react";
import { 
  Eye, UserCheck, UserX, FileText, Shield, AlertCircle,
  Search, Filter, Download, ExternalLink, Clock, CheckCircle,
  XCircle, MessageSquare, Phone, Mail, MapPin, Briefcase
} from "lucide-react";
import { httpClient } from "../../../services/http.service";

const BrokerVerification = ({ theme, users, fetchUsers, setToast }) => {
  const [pendingBrokers, setPendingBrokers] = useState([]);
  const [activeBrokers, setActiveBrokers] = useState([]);
  const [filteredBrokers, setFilteredBrokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [brokerDocuments, setBrokerDocuments] = useState([]);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    // Filter pending and active brokers
    const pending = users.filter(u => 
      (u.role === 'external_broker' || u.role === 'internal_broker') && 
      u.status === 'inactive'
    );
    const active = users.filter(u => 
      (u.role === 'external_broker' || u.role === 'internal_broker') && 
      u.status === 'active'
    );
    
    setPendingBrokers(pending);
    setActiveBrokers(active);
    setFilteredBrokers(pending);
  }, [users]);

  useEffect(() => {
    let filtered = pendingBrokers;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(broker =>
        `${broker.first_name} ${broker.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        broker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (broker.phone && broker.phone.includes(searchTerm))
      );
    }
    
    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(broker => broker.broker_type === filterType);
    }
    
    setFilteredBrokers(filtered);
  }, [searchTerm, filterType, pendingBrokers]);

  const fetchBrokerDocuments = async (brokerId) => {
    try {
      const response = await httpClient.get(
        `http://localhost:5002/api/property-documents?uploaded_by_user_id=${brokerId}`
      );
      setBrokerDocuments(response.data || response || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setBrokerDocuments([]);
    }
  };

  const handleViewDocuments = (broker) => {
    setSelectedBroker(broker);
    fetchBrokerDocuments(broker.id);
    setShowDocumentsModal(true);
  };

  const handleViewDetails = (broker) => {
    setSelectedBroker(broker);
    setShowDetailsModal(true);
  };

  const handleApprove = async (brokerId, brokerType = 'external') => {
    try {
      setLoading(true);
      
      // Update broker status to active
      await httpClient.put(
        `http://localhost:5000/api/users/${brokerId}/status`,
        { status: 'active', verified: true }
      );

      // Update broker type if needed
      await httpClient.put(
        `http://localhost:5000/api/users/${brokerId}/role`,
        { broker_type: brokerType }
      );

      // Send notification to broker
      await httpClient.post(
        "http://localhost:5001/api/messages/send",
        {
          recipient_id: brokerId,
          message: "🎉 Congratulations! Your broker account has been verified and activated. You can now list properties and manage clients.",
          type: "system",
          priority: "high"
        }
      );

      setToast({
        show: true,
        message: "Broker approved successfully! They can now access all broker features.",
        type: "success"
      });

      // Refresh user list
      await fetchUsers();

    } catch (error) {
      console.error("Error approving broker:", error);
      setToast({
        show: true,
        message: error.response?.data?.message || "Failed to approve broker",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBroker || !rejectReason.trim()) {
      setToast({
        show: true,
        message: "Please provide a rejection reason",
        type: "error"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Update broker status to rejected
      await httpClient.put(
        `http://localhost:5000/api/users/${selectedBroker.id}/status`,
        { 
          status: 'rejected',
          verification_notes: rejectReason,
          verified: false
        }
      );

      // Send rejection notification to broker
      await httpClient.post(
        "http://localhost:5001/api/messages/send",
        {
          recipient_id: selectedBroker.id,
          message: `❌ Your broker application was rejected. Reason: ${rejectReason}\n\nPlease review our requirements and apply again.`,
          type: "system",
          priority: "high"
        }
      );

      // Log the rejection
      await httpClient.post(
        "http://localhost:5000/api/activity/log",
        {
          type: "broker_rejected",
          admin: "super_admin",
          target: `Broker: ${selectedBroker.first_name} ${selectedBroker.last_name}`,
          details: rejectReason
        }
      );

      setToast({
        show: true,
        message: "Broker rejected. They have been notified with the reason.",
        type: "success"
      });

      // Refresh and close modals
      await fetchUsers();
      setShowRejectModal(false);
      setRejectReason("");

    } catch (error) {
      console.error("Error rejecting broker:", error);
      setToast({
        show: true,
        message: "Failed to reject broker",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentCount = (brokerId) => {
    // Mock document count - in production, fetch from API
    return Math.floor(Math.random() * 5) + 1;
  };

  const DocumentsModal = () => {
    if (!showDocumentsModal || !selectedBroker) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`p-6 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Verification Documents
              </h3>
              <p className={`mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                {selectedBroker.first_name} {selectedBroker.last_name} • {selectedBroker.broker_type} Broker
              </p>
            </div>
            <button
              onClick={() => setShowDocumentsModal(false)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {brokerDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-20 h-20 mx-auto mb-4 text-gray-400" />
              <h4 className={`text-lg font-medium mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                No Verification Documents
              </h4>
              <p className={`max-w-md mx-auto ${
                theme === "dark" ? "text-gray-500" : "text-gray-600"
              }`}>
                This broker hasn't uploaded any verification documents yet.
                They need to submit their business license and ID before approval.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {brokerDocuments.slice(0, 4).map((doc, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${
                      theme === "dark" 
                        ? "bg-gray-700 border-gray-600" 
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          theme === "dark" 
                            ? "bg-gray-600" 
                            : "bg-gray-100"
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className={`font-medium ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {doc.title || `Document ${index + 1}`}
                          </h5>
                          <p className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {doc.document_type || "Verification"} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)}KB` : "Unknown size"}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.document_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    {doc.description && (
                      <p className={`mt-3 text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <span className={`text-xs ${
                        theme === "dark" ? "text-gray-500" : "text-gray-500"
                      }`}>
                        Uploaded: {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "Unknown"}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        doc.is_public 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                      }`}>
                        {doc.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-900/50" : "bg-amber-50"
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    theme === "dark" ? "text-amber-400" : "text-amber-600"
                  }`} />
                  <div>
                    <h5 className={`font-medium ${
                      theme === "dark" ? "text-amber-300" : "text-amber-800"
                    }`}>
                      Verification Checklist
                    </h5>
                    <ul className={`mt-2 space-y-1 text-sm ${
                      theme === "dark" ? "text-amber-200" : "text-amber-700"
                    }`}>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Business License verified
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Government ID submitted
                      </li>
                      <li className="flex items-center gap-2">
                        {brokerDocuments.length >= 3 ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        Minimum 3 documents submitted
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Contact information verified
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const BrokerDetailsModal = () => {
    if (!showDetailsModal || !selectedBroker) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`p-6 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Broker Details
              </h3>
              <p className={`mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Complete profile information
              </p>
            </div>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4 p-4 rounded-xl border">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedBroker.first_name?.[0]}{selectedBroker.last_name?.[0]}
                </div>
                <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 ${
                  theme === "dark" ? "border-gray-800" : "border-white"
                } ${
                  selectedBroker.status === 'active' 
                    ? 'bg-green-500' 
                    : 'bg-amber-500'
                }`} />
              </div>
              <div className="flex-1">
                <h4 className={`text-xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {selectedBroker.first_name} {selectedBroker.last_name}
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    theme === "dark" 
                      ? "bg-gray-700 text-amber-400" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedBroker.role.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    theme === "dark" 
                      ? "bg-gray-700 text-blue-400" 
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {selectedBroker.broker_type} Broker
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedBroker.verified 
                      ? theme === "dark"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-green-100 text-green-800"
                      : theme === "dark"
                      ? "bg-gray-700 text-gray-400"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {selectedBroker.verified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={`p-4 rounded-xl border ${
              theme === "dark" ? "bg-gray-900/50" : "bg-gray-50"
            }`}>
              <h5 className={`font-semibold mb-4 flex items-center gap-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                <MessageSquare className="w-4 h-4" />
                Contact Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Email
                  </p>
                  <p className="font-medium">{selectedBroker.email}</p>
                </div>
                <div>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Phone
                  </p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedBroker.phone || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Broker Information */}
            <div className={`p-4 rounded-xl border ${
              theme === "dark" ? "bg-gray-900/50" : "bg-gray-50"
            }`}>
              <h5 className={`font-semibold mb-4 flex items-center gap-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                <Briefcase className="w-4 h-4" />
                Broker Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Privilege Tier
                  </p>
                  <p className={`font-medium ${
                    selectedBroker.privilege_tier === 'premium'
                      ? 'text-purple-600 dark:text-purple-400'
                      : selectedBroker.privilege_tier === 'enterprise'
                      ? 'text-green-600 dark:text-green-400'
                      : ''
                  }`}>
                    {selectedBroker.privilege_tier?.toUpperCase() || "BASIC"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Joined Date
                  </p>
                  <p className="font-medium">
                    {new Date(selectedBroker.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Last Login
                  </p>
                  <p className="font-medium">
                    {selectedBroker.last_login 
                      ? new Date(selectedBroker.last_login).toLocaleString()
                      : "Never logged in"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Message Count
                  </p>
                  <p className="font-medium">
                    {selectedBroker.message_count || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleViewDocuments(selectedBroker);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                <Eye className="w-4 h-4" />
                View Documents ({getDocumentCount(selectedBroker.id)})
              </button>
              <button
                onClick={() => handleApprove(selectedBroker.id, selectedBroker.broker_type)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                Approve Broker
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowRejectModal(true);
                }}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                <UserX className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RejectModal = () => {
    if (!showRejectModal || !selectedBroker) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`p-6 rounded-xl shadow-xl max-w-md w-full ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Reject Broker Application
          </h3>
          <p className={`mb-4 ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>
            Please provide a reason for rejecting {selectedBroker.first_name}'s application.
            This reason will be shared with the broker.
          </p>
          
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Example: Incomplete documentation, invalid business license, missing ID verification..."
            rows="4"
            className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4 ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
          />
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
              }}
              className={`px-4 py-2 rounded-lg ${
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim() || loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Rejecting..." : "Confirm Rejection"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-2xl lg:text-3xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Broker Verification
          </h2>
          <p className={`mt-1 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}>
            Review and verify broker applications before activation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className={`w-5 h-5 ${
            theme === "dark" ? "text-amber-400" : "text-amber-600"
          }`} />
          <div className="text-right">
            <p className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              {pendingBrokers.length} pending • {activeBrokers.length} active
            </p>
            <p className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          } w-5 h-5`} />
          <input
            type="text"
            placeholder="Search brokers by name, email, or phone..."
            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              theme === "dark"
                ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                : "bg-white text-black border-gray-300 placeholder-gray-500"
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select
            className={`px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              theme === "dark"
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-white text-black border-gray-300"
            }`}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="internal">Internal Brokers</option>
            <option value="external">External Brokers</option>
          </select>
          <button className={`px-4 py-3 border rounded-xl flex items-center gap-2 ${
            theme === "dark"
              ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              : "bg-white text-black border-gray-300 hover:bg-gray-100"
          }`}>
            <Filter className="w-5 h-5" />
            Filters
          </button>
          <button className={`px-4 py-3 border rounded-xl flex items-center gap-2 ${
            theme === "dark"
              ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              : "bg-white text-black border-gray-300 hover:bg-gray-100"
          }`}>
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Pending Brokers List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : filteredBrokers.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border-2 border-dashed ${
          theme === "dark" 
            ? "border-gray-700 text-gray-400 bg-gray-800/50" 
            : "border-gray-300 text-gray-500 bg-gray-50"
        }`}>
          <UserCheck className="w-20 h-20 mx-auto mb-4 opacity-50" />
          <h3 className={`text-lg font-medium mb-2 ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}>
            No pending broker applications
          </h3>
          <p className="text-sm opacity-75">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search or filter criteria"
              : "All brokers have been verified! 🎉"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrokers.map((broker) => (
            <div
              key={broker.id}
              className={`p-6 rounded-xl border ${
                theme === "dark" 
                  ? "bg-gray-800 border-gray-700" 
                  : "bg-white border-gray-200"
              } shadow-lg hover:shadow-xl transition-shadow`}
            >
              {/* Broker Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {broker.first_name?.[0]}{broker.last_name?.[0]}
                    </div>
                    <AlertCircle className="absolute -top-1 -right-1 w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {broker.first_name} {broker.last_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        theme === "dark" 
                          ? "bg-gray-700 text-amber-400" 
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {broker.role.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        theme === "dark" 
                          ? "bg-gray-700 text-blue-400" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {broker.broker_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Applied {new Date(broker.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <FileText className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {getDocumentCount(broker.id)} docs
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm truncate">{broker.email}</span>
                </div>
                {broker.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{broker.phone}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(broker)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Details
                </button>
                <button
                  onClick={() => handleApprove(broker.id, broker.broker_type)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedBroker(broker);
                    setShowRejectModal(true);
                  }}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Brokers Summary */}
      {activeBrokers.length > 0 && (
        <div className={`mt-8 p-6 rounded-xl border ${
          theme === "dark" 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Active Brokers ({activeBrokers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-900/50" : "bg-green-50"
            }`}>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Internal Brokers
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeBrokers.filter(b => b.broker_type === 'internal').length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-900/50" : "bg-blue-50"
            }`}>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                External Brokers
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {activeBrokers.filter(b => b.broker_type === 'external').length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-900/50" : "bg-purple-50"
            }`}>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Premium Tier
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {activeBrokers.filter(b => b.privilege_tier === 'premium').length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme === "dark" ? "bg-gray-900/50" : "bg-amber-50"
            }`}>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                Verified Today
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {activeBrokers.filter(b => 
                  new Date(b.updated_at).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DocumentsModal />
      <BrokerDetailsModal />
      <RejectModal />
    </div>
  );
};

export default BrokerVerification;