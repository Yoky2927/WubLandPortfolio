import React, { useState, useEffect } from "react";
import { Calendar, Clock, User, CheckCircle, X, MapPin, Home, MessageCircle, Phone, Mail, Users, FileText } from "lucide-react";

const ViewingScheduleModal = ({ 
  isOpen, 
  onClose, 
  property, 
  viewingRequests = [], 
  theme,
  onApproveViewing,
  onRejectViewing,
  onScheduleViewing,
  userType 
}) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [scheduleNotes, setScheduleNotes] = useState("");

  // Generate available time slots for the next 7 days
  useEffect(() => {
    if (isOpen) {
      const slots = [];
      const today = new Date();
      
      // Generate slots for next 7 days
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const timeSlots = ['09:00', '11:00', '14:00', '16:00'];
        
        timeSlots.forEach(time => {
          slots.push({
            id: `slot-${i}-${time}`,
            date: date.toISOString().split('T')[0],
            displayDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: time,
            displayTime: time,
            available: Math.random() > 0.3 // 70% chance of being available
          });
        });
      }
      
      setAvailableSlots(slots);
    }
  }, [isOpen]);

  const getRequestStatus = (status) => {
    switch(status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', text: 'Pending' };
      case 'approved': return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', text: 'Approved' };
      case 'rejected': return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', text: 'Rejected' };
      case 'scheduled': return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', text: 'Scheduled' };
      default: return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', text: 'Unknown' };
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleScheduleConfirm = () => {
    if (!selectedRequest || !selectedSlot) return;

    const viewingData = {
      requestId: selectedRequest.id,
      date: selectedSlot.date,
      time: selectedSlot.time,
      notes: scheduleNotes,
      propertyId: property?.id,
      userId: selectedRequest.userId,
      userName: selectedRequest.userName
    };

    onScheduleViewing(viewingData);
    setSelectedRequest(null);
    setSelectedSlot(null);
    setScheduleNotes("");
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme === "dark" ? "bg-black/70" : "bg-black/50"}`}>
      <div className={`relative w-full max-w-6xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden ${theme === "dark"
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-amber-500/30"
        : "bg-gradient-to-br from-white via-amber-50 to-white border border-amber-200"
        }`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  Viewing Requests & Schedule
                </h2>
                <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Manage property viewings with potential {userType === 'seller' ? 'buyers' : 'renters'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Viewing Requests */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Viewing Requests ({viewingRequests.length})
              </h3>
              
              {viewingRequests.length === 0 ? (
                <div className={`text-center py-12 rounded-xl ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    No viewing requests yet
                  </p>
                  <p className={`text-sm mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Potential {userType === 'seller' ? 'buyers' : 'renters'} will appear here when they request viewings
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {viewingRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                        selectedRequest?.id === request.id
                          ? theme === "dark"
                            ? "bg-amber-900/20 border border-amber-500/30"
                            : "bg-amber-50 border border-amber-200"
                          : theme === "dark"
                            ? "bg-gray-800/50 hover:bg-gray-700/50"
                            : "bg-white hover:bg-gray-50"
                      } border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {request.userImage ? (
                              <img src={request.userImage} alt={request.userName} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                theme === "dark" ? "bg-amber-900/30" : "bg-amber-100"
                              }`}>
                                <User className={`w-6 h-6 ${theme === "dark" ? "text-amber-300" : "text-amber-600"}`} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold">{request.userName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {userType === 'seller' ? 'Interested Buyer' : 'Prospective Renter'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRequestStatus(request.status).color}`}>
                          {getRequestStatus(request.status).text}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Requested: {request.requestedDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-gray-400" />
                          <span className="italic">"{request.message}"</span>
                        </div>
                        
                        {request.preferredTimes && (
                          <div className="mt-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                            <p className="font-medium mb-1">Preferred Times:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.preferredTimes.map((time, idx) => (
                                <span key={idx} className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs">
                                  {time}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {request.status === 'pending' && selectedRequest?.id !== request.id && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onApproveViewing(request.id);
                            }}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRejectViewing(request.id);
                            }}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Schedule Details */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              {selectedRequest ? (
                <>
                  <h3 className={`text-lg font-semibold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Schedule Viewing for {selectedRequest.userName}
                  </h3>

                  {/* User Details */}
                  <div className={`p-4 rounded-xl mb-6 ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                    <h4 className={`font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      User Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedRequest.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedRequest.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedRequest.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedRequest.verificationStatus || 'Not verified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  <div className="mb-6">
                    <h4 className={`font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      Select Available Time Slot
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot)}
                          disabled={!slot.available}
                          className={`p-3 rounded-xl text-center transition-all duration-300 ${
                            selectedSlot?.id === slot.id
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                              : slot.available
                                ? theme === "dark"
                                  ? "bg-gray-800 hover:bg-gray-700"
                                  : "bg-white hover:bg-gray-50 border border-gray-200"
                                : theme === "dark"
                                  ? "bg-gray-800/30 opacity-50 cursor-not-allowed"
                                  : "bg-gray-100 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="font-medium">{slot.displayDate}</div>
                          <div className="text-sm">{slot.displayTime}</div>
                          {!slot.available && (
                            <div className="text-xs mt-1">Booked</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Notes */}
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={scheduleNotes}
                      onChange={(e) => setScheduleNotes(e.target.value)}
                      placeholder="Any special instructions for the viewing..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleScheduleConfirm}
                      disabled={!selectedSlot}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Schedule Viewing
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setSelectedSlot(null);
                        setScheduleNotes("");
                      }}
                      className="flex-1 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold py-3 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                  <h3 className={`text-xl font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Select a Viewing Request
                  </h3>
                  <p className={`text-gray-500 dark:text-gray-400 max-w-md mx-auto`}>
                    Click on a viewing request from the left panel to schedule a property viewing.
                    You can view potential {userType === 'seller' ? 'buyers' : 'renters'} profiles and select suitable time slots.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme === "dark" ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Pending</span>
              </div>
              <div className="flex gap-1 ml-4">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs">Approved</span>
              </div>
              <div className="flex gap-1 ml-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs">Rejected</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {viewingRequests.filter(r => r.status === 'scheduled').length} viewings scheduled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewingScheduleModal;