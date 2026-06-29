// components/RequestActions.jsx
import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  MessageCircle,
  Eye,
  Zap,
  AlertCircle,
  Clock,
  Calendar,
  Shield,
  ChevronRight,
  ExternalLink,
  FileText,
  Building
} from 'lucide-react';

// Import the chat modal
import BrokerChatModal from './BrokerChatInterface';

const RequestActions = ({
  request,
  theme,
  canAccessTools,
  isInternal,
  onAcceptRequest,
  onRejectRequest,
  onMessageClient,
  onViewDetails,
  onStartProfessionalTools,
  setToast
}) => {
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Get current user from your auth context
  const currentUser = {
    id: 1, // Replace with actual user ID
    first_name: "Broker",
    last_name: "User",
    email: "broker@example.com"
  };

  // Prepare client data
  const otherUser = {
    id: request.client_id || 2,
    name: request.client_name || "Client",
    email: request.client_email || "client@example.com",
    phone: request.client_phone || "",
    role: "client"
  };

  const handleAction = async (action, callback) => {
    try {
      setLoading(true);
      await callback();
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      if (setToast) {
        setToast({
          show: true,
          message: `Failed to ${action}: ${error.message}`,
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = () => {
    setShowChat(true);
    // Call parent handler if exists
    if (onMessageClient) {
      onMessageClient(request.client_id, request.id);
    }
  };

  const getActionButtons = () => {
    const status = request.status?.toLowerCase();
    
    switch (status) {
      case 'pending':
        return (
          <>
            <button
              onClick={() => handleAction('accept', () => onAcceptRequest?.(request.id))}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              Accept Request
            </button>
            
            <button
              onClick={() => handleAction('reject', () => onRejectRequest?.(request.id))}
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
          </>
        );

      case 'assigned':
        return (
          <>
            {canAccessTools || isInternal ? (
              <button
                onClick={() => handleAction('start tools', () => onStartProfessionalTools?.(request))}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5" />
                Start Professional Tools
              </button>
            ) : (
              <div className={`p-4 rounded-xl border ${theme === "dark" ? "bg-amber-900/10 border-amber-800/30" : "bg-amber-50 border-amber-200"}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${theme === "dark" ? "text-amber-400" : "text-amber-700"}`}>
                      Upgrade Required
                    </p>
                    <p className={`text-xs mt-1 ${theme === "dark" ? "text-amber-500/80" : "text-amber-600"}`}>
                      Upgrade to access professional tools
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        );

      default:
        return (
          <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-gray-700/30" : "bg-gray-50"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Request {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Processed'}
            </p>
            <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
              This request has been processed
            </p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Chat Modal */}
      <BrokerChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentUser={currentUser}
        otherUser={otherUser}
        userType="broker"
        property={request.property_data || null}
        conversationType="property"
      />

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Primary Actions */}
        <div className="space-y-3">
          {getActionButtons()}
        </div>
        
        {/* Secondary Actions */}
        <div className="space-y-2">
          {request.client_id && (
            <button
              onClick={handleMessageClick}
              className={`w-full px-4 py-2.5 rounded-xl border flex items-center justify-between group transition-all ${
                theme === "dark"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                  : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">Message Client</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          
          <button
            onClick={() => onViewDetails?.(request)}
            className={`w-full px-4 py-2.5 rounded-xl border flex items-center justify-between group transition-all ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-medium">View Details</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        
        {/* Status Info */}
        {request.schedule_date && (
          <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-purple-900/10 border-purple-800/30" : "bg-purple-50 border-purple-200"} border`}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <p className={`text-sm font-medium ${theme === "dark" ? "text-purple-400" : "text-purple-700"}`}>
                Viewing Scheduled
              </p>
            </div>
            <div className="space-y-1">
              <p className={`text-xs ${theme === "dark" ? "text-purple-300" : "text-purple-600"}`}>
                {new Date(request.schedule_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              {request.schedule_time && (
                <p className={`text-xs ${theme === "dark" ? "text-purple-300/80" : "text-purple-600"}`}>
                  {request.schedule_time}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Workflow Progress */}
        {request.current_step && (
          <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700/30" : "bg-gray-50"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Workflow Step
              </span>
              <span className={`text-xs font-bold ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
                {request.current_step}/6
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(request.current_step / 6) * 100}%` }}
              ></div>
            </div>
            <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
              {request.current_step === 1 && 'Request Submitted'}
              {request.current_step === 2 && 'Broker Assigned'}
              {request.current_step === 3 && 'Draft Created'}
              {request.current_step === 4 && 'Client Review'}
              {request.current_step === 5 && 'Admin Approval'}
              {request.current_step === 6 && 'Live on Marketplace'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default RequestActions;