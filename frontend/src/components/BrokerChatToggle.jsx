import React, { useState } from "react";
import { MessageCircle, X, Users } from "lucide-react";

const BrokerChatToggle = ({ 
  theme, 
  onToggle, 
  brokerName, 
  brokerProfile,
  unreadCount = 0 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Badge for unread messages */}
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
          {unreadCount}
        </div>
      )}
      
      <button
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 ${
          theme === "dark" 
            ? "bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900" 
            : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
        } flex items-center justify-center text-white`}
      >
        {brokerProfile ? (
          <img 
            src={brokerProfile} 
            alt={brokerName}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
        ) : (
          <MessageCircle className="w-8 h-8" />
        )}
        
        {/* Tooltip on hover */}
        {isHovered && (
          <div className={`absolute -top-12 right-0 px-4 py-2 rounded-lg shadow-lg whitespace-nowrap ${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          }`}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-medium">{brokerName || "Chat with Broker"}</span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default BrokerChatToggle;