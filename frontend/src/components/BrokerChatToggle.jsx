import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, X, Users, Sparkles, Loader as LoaderIcon, 
  CheckCircle, Clock, AlertCircle 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import BrokerChatWindow from './BrokerChatWindow';

const BrokerChatToggle = ({ 
  theme, 
  brokerId, 
  onToggle, 
  brokerName, 
  brokerProfile,
  unreadCount = 0,
  isChatOpen = false,
  onOpenChat,
  brokerStatus = 'online'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const [isClickRinging, setIsClickRinging] = useState(false);
  const [brokerData, setBrokerData] = useState(null);
  const chatRef = useRef(null);
  const { theme: contextTheme } = useTheme();
  const currentTheme = theme || contextTheme || 'light';
  const isDark = currentTheme === 'dark';

  // Fetch broker data if only ID is provided
  useEffect(() => {
    if (brokerId && !brokerData) {
      fetchBrokerData();
    }
  }, [brokerId]);

  // Trigger ring effect for new messages
  useEffect(() => {
    if (unreadCount > 0 && unreadCount > previousUnreadCount && !isChatVisible) {
      setHasNewMessages(true);
      triggerRingEffect();
      
      // Show subtle notification for new messages
      if (unreadCount === 1) {
        console.log(`New message from ${brokerData?.name || brokerName || 'broker'}`);
      } else if (unreadCount > 1) {
        console.log(`${unreadCount} new messages from ${brokerData?.name || brokerName || 'broker'}`);
      }
    }
    
    setPreviousUnreadCount(unreadCount);
    
    if (unreadCount === 0) {
      setHasNewMessages(false);
    }
  }, [unreadCount, isChatVisible, brokerData, brokerName]);

  const fetchBrokerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/brokers/${brokerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBrokerData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching broker data:', error);
    }
  };

  // Trigger ring effect with growing circles
  const triggerRingEffect = () => {
    setIsRinging(true);
    setTimeout(() => {
      setIsRinging(false);
    }, 1500);
  };

  // Handle chat toggle click
  const handleChatClick = () => {
    setIsClickRinging(true);
    setTimeout(() => setIsClickRinging(false), 600);

    if (isRinging) {
      setIsRinging(false);
    }

    setHasNewMessages(false);
    
    // Toggle chat visibility
    setIsChatVisible(!isChatVisible);
    
    if (onToggle) {
      onToggle();
    }
    
    if (onOpenChat && !isChatVisible) {
      onOpenChat();
    }

    if (chatRef.current) {
      chatRef.current.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.style.transform = 'scale(1)';
        }
      }, 150);
    }
  };

  // Status indicator color
  const getStatusColor = () => {
    switch (brokerStatus) {
      case 'online':
        return 'bg-emerald-500';
      case 'away':
        return 'bg-amber-500';
      case 'busy':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-emerald-500';
    }
  };

  // Status text
  const getStatusText = () => {
    switch (brokerStatus) {
      case 'online':
        return 'Online now';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      default:
        return 'Available';
    }
  };

  // Get broker info to display
  const displayBrokerName = brokerData?.name || brokerName || 'Broker';
  const displayBrokerProfile = brokerData?.profile_picture || brokerProfile;
  const displayStatus = brokerData?.status || brokerStatus;

  return (
    <div className="relative">
      {/* Chat Toggle Button - Positioned on LEFT side */}
      <button
        ref={chatRef}
        onClick={handleChatClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 fixed bottom-24 left-6 z-50 ${
          isRinging ? 'animate-bellRing' : ''
        } ${
          hasNewMessages && unreadCount > 0 ? 'animate-strongPulse' : ''
        } ${
          isDark
            ? 'bg-gradient-to-br from-amber-600 to-amber-700'
            : 'bg-gradient-to-br from-amber-500 to-amber-600'
        } hover:scale-110 active:scale-95 shadow-2xl group`}
        aria-label={`Chat with ${displayBrokerName} ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <div className="relative w-8 h-8">
          {displayBrokerProfile ? (
            <div className="relative">
              <img 
                src={displayBrokerProfile} 
                alt={displayBrokerName}
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
              />
              {/* Online status indicator */}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor()}`}></div>
            </div>
          ) : (
            <MessageCircle className="w-8 h-8 text-white" />
          )}

          {/* Growing circles for unread messages */}
          {hasNewMessages && unreadCount > 0 && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-amber-400 animate-ping opacity-90"></div>
              <div className="absolute inset-0 rounded-full border-4 border-amber-300 animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping" style={{ animationDelay: '0.4s' }}></div>
              {/* Additional expanding circles */}
              <div className="absolute -inset-3 rounded-full border-2 border-amber-500/40 animate-expandRing"></div>
              <div className="absolute -inset-4 rounded-full border-2 border-amber-400/30 animate-expandRing" style={{ animationDelay: '0.1s' }}></div>
              <div className="absolute -inset-5 rounded-full border-2 border-yellow-300/20 animate-expandRing" style={{ animationDelay: '0.2s' }}></div>
            </>
          )}

          {isClickRinging && (
            <>
              <div className="absolute -inset-2 rounded-full border-2 border-white/80 animate-clickRing"></div>
              <div className="absolute -inset-3 rounded-full border-2 border-amber-300/60 animate-clickRing" style={{ animationDelay: '0.1s' }}></div>
            </>
          )}

          {/* Unread message badge */}
          {unreadCount > 0 && (
            <span
              className={`absolute -top-2 -right-2 w-7 h-7 text-white text-xs rounded-full flex items-center justify-center border-2 ${
                isDark ? 'border-gray-900' : 'border-white'
              } font-bold ${
                hasNewMessages ? 'animate-badgePulse' : 'shadow-lg'
              }`}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        
        {/* Tooltip on hover */}
        {isHovered && (
          <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg whitespace-nowrap z-50 ${
            isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-medium">{displayBrokerName}</span>
              {displayStatus && (
                <div className="flex items-center gap-1 ml-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                  <span className="text-xs opacity-80">{getStatusText()}</span>
                </div>
              )}
            </div>
            {brokerData?.experience_years && (
              <div className="text-xs mt-1 opacity-80">
                {brokerData.experience_years} years experience
              </div>
            )}
            {unreadCount > 0 && (
              <div className="text-xs mt-1 text-center opacity-90">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </button>

      {/* Mini status indicator when not hovering */}
      {!isHovered && displayBrokerProfile && (
        <div className="fixed bottom-32 left-11 z-40">
          <div className={`w-3 h-3 rounded-full border-2 ${isDark ? 'border-gray-900' : 'border-white'} ${getStatusColor()}`}></div>
        </div>
      )}

      {/* Chat Window Popup */}
      {isChatVisible && (
        <BrokerChatWindow
          brokerId={brokerId}
          onClose={() => setIsChatVisible(false)}
          theme={currentTheme}
          isOpen={isChatVisible}
          isMaximized={isChatMaximized}
          onToggleMaximize={() => setIsChatMaximized(!isChatMaximized)}
        />
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes bellRing {
          0% { transform: rotate(0deg) scale(1); }
          15% { transform: rotate(-25deg) scale(1.15); }
          30% { transform: rotate(20deg) scale(1.15); }
          45% { transform: rotate(-15deg) scale(1.1); }
          60% { transform: rotate(10deg) scale(1.05); }
          75% { transform: rotate(-5deg) scale(1.02); }
          90% { transform: rotate(3deg) scale(1.01); }
          100% { transform: rotate(0deg) scale(1); }
        }
        
        @keyframes strongPulse {
          0% { 
            box-shadow: 
              0 0 0 0 rgba(245, 158, 11, 0.9),
              0 0 0 0 rgba(251, 191, 36, 0.7),
              0 15px 35px -8px rgba(245, 158, 11, 0.6),
              0 25px 50px -15px rgba(245, 158, 11, 0.4),
              0 0 50px 20px rgba(245, 158, 11, 0.2) inset;
          }
          70% { 
            box-shadow: 
              0 0 0 25px rgba(245, 158, 11, 0),
              0 0 0 50px rgba(251, 191, 36, 0),
              0 20px 45px -10px rgba(245, 158, 11, 0.8),
              0 30px 60px -20px rgba(245, 158, 11, 0.6),
              0 0 60px 25px rgba(245, 158, 11, 0.3) inset;
          }
          100% { 
            box-shadow: 
              0 0 0 0 rgba(245, 158, 11, 0),
              0 0 0 0 rgba(251, 191, 36, 0),
              0 15px 35px -8px rgba(245, 158, 11, 0.6),
              0 25px 50px -15px rgba(245, 158, 11, 0.4),
              0 0 50px 20px rgba(245, 158, 11, 0.2) inset;
          }
        }
        
        @keyframes badgePulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 
              0 0 0 0 rgba(217, 119, 6, 0.8),
              0 6px 12px -2px rgba(217, 119, 6, 0.5),
              0 0 20px 5px rgba(217, 119, 6, 0.3);
          }
          50% { 
            transform: scale(1.25);
            box-shadow: 
              0 0 0 12px rgba(217, 119, 6, 0),
              0 8px 16px -4px rgba(217, 119, 6, 0.7),
              0 0 30px 10px rgba(217, 119, 6, 0.4);
          }
        }
        
        @keyframes clickRing {
          0% { 
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% { 
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes expandRing {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
            border-width: 2px;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
            border-width: 1px;
          }
        }
        
        .animate-bellRing {
          animation: bellRing 0.8s ease-in-out;
        }
        
        .animate-strongPulse {
          animation: strongPulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
        
        .animate-badgePulse {
          animation: badgePulse 1.5s infinite ease-in-out;
        }
        
        .animate-clickRing {
          animation: clickRing 0.6s ease-out forwards;
        }
        
        .animate-expandRing {
          animation: expandRing 2s infinite ease-out;
        }
      `}</style>
    </div>
  );
};

export default BrokerChatToggle;