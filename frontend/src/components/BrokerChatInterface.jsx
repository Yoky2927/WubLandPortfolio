import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api.endpoints';
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  Image as ImageIcon,
  File,
  User,
  Users,
  CheckCircle,
  Clock,
  ChevronLeft,
  Minimize2,
  MoreVertical,
  Search,
  ArrowRight,
  Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BrokerChatInterface = ({ 
  isOpen, 
  onClose, 
  user, 
  broker, 
  property = null,
  onSendMessage 
}) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && broker) {
      loadChatHistory();
    }
  }, [isOpen, broker]);

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      // Load chat history from API
      const response = await apiCall('GET_CHAT_HISTORY', { brokerId: broker.id });
      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Load initial sample message
      setMessages([
        {
          id: 1,
          text: property 
            ? `Hello! I'm ${broker.name}, your broker for ${property.title}. How can I help you?`
            : `Hello! I'm ${broker.name}, your assigned broker. How can I help you?`,
          sender: 'broker',
          timestamp: new Date().toISOString(),
          read: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = Date.now();
    const userMessage = {
      id: tempId,
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      // Send message via API
      const response = await apiCall('SEND_MESSAGE', { brokerId: broker.id }, {
        data: {
          text: newMessage,
          propertyId: property?.id
        }
      });

      if (response.success && onSendMessage) {
        onSendMessage(response.data);
      }

      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, ...response.data } : msg
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="fixed inset-0 md:inset-auto md:bottom-4 md:right-4 md:top-auto md:w-96 md:h-[500px] transition-all duration-300">
        <div className={`pointer-events-auto flex flex-col h-full w-full md:rounded-xl shadow-2xl overflow-hidden border ${
          theme === 'dark' 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Chat Header */}
          <div className={`p-4 border-b flex items-center justify-between ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                {broker.profile_picture ? (
                  <img
                    src={broker.profile_picture}
                    alt={broker.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                    {broker.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{broker.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1 text-green-500">
                      <CheckCircle className="w-3 h-3" />
                      Broker
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Property Info if available */}
          {property && (
            <div className={`p-3 border-b ${
              theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-amber-50'
            }`}>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">About: {property.title}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {property.location} • {property.price?.toLocaleString()} ETB
              </div>
            </div>
          )}

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
                  <p>Start a conversation with {broker?.name}</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 ${
                    message.sender === 'user'
                      ? theme === 'dark'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <div className={`text-xs mt-1 ${
                      message.sender === 'user'
                        ? 'text-white/70'
                        : theme === 'dark'
                          ? 'text-gray-400'
                          : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form 
            onSubmit={handleSendMessage}
            className={`p-4 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={`p-3 rounded-lg transition-all ${
                  !newMessage.trim()
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

export default BrokerChatInterface;