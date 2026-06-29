import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Image, File, Paperclip, Smile, Camera, 
  Loader2, CheckCircle, Clock, AlertCircle, 
  Maximize2, Minimize2, MoreVertical, Phone, Video,
  Search, Pin, Trash2, Volume2, VolumeX, Download,
  User, Crown, Star, MessageCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const BrokerChatWindow = ({ 
  brokerId, 
  onClose, 
  theme: propTheme,
  initialMessages = [],
  isOpen = true,
  isMaximized = false,
  onToggleMaximize
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = propTheme || contextTheme || 'light';
  const isDark = theme === 'dark';

  // State
  const [broker, setBroker] = useState(null);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState('online');
  const [lastSeen, setLastSeen] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch broker data
  const fetchBrokerData = async () => {
    if (!brokerId) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch broker details
      const brokerResponse = await axios.get(
        `http://localhost:5000/api/brokers/${brokerId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (brokerResponse.data.success) {
        setBroker(brokerResponse.data.data);
        
        // Fetch broker's current status
        try {
          const statusResponse = await axios.get(
            `http://localhost:5001/api/chat/brokers/${brokerId}/status`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (statusResponse.data) {
            setBrokerStatus(statusResponse.data.status || 'online');
            setLastSeen(statusResponse.data.lastSeen);
          }
        } catch (error) {
          console.log('Status endpoint not available');
        }
        
        // Fetch existing messages
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error fetching broker data:', error);
      toast.error('Failed to load broker information');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5001/api/messages/conversations/broker/${brokerId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.messages) {
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg.id,
          text: msg.content || msg.text,
          senderId: msg.sender_id,
          senderName: msg.sender_name || (msg.sender_id === brokerId ? broker?.name : 'You'),
          timestamp: new Date(msg.created_at || msg.timestamp),
          status: msg.status || 'sent',
          type: msg.type || 'text',
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          fileType: msg.file_type
        }));
        
        setMessages(formattedMessages);
        
        // Calculate unread messages
        const unread = formattedMessages.filter(msg => 
          msg.senderId === brokerId && msg.status !== 'read'
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // If endpoint doesn't exist, use empty array
      setMessages([]);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !attachedFile) {
      toast.error('Please enter a message or attach a file');
      return;
    }
    
    const tempId = `temp-${Date.now()}`;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Optimistic update
    const tempMessage = {
      id: tempId,
      text: newMessage,
      senderId: user.id,
      senderName: user.firstName || user.fullName || 'You',
      timestamp: new Date(),
      status: 'sending',
      type: attachedFile ? 'file' : 'text',
      fileUrl: attachedFile ? URL.createObjectURL(attachedFile.file) : null,
      fileName: attachedFile?.name,
      fileType: attachedFile?.type
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setIsSending(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      if (newMessage.trim()) {
        formData.append('content', newMessage);
      }
      
      if (attachedFile?.file) {
        formData.append('file', attachedFile.file);
      }
      
      formData.append('brokerId', brokerId);
      formData.append('type', attachedFile ? 'file' : 'text');
      
      const response = await axios.post(
        'http://localhost:5001/api/messages/send-to-broker',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        // Replace temp message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? {
            ...msg,
            id: response.data.messageId,
            status: 'sent'
          } : msg
        ));
        
        // Clear input
        setNewMessage('');
        setAttachedFile(null);
        
        // Emit via WebSocket if connected
        if (socketRef.current) {
          socketRef.current.emit('newMessage', {
            ...tempMessage,
            id: response.data.messageId,
            status: 'sent'
          });
        }
        
        toast.success('Message sent');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
      
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle file attachment
  const handleFileSelect = (e, type = 'file') => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    const fileType = type === 'image' ? 'image' : 
                    file.type.includes('pdf') ? 'pdf' :
                    file.type.includes('document') ? 'document' : 'file';
    
    setAttachedFile({
      file,
      name: file.name,
      type: fileType,
      size: file.size,
      preview: type === 'image' ? URL.createObjectURL(file) : null
    });
    
    e.target.value = '';
  };

  // Remove attachment
  const removeAttachment = () => {
    if (attachedFile?.preview) {
      URL.revokeObjectURL(attachedFile.preview);
    }
    setAttachedFile(null);
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Emit typing event via WebSocket
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        brokerId,
        userId: JSON.parse(localStorage.getItem('user') || '{}').id,
        isTyping: true
      });
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('typing', {
          brokerId,
          userId: JSON.parse(localStorage.getItem('user') || '{}').id,
          isTyping: false
        });
      }
    }, 1000);
  };

  // Mark messages as read
  const markMessagesAsRead = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const unreadMessages = messages.filter(msg => 
      msg.senderId === brokerId && msg.status !== 'read'
    );
    
    if (unreadMessages.length > 0) {
      setUnreadCount(0);
      setMessages(prev => prev.map(msg => 
        msg.senderId === brokerId ? { ...msg, status: 'read' } : msg
      ));
      
      // Emit read event
      if (socketRef.current) {
        socketRef.current.emit('markRead', {
          brokerId,
          userId: user.id,
          messageIds: unreadMessages.map(msg => msg.id)
        });
      }
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Initialize WebSocket connection
  const initWebSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Connect to WebSocket server
    socketRef.current = new WebSocket(`ws://localhost:5001/ws/chat?token=${token}`);
    
    socketRef.current.onopen = () => {
      console.log('WebSocket connected for broker chat');
      
      // Join broker's chat room
      socketRef.current.send(JSON.stringify({
        type: 'join',
        brokerId
      }));
    };
    
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'newMessage':
            if (data.senderId === brokerId) {
              setMessages(prev => [...prev, {
                ...data.message,
                timestamp: new Date(data.message.timestamp)
              }]);
              setUnreadCount(prev => prev + 1);
            }
            break;
            
          case 'typing':
            if (data.brokerId === brokerId) {
              setIsTyping(data.isTyping);
            }
            break;
            
          case 'statusUpdate':
            if (data.brokerId === brokerId) {
              setBrokerStatus(data.status);
              setLastSeen(data.lastSeen);
            }
            break;
            
          case 'messageRead':
            // Update message status
            setMessages(prev => prev.map(msg => 
              data.messageIds.includes(msg.id) ? { ...msg, status: 'read' } : msg
            ));
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socketRef.current.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(initWebSocket, 3000);
    };
    
    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  // Effects
  useEffect(() => {
    if (brokerId && isOpen) {
      fetchBrokerData();
      initWebSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [brokerId, isOpen]);

  useEffect(() => {
    scrollToBottom();
    if (isOpen) {
      markMessagesAsRead();
    }
  }, [messages, isOpen]);

  // Get status indicator
  const getStatusIndicator = () => {
    switch (brokerStatus) {
      case 'online':
        return { color: 'bg-green-500', text: 'Online now' };
      case 'away':
        return { color: 'bg-amber-500', text: 'Away' };
      case 'busy':
        return { color: 'bg-red-500', text: 'Busy' };
      case 'offline':
        return { color: 'bg-gray-500', text: 'Offline' };
      default:
        return { color: 'bg-gray-500', text: 'Offline' };
    }
  };

  const status = getStatusIndicator();

  if (!isOpen) return null;

  if (isLoading && !broker) {
    return (
      <div className={`fixed bottom-32 left-24 w-96 h-[600px] rounded-xl shadow-2xl z-[100] ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="ml-3">Loading chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-32 left-24 w-96 h-[600px] rounded-xl shadow-2xl z-[100] flex flex-col ${
      isDark ? 'bg-gray-800' : 'bg-white'
    } border ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
      isMaximized ? 'w-[800px] h-[700px]' : ''
    } transition-all duration-300`}>
      
      {/* Header */}
      <div className={`p-4 border-b flex-shrink-0 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {broker?.profile_picture ? (
                <img 
                  src={broker.profile_picture} 
                  alt={broker.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold">
                  {broker?.name?.charAt(0) || 'B'}
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
                isDark ? 'border-gray-800' : 'border-white'
              } ${status.color}`}></div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{broker?.name || 'Broker'}</h3>
                {broker?.is_verified && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
                {broker?.is_premium && (
                  <Crown className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {status.text}
                </span>
                {isTyping && (
                  <span className="text-amber-500 italic">typing...</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
            
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-full ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={onToggleMaximize}
              className={`p-2 rounded-full ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Broker info summary */}
        {broker && (
          <div className={`mt-3 pt-3 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Experience:
                </span>
                <span className="ml-2 font-medium">
                  {broker.experience_years || 'N/A'} years
                </span>
              </div>
              <div>
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Commission:
                </span>
                <span className="ml-2 font-medium">
                  {broker.commission_rate ? `${broker.commission_rate}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Messages area */}
      <div 
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto p-4 ${
          isDark ? 'bg-gray-900/30' : 'bg-gray-50'
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 opacity-30 mb-4" />
            <h4 className="font-medium mb-2">No messages yet</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Start your conversation with {broker?.name || 'your broker'}
            </p>
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              <p className="font-medium mb-1">💡 Tip:</p>
              <p>You can discuss property details, schedule viewings, and negotiate terms here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.senderId !== brokerId;
              const showDate = index === 0 || 
                formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp);
              
              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <div className={`px-3 py-1 rounded-full text-xs ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl p-3 ${
                      isOwn
                        ? isDark 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-amber-500 text-white'
                        : isDark 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                    } ${message.status === 'failed' ? 'border-2 border-red-500' : ''}`}>
                      
                      {!isOwn && (
                        <div className="text-xs font-medium mb-1 opacity-80">
                          {message.senderName}
                        </div>
                      )}
                      
                      {message.type === 'file' ? (
                        <div className={`mb-2 p-2 rounded-lg ${
                          isDark ? 'bg-gray-600/30' : 'bg-black/5'
                        }`}>
                          <div className="flex items-center gap-2">
                            {message.fileType === 'image' ? (
                              <Image className="w-4 h-4" />
                            ) : (
                              <File className="w-4 h-4" />
                            )}
                            <span className="text-sm truncate">{message.fileName}</span>
                            <a 
                              href={message.fileUrl} 
                              download
                              className="ml-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-4 h-4 opacity-70 hover:opacity-100" />
                            </a>
                          </div>
                        </div>
                      ) : null}
                      
                      {message.text && (
                        <p className="break-words">{message.text}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                        <span>{formatTime(message.timestamp)}</span>
                        {isOwn && (
                          <div className="flex items-center gap-1 ml-2">
                            {message.status === 'sending' && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            {message.status === 'sent' && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {message.status === 'failed' && (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Attachment preview */}
      {attachedFile && (
        <div className={`mx-4 mt-2 p-3 rounded-lg ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {attachedFile.type === 'image' && attachedFile.preview ? (
                <img 
                  src={attachedFile.preview} 
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className={`w-12 h-12 flex items-center justify-center rounded ${
                  isDark ? 'bg-gray-600' : 'bg-gray-200'
                }`}>
                  <File className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium truncate max-w-[200px]">
                  {attachedFile.name}
                </p>
                <p className="text-xs opacity-70">
                  {(attachedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={removeAttachment}
              className={`p-1 rounded-full ${
                isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className={`p-4 border-t flex-shrink-0 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <form onSubmit={sendMessage} className="space-y-3">
          <div className="flex items-center gap-2">
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={`p-2 rounded-full ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <Camera className="w-5 h-5" />
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e, 'file')}
                accept="*/*"
                className="hidden"
              />
              
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => handleFileSelect(e, 'image')}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            {/* Message input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder={`Message ${broker?.name || 'broker'}...`}
              className={`flex-1 px-4 py-3 ${
                isDark 
                  ? 'bg-gray-700 text-white placeholder-gray-400' 
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500'
              } rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500`}
              disabled={isSending}
            />
            
            {/* Send button */}
            <button
              type="submit"
              disabled={(!newMessage.trim() && !attachedFile) || isSending}
              className={`p-3 rounded-full transition-colors ${
                (!newMessage.trim() && !attachedFile) || isSending
                  ? 'bg-amber-300 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600'
              } text-white`}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => {
                setNewMessage("Hi, I'd like to schedule a property viewing");
                handleTyping();
              }}
              className={`px-3 py-1 rounded-full ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Schedule viewing
            </button>
            <button
              type="button"
              onClick={() => {
                setNewMessage("Can you send me more details about the property?");
                handleTyping();
              }}
              className={`px-3 py-1 rounded-full ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Request details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrokerChatWindow;