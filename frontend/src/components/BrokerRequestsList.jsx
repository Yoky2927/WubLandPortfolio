// components/BrokerRequestsList.jsx
import React, { useState, useEffect } from 'react';
import {
  Home,
  User,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  MessageCircle,
  Eye,
  Clock,
  Filter
} from 'lucide-react';

const BrokerRequestsList = ({ theme, onAcceptRequest, onRejectRequest, onMessageClient }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Fetch from your property-requests service
      const response = await fetch('http://localhost:5000/api/property-requests/broker');
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'pending') return request.status === 'pending';
    if (filter === 'assigned') return request.status === 'assigned';
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className={`p-4 lg:p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Property Requests</h2>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Review and accept property requests from sellers & landlords
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 border rounded-lg ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned to Me</option>
          </select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No property requests available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(request => (
            <div
              key={request.id}
              className={`p-4 rounded-xl border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      request.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      request.status === 'assigned' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status === 'pending' ? 'Awaiting Response' : 'Assigned'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {request.userType === 'seller' ? 'Selling Request' : 'Rental Request'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{request.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{request.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>{request.price} ETB</span>
                    </div>
                  </div>
                  
                  {request.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {request.description.substring(0, 100)}...
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onAcceptRequest(request.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => onMessageClient(request.clientId)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrokerRequestsList;