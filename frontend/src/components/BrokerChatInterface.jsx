import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api.endpoints';
import { MessageCircle, X, Send, Paperclip, ImageIcon, File, User, Users, CheckCircle, Clock, ChevronLeft, Search, ArrowRight, Building, Phone, Video, Mic, Smile, FileText, Home, DollarSign, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BrokerChatModal = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  otherUser, 
  userType, // 'buyer', 'seller', 'renter', 'leaser', 'broker'
  property = null,
  conversationType = 'direct' // 'direct', 'property', 'verification', 'listing'
}) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Determine user roles
  const isCurrentUserBroker = userType === 'broker';
  const isOtherUserBroker = otherUser?.role?.includes('broker');
  const isPropertyChat = conversationType === 'property';
  const isVerificationChat = conversationType === 'verification';
  const isListingChat = conversationType === 'listing';

  useEffect(() => {
    if (isOpen && otherUser) {
      loadChatHistory();
      setupTypingIndicator();
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isOpen, otherUser]);

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('GET_CONVERSATION_HISTORY', {
        userId: currentUser.id,
        otherUserId: otherUser.id,
        conversationType
      });
      
      if (response.success) {
        setMessages(response.data?.messages || []);
      } else {
        // Load sample messages based on conversation type
        loadSampleMessages();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      loadSampleMessages();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleMessages = () => {
    let sampleMessages = [];
    
    if (isPropertyChat && property) {
      sampleMessages = [
        {
          id: 1,
          text: `Hello! I'm ${otherUser.name}, your broker for ${property.title}. How can I help you with this property?`,
          senderId: otherUser.id,
          senderName: otherUser.name,
          senderType: 'broker',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        },
        {
          id: 2,
          text: 'I would like to schedule a viewing for this weekend if possible.',
          senderId: currentUser.id,
          senderName: currentUser.first_name,
          senderType: userType,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          read: true
        }
      ];
    } else if (isVerificationChat) {
      sampleMessages = [
        {
          id: 1,
          text: `Hello ${currentUser.first_name}! I'm ${otherUser.name}, your assigned broker for property verification. Let's schedule a time for the inspection.`,
          senderId: otherUser.id,
          senderName: otherUser.name,
          senderType: 'broker',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        }
      ];
    } else if (isListingChat) {
      sampleMessages = [
        {
          id: 1,
          text: `Hi ${currentUser.first_name}! I've prepared the listing proposal for your property. Let me know if you have any questions or changes.`,
          senderId: otherUser.id,
          senderName: otherUser.name,
          senderType: 'broker',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        }
      ];
    } else {
      sampleMessages = [
        {
          id: 1,
          text: `Hello! I'm ${otherUser.name}. How can I help you today?`,
          senderId: otherUser.id,
          senderName: otherUser.name,
          senderType: otherUser.role || 'broker',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        }
      ];
    }
    
    setMessages(sampleMessages);
  };

  const setupTypingIndicator = () => {
    // Simulate typing indicator for demo
    if (Math.random() > 0.5) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleTyping = () => {
    setNewMessage(e.target.value);
    // Send typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    // Here you would send typing status to server
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    const tempId = Date.now();
    const messageData = {
      id: tempId,
      text: newMessage,
      senderId: currentUser.id,
      senderName: `${currentUser.first_name} ${currentUser.last_name}`,
      senderType: userType,
      timestamp: new Date().toISOString(),
      read: false,
      attachment: attachment
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setAttachment(null);

    try {
      const response = await apiCall('SEND_MESSAGE', {}, {
        data: {
          conversationId: getConversationId(),
          text: newMessage,
          senderId: currentUser.id,
          receiverId: otherUser.id,
          conversationType,
          propertyId: property?.id,
          attachment
        }
      });

      if (response.success) {
        // Update message with server ID
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, id: response.data.id, status: 'sent' } : msg
        ));
        
        // Trigger auto-reply for demo
        if (!isCurrentUserBroker) {
          setTimeout(() => {
            handleAutoReply();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  const handleAutoReply = () => {
    const autoReply = getAutoReply();
    if (autoReply) {
      setTimeout(() => {
        const replyId = Date.now();
        const replyData = {
          id: replyId,
          text: autoReply.text,
          senderId: otherUser.id,
          senderName: otherUser.name,
          senderType: isOtherUserBroker ? 'broker' : 'client',
          timestamp: new Date().toISOString(),
          read: false
        };
        setMessages(prev => [...prev, replyData]);
      }, 1500);
    }
  };

  const getAutoReply = () => {
    if (!newMessage.toLowerCase()) return null;
    
    const msg = newMessage.toLowerCase();
    
    if (isPropertyChat) {
      if (msg.includes('viewing') || msg.includes('schedule') || msg.includes('visit')) {
        return { 
          text: 'I can schedule a viewing for you. What day and time works best?' 
        };
      }
      if (msg.includes('price') || msg.includes('cost') || msg.includes('negotiate')) {
        return { 
          text: 'The price is negotiable. I can help you make an offer that works for you.' 
        };
      }
    }
    
    if (isVerificationChat) {
      if (msg.includes('schedule') || msg.includes('time') || msg.includes('date')) {
        return { 
          text: 'I\'m available this week for the verification. What day works for you?' 
        };
      }
    }
    
    if (isListingChat) {
      if (msg.includes('review') || msg.includes('proposal') || msg.includes('listing')) {
        return { 
          text: 'I\'ll send you the listing proposal shortly for your review.' 
        };
      }
    }
    
    return { 
      text: 'Thank you for your message. I\'ll get back to you shortly.' 
    };
  };

  const getConversationId = () => {
    // Generate conversation ID based on users and type
    const ids = [currentUser.id, otherUser.id].sort();
    return `${conversationType}_${ids.join('_')}`;
  };

  const handleAttachment = (type) => {
    // In real app, this would open file picker
    toast(`Add ${type} attachment feature here`);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderPropertyInfo = () => {
    if (!property) return null;
    
    return (
      <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-amber-50'}`}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={property.main_image || property.images?.[0] || '/imgs/default-property.jpg'} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm truncate">{property.title}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <MapPin className="w-3 h-3" />
              <span>{property.location || property.city}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                {property.beds || 0} beds
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                {property.baths || 0} baths
              </span>
              <span className="text-xs font-bold text-amber-600">
                {property.price?.toLocaleString()} ETB
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuickReplies = () => {
    if (isPropertyChat) {
      return (
        <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setNewMessage("I'd like to schedule a viewing")}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg"
          >
            Schedule viewing
          </button>
          <button 
            onClick={() => setNewMessage("What's the best price?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg"
          >
            Ask about price
          </button>
          <button 
            onClick={() => setNewMessage("Can you send more photos?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg"
          >
            Request photos
          </button>
        </div>
      );
    }
    
    if (isVerificationChat) {
      return (
        <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setNewMessage("What documents do I need for verification?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg"
          >
            Required documents
          </button>
          <button 
            onClick={() => setNewMessage("When are you available for inspection?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg"
          >
            Schedule inspection
          </button>
        </div>
      );
    }
    
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center md:items-center p-4 bg-black/50">
      <div className={`w-full max-w-2xl h-[90vh] md:h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col ${
        theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        {/* Chat Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800`}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                {otherUser.profile_picture ? (
                  <img
                    src={otherUser.profile_picture}
                    alt={otherUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                    {otherUser.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              <div>
                <h3 className="font-semibold">{otherUser.name}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`flex items-center gap-1 ${isOtherUserBroker ? 'text-green-500' : 'text-blue-500'}`}>
                    <CheckCircle className="w-3 h-3" />
                    {isOtherUserBroker ? 'Verified Broker' : otherUser.role || 'Client'}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-3 h-3" />
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
              <Video className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Property Info */}
        {renderPropertyInfo()}

        {/* Quick Replies */}
        {renderQuickReplies()}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center opacity-70">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Start a conversation with {otherUser?.name}</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[70%]">
                    {message.senderId !== currentUser.id && (
                      <div className="text-xs text-gray-500 mb-1 ml-1">{message.senderName}</div>
                    )}
                    <div className={`rounded-2xl p-3 ${
                      message.senderId === currentUser.id
                        ? theme === 'dark'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-500 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <div className={`text-xs mt-1 flex items-center justify-end gap-2 ${
                        message.senderId === currentUser.id
                          ? 'text-white/70'
                          : theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {message.senderId === currentUser.id && (
                          <span className={`w-2 h-2 rounded-full ${
                            message.status === 'sent' ? 'bg-blue-500' : 
                            message.status === 'read' ? 'bg-green-500' : 
                            message.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl p-3 bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <form onSubmit={handleSendMessage}>
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => handleAttachment('image')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
                <ImageIcon className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => handleAttachment('file')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
                <Paperclip className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => handleAttachment('document')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
                <FileText className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  className={`w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <button
                type="submit"
                disabled={!newMessage.trim() && !attachment}
                className={`p-3 rounded-lg transition-all ${
                  !newMessage.trim() && !attachment
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrokerChatModal;