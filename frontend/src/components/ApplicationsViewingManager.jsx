import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, CheckCircle, X, Clock, MapPin, 
  User, MessageSquare, Star, Phone, Mail, FileText,
  ChevronRight, ShieldCheck, Eye, AlertCircle, Check,
  ArrowRight, Filter, Search, Calendar as CalendarIcon,
  Home, Building, DollarSign, MessageCircle
} from "lucide-react";
import { apiCall } from "../utils/api.endpoints";
import { toast } from "react-hot-toast";
import BookingCalendar from "./BookingCalendar";

const ApplicationsViewingManager = ({ 
  property, 
  userType, 
  theme, 
  brokerId,
  propertyRequestId 
}) => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [viewings, setViewings] = useState([]);
  const [selectedViewing, setSelectedViewing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("applications"); // "applications" or "calendar"
  const [filterStatus, setFilterStatus] = useState("all");
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    duration: "30",
    meeting_type: "in_person",
    notes: "",
    application_id: null
  });

  // Fetch applications for this property
  useEffect(() => {
    fetchApplications();
    fetchViewings();
  }, [propertyRequestId]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('GET_PROPERTY_APPLICATIONS', { id: propertyRequestId });
      
      if (response.success && Array.isArray(response.applications)) {
        setApplications(response.applications);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchViewings = async () => {
    try {
      const response = await apiCall('GET_PROPERTY_VIEWINGS', { id: propertyRequestId });
      
      if (response.success && Array.isArray(response.viewings)) {
        setViewings(response.viewings.map(v => ({
          ...v,
          scheduled_date: v.scheduled_date || v.date,
          start_time: v.start_time || v.time,
          property_title: property?.title || "Property",
          status: v.status || "scheduled"
        })));
      }
    } catch (error) {
      console.error("Error fetching viewings:", error);
    }
  };

  const handleApplicationAction = async (applicationId, action, notes = "") => {
    try {
      setIsLoading(true);
      
      const response = await apiCall('UPDATE_APPLICATION_STATUS', 
        { id: applicationId }, 
        { 
          data: { 
            status: action,
            notes: notes 
          } 
        }
      );

      if (response.success) {
        toast.success(`Application ${action} successfully`);
        fetchApplications();
        
        if (action === "approved") {
          setSelectedApplication(applications.find(app => app.id === applicationId));
          setScheduleData(prev => ({ ...prev, application_id: applicationId }));
          setShowScheduleForm(true);
        }
      }
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleViewing = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiCall('CREATE_VIEWING_APPOINTMENT', {}, {
        data: {
          property_request_id: propertyRequestId,
          application_id: scheduleData.application_id,
          broker_id: brokerId,
          date: scheduleData.date,
          time: scheduleData.time,
          duration: scheduleData.duration,
          meeting_type: scheduleData.meeting_type,
          notes: scheduleData.notes,
          status: "scheduled"
        }
      });

      if (response.success) {
        toast.success("Viewing scheduled successfully!");
        setShowScheduleForm(false);
        setScheduleData({
          date: "",
          time: "",
          duration: "30",
          meeting_type: "in_person",
          notes: "",
          application_id: null
        });
        fetchViewings();
      }
    } catch (error) {
      console.error("Error scheduling viewing:", error);
      toast.error("Failed to schedule viewing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateViewingStatus = async (viewingId, status) => {
    try {
      const response = await apiCall('UPDATE_VIEWING_STATUS', 
        { id: viewingId }, 
        { data: { status } }
      );

      if (response.success) {
        toast.success(`Viewing ${status}`);
        fetchViewings();
      }
    } catch (error) {
      console.error("Error updating viewing:", error);
      toast.error("Failed to update viewing");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", icon: X },
      scheduled: { color: "bg-green-100 text-green-800", icon: CalendarIcon },
      completed: { color: "bg-purple-100 text-purple-800", icon: Check },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: X }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === "all") return true;
    return app.status === filterStatus;
  });

  const getApplicationCard = (application) => (
    <div key={application.id} className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${
      theme === "dark" 
        ? "bg-gray-800/50 border-gray-700 hover:border-amber-400" 
        : "bg-white border-gray-200 hover:border-amber-400"
    }`}
    onClick={() => setSelectedApplication(application)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-lg">{application.applicant_name}</h4>
            <p className="text-sm text-gray-500">{application.email}</p>
          </div>
        </div>
        {getStatusBadge(application.status)}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Application Type:</span>
          <span className="font-medium">{application.application_type === "sale" ? "Purchase" : "Rental"}</span>
        </div>
        
        {application.offered_amount && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Offer:</span>
            <span className="font-bold text-amber-600">ETB {application.offered_amount.toLocaleString()}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Submitted:</span>
          <span>{new Date(application.submitted_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {application.message}
        </p>
      </div>
    </div>
  );

  const getApplicationDetails = () => (
    <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="text-xl font-bold">Application Details</h3>
            <p className="text-gray-500">Review applicant information</p>
          </div>
        </div>
        <button
          onClick={() => setSelectedApplication(null)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {selectedApplication && (
        <div className="space-y-6">
          {/* Applicant Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Applicant Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span>{selectedApplication.applicant_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{selectedApplication.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{selectedApplication.phone || "Not provided"}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Application Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{selectedApplication.application_type === "sale" ? "Purchase" : "Rental"}</span>
                </div>
                {selectedApplication.offered_amount && (
                  <div className="flex justify-between">
                    <span>Offer:</span>
                    <span className="font-bold text-amber-600">ETB {selectedApplication.offered_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedApplication.preferred_move_in_date && (
                  <div className="flex justify-between">
                    <span>Move-in Date:</span>
                    <span>{new Date(selectedApplication.preferred_move_in_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status:</span>
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <h4 className="font-semibold mb-3">Applicant's Message</h4>
            <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
              <p>{selectedApplication.message}</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
              <p className="text-sm text-gray-500">Additional Occupants</p>
              <p className="text-lg font-bold">{selectedApplication.additional_occupants || 0}</p>
            </div>
            <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
              <p className="text-sm text-gray-500">Pets</p>
              <p className="text-lg font-bold">{selectedApplication.has_pets ? "Yes" : "No"}</p>
            </div>
            <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
              <p className="text-sm text-gray-500">Financing</p>
              <p className="text-lg font-bold">{selectedApplication.financing_preference || "Not specified"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            {selectedApplication.status === "pending" && (
              <>
                <button
                  onClick={() => handleApplicationAction(selectedApplication.id, "rejected", "Application rejected by property owner")}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => handleApplicationAction(selectedApplication.id, "approved", "Application approved for viewing")}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Approve for Viewing
                </button>
              </>
            )}
            {selectedApplication.status === "approved" && !selectedApplication.viewing_scheduled && (
              <button
                onClick={() => {
                  setScheduleData(prev => ({ ...prev, application_id: selectedApplication.id }));
                  setShowScheduleForm(true);
                }}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Schedule Viewing
              </button>
            )}
            {selectedApplication.viewing_scheduled && (
              <button
                onClick={() => {
                  const viewing = viewings.find(v => v.application_id === selectedApplication.id);
                  if (viewing) setSelectedViewing(viewing);
                }}
                className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                View Scheduled Viewing
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode("applications")}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
              viewMode === "applications"
                ? "bg-amber-500 text-white"
                : theme === "dark"
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Users className="w-5 h-5" />
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
              viewMode === "calendar"
                ? "bg-amber-500 text-white"
                : theme === "dark"
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            Viewing Calendar ({viewings.length})
          </button>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "applications" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {filteredApplications.length > 0 ? (
                filteredApplications.map(getApplicationCard)
              ) : (
                <div className={`p-8 text-center rounded-xl ${
                  theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"
                }`}>
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                  <p className="text-gray-500">Applications from potential buyers/renters will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Application Details */}
          <div className="lg:col-span-1">
            {selectedApplication ? (
              getApplicationDetails()
            ) : (
              <div className={`p-6 rounded-xl border ${
                theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select an Application</h3>
                  <p className="text-gray-500">Click on an application to view details and take action</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <BookingCalendar 
              bookings={viewings}
              theme={theme}
              onBookingClick={setSelectedViewing}
            />
          </div>

          {/* Viewing Details */}
          <div className="lg:col-span-1">
            {selectedViewing ? (
              <div className={`p-6 rounded-xl border ${
                theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="text-xl font-bold">Viewing Details</h3>
                      <p className="text-gray-500">Scheduled appointment</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedViewing(null)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p>{new Date(selectedViewing.scheduled_date).toLocaleDateString()} at {selectedViewing.start_time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Applicant</p>
                      <p>{selectedViewing.applicant_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p>{selectedViewing.duration || 30} minutes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Meeting Type</p>
                      <p className="capitalize">{selectedViewing.meeting_type?.replace("_", " ")}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Status</p>
                    {getStatusBadge(selectedViewing.status)}
                  </div>

                  {selectedViewing.notes && (
                    <div>
                      <p className="font-medium mb-2">Notes</p>
                      <p className={`p-3 rounded-lg ${
                        theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                      }`}>
                        {selectedViewing.notes}
                      </p>
                    </div>
                  )}

                  {/* Viewing Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {selectedViewing.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => handleUpdateViewingStatus(selectedViewing.id, "cancelled")}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateViewingStatus(selectedViewing.id, "completed")}
                          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                        >
                          Mark Completed
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-6 rounded-xl border ${
                theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Viewing</h3>
                  <p className="text-gray-500">Click on a calendar event to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Viewing Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl p-6 ${
            theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="text-xl font-bold">Schedule Viewing</h3>
                  <p className="text-gray-500">Set up a property viewing with the applicant</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleForm(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={scheduleData.date}
                    onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <select
                    value={scheduleData.time}
                    onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                  >
                    <option value="">Select Time</option>
                    {["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"].map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <select
                    value={scheduleData.duration}
                    onChange={(e) => setScheduleData({...scheduleData, duration: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Meeting Type</label>
                  <select
                    value={scheduleData.meeting_type}
                    onChange={(e) => setScheduleData({...scheduleData, meeting_type: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                  >
                    <option value="in_person">In Person</option>
                    <option value="virtual">Virtual Tour</option>
                    <option value="video_call">Video Call</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({...scheduleData, notes: e.target.value})}
                  placeholder="Any specific instructions or meeting details..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowScheduleForm(false)}
                  className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleViewing}
                  disabled={!scheduleData.date || !scheduleData.time || isLoading}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Scheduling..." : "Schedule Viewing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsViewingManager;