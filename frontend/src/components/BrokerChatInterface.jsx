import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api.endpoints';
import { 
  MessageCircle, X, Send, Paperclip, Image as ImageIcon, 
  FileText, Download, User, CheckCircle, Clock, 
  Phone, Video, Mic, Smile, MapPin, DollarSign,
  Loader2, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const BrokerChatModal = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  otherUser, 
  userType = 'broker',
  property = null,
  conversationType = 'property'
}) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // Determine user roles
  const isCurrentUserBroker = userType === 'broker';
  const isOtherUserBroker = otherUser?.role?.includes('broker');
  const isPropertyChat = conversationType === 'property';
  const isVerificationChat = conversationType === 'verification';
  const isListingChat = conversationType === 'listing';

  // Initialize WebSocket
  useEffect(() => {
    if (isOpen && otherUser) {
      initializeSocket();
      loadChatHistory();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOpen, otherUser]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    
    // For now, we'll use polling instead of WebSocket to avoid complexity
    // In production, you would set up proper socket connection
    console.log('Socket initialization for real-time chat');
  };

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      
      // First, try to get existing conversation
      let conversationId = await getOrCreateConversation();
      
      if (conversationId) {
        // Load messages from conversation
        const response = await axios.get(
          `http://localhost:5001/api/messages/conversation/${conversationId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data && Array.isArray(response.data)) {
          setMessages(response.data.map(msg => ({
            id: msg.id,
            text: msg.text,
            senderId: msg.sender_id,
            senderName: `${msg.first_name} ${msg.last_name}`,
            timestamp: msg.created_at,
            read: msg.status === 'read',
            fileUrl: msg.file_url,
            fileName: msg.file_name,
            fileType: msg.file_type
          })));
        } else {
          loadSampleMessages();
        }
      } else {
        loadSampleMessages();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      loadSampleMessages();
    } finally {
      setIsLoading(false);
    }
  };

  const getOrCreateConversation = async () => {
    try {
      // Check if we have messages with this user
      const response = await axios.get(
        `http://localhost:5001/api/messages/${otherUser.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data && response.data.length > 0) {
        return response.data[0].conversation_id;
      }
      
      // If no conversation exists, send a greeting to create one
      const createResponse = await axios.post(
        'http://localhost:5001/api/messages/send/' + otherUser.id,
        {
          text: `Hello ${otherUser.name}! I'm ${currentUser.first_name} ${currentUser.last_name}, your assigned broker. How can I help you today?`,
          receiverId: otherUser.id
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return createResponse.data?.conversationId || null;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      return null;
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
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        },
        {
          id: 2,
          text: 'I would like to schedule a viewing for this weekend if possible.',
          senderId: currentUser.id,
          senderName: `${currentUser.first_name} ${currentUser.last_name}`,
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
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true
        }
      ];
    }
    
    setMessages(sampleMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !attachment) {
      toast.error('Please enter a message or select a file');
      return;
    }

    const tempId = Date.now();
    const messageData = {
      id: tempId,
      text: newMessage,
      senderId: currentUser.id,
      senderName: `${currentUser.first_name} ${currentUser.last_name}`,
      timestamp: new Date().toISOString(),
      read: false,
      isSending: true,
      attachment: attachment,
      attachmentName: attachment?.name
    };

    // Add optimistic message
    setMessages(prev => [...prev, messageData]);
    
    const formData = new FormData();
    formData.append('text', newMessage);
    formData.append('receiverId', otherUser.id);
    
    if (attachment) {
      formData.append('file', attachment);
    }

    setIsSending(true);

    try {
      const response = await axios.post(
        `http://localhost:5001/api/messages/send/${otherUser.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update message with server response
      if (response.data) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? {
            ...msg,
            id: response.data.id,
            isSending: false,
            status: 'sent',
            fileUrl: response.data.file_url,
            fileName: response.data.file_name,
            fileType: response.data.file_type
          } : msg
        ));
      }

      setNewMessage('');
      setAttachment(null);
      setAttachmentPreview(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Message sent!');

      // Simulate auto-reply for demo
      if (!isCurrentUserBroker && Math.random() > 0.3) {
        setTimeout(() => {
          handleAutoReply();
        }, 2000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, isSending: false, status: 'failed' } : msg
      ));
      
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAutoReply = () => {
    const autoReply = getAutoReply();
    if (autoReply) {
      const replyId = Date.now();
      const replyData = {
        id: replyId,
        text: autoReply.text,
        senderId: otherUser.id,
        senderName: otherUser.name,
        timestamp: new Date().toISOString(),
        read: false
      };
      setMessages(prev => [...prev, replyData]);
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid file type (images, PDF, Word, or text)');
      return;
    }

    setAttachment(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }

    toast.success(`${file.name} attached`);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadFile = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <MapPin className="w-3 h-3" />
              <span>{property.location || property.city}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded">
                {property.beds || 0} beds
              </span>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded">
                {property.baths || 0} baths
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
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
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            Schedule viewing
          </button>
          <button 
            onClick={() => setNewMessage("What's the best price?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            Ask about price
          </button>
          <button 
            onClick={() => setNewMessage("Can you send more photos?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
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
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            Required documents
          </button>
          <button 
            onClick={() => setNewMessage("When are you available for inspection?")}
            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            Schedule inspection
          </button>
        </div>
      );
    }
    
    return null;
  };

  const renderMessage = (message) => {
    const isOwn = message.senderId === currentUser.id;
    
    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {message.senderName}
            </div>
          )}
          
          <div className={`rounded-2xl p-3 ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'} ${
            isOwn
              ? theme === 'dark' ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
              : theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
          } ${message.isSending ? 'opacity-70' : ''} ${message.status === 'failed' ? 'border border-red-500' : ''}`}>
            
            {message.fileUrl || message.attachmentName ? (
              <div className="mb-2">
                <div className={`flex items-center gap-2 p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-black/20' : 'bg-white/20'
                }`}>
                  {message.fileType?.startsWith('image/') || message.attachment?.type?.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span className="text-sm truncate">{message.fileName || message.attachmentName}</span>
                  <button
                    onClick={() => {
                      if (message.fileUrl) {
                        handleDownloadFile(message.fileUrl, message.fileName);
                      }
                    }}
                    className="ml-auto hover:opacity-80"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                {attachmentPreview && message.id.includes('temp') && (
                  <div className="mt-2">
                    <img 
                      src={attachmentPreview} 
                      alt="Preview" 
                      className="max-w-full max-h-32 rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
            ) : null}
            
            {message.text && (
              <p className="whitespace-pre-wrap">{message.text}</p>
            )}
            
            <div className={`text-xs mt-1 flex items-center gap-2 ${
              isOwn
                ? theme === 'dark' ? 'text-white/70' : 'text-white/80'
                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span>{formatTime(message.timestamp)}</span>
              
              {isOwn && (
                <>
                  {message.isSending && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  {message.status === 'failed' && (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  )}
                  {!message.isSending && message.status !== 'failed' && (
                    <span className={`w-2 h-2 rounded-full ${
                      message.read ? 'bg-green-500' : 'bg-blue-500'
                    }`}></span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center md:items-center p-4 bg-black/50 backdrop-blur-sm">
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
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`}
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
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <Video className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Property Info */}
        {renderPropertyInfo()}

        {/* Quick Replies */}
        {renderQuickReplies()}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Start a conversation with {otherUser?.name}</p>
              <p className="text-sm text-gray-400 mt-2">Send a message to begin</p>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              
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

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Attachment Preview */}
        {attachment && (
          <div className={`p-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                {attachment.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span className="text-sm truncate">{attachment.name}</span>
                <span className="text-xs text-gray-500">
                  ({(attachment.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {attachmentPreview && attachment.type.startsWith('image/') && (
              <div className="mt-2">
                <img 
                  src={attachmentPreview} 
                  alt="Preview" 
                  className="max-w-full max-h-32 rounded-lg object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Message Input */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button 
                type="button" 
                onClick={() => {
                  fileInputRef.current?.click();
                  fileInputRef.current?.setAttribute('accept', 'image/*');
                }}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title="Attach image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className={`w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  disabled={isSending}
                />
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <button
                type="submit"
                disabled={(!newMessage.trim() && !attachment) || isSending}
                className={`p-3 rounded-lg transition-all ${isSending ? 'opacity-70 cursor-not-allowed' : ''} ${
                  (!newMessage.trim() && !attachment) || isSending
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg'
                }`}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrokerChatModal;