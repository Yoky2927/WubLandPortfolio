import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { Users, X, Send, File, Image, FileText, Archive, Download, LogOut, User, MessageSquare, Loader2, Search, Smile, Home, Edit, Trash, Upload, Paperclip, Maximize, Minimize, Crop, Type, Save } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-screen bg-red-100 dark:bg-red-900">
                    <h1 className="text-2xl text-red-600 dark:text-red-200">Something went wrong. Please try again later.</h1>
                </div>
            );
        }
        return this.props.children;
    }
}

const ChatApp = () => {
    const { theme, toggleTheme } = useTheme();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [filePreview, setFilePreview] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [isTyping, setIsTyping] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userCategories, setUserCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [userRole, setUserRole] = useState('');
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [contextMessageId, setContextMessageId] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [showFileModal, setShowFileModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const [isCopying, setIsCopying] = useState(false);
    const [hasFetchedUsers, setHasFetchedUsers] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isFullScreenImage, setIsFullScreenImage] = useState(false);
    const [imageEditMode, setImageEditMode] = useState(false);
    const [imageAnnotations, setImageAnnotations] = useState([]);
    const [currentAnnotation, setCurrentAnnotation] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const messageEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const contextMenuRef = useRef(null);
    const dropZoneRef = useRef(null);
    const imageCanvasRef = useRef(null);
    const annotationCanvasRef = useRef(null);

    const [authUser, setAuthUser] = useState(null);
    const socket = useRef(null);
    const navigate = useNavigate();

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB, matches backend limit

    // Responsive state
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showSidebar, setShowSidebar] = useState(!isMobile);
    const [sidebarExpanded, setSidebarExpanded] = useState(!isMobile);

    // Handle window resize for responsive design
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && showSidebar && selectedUser) {
                setShowSidebar(false);
            } else if (!mobile) {
                setShowSidebar(true);
                setSidebarExpanded(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showSidebar, selectedUser]);

    // Handle click outside for context menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setShowContextMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle drag and drop for file uploads
    useEffect(() => {
        const handleDragOver = (e) => {
            e.preventDefault();
            setIsDragging(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            setIsDragging(false);
        };

        const handleDrop = (e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        };

        const dropZone = dropZoneRef.current;
        if (dropZone) {
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('dragleave', handleDragLeave);
            dropZone.addEventListener('drop', handleDrop);
        }

        return () => {
            if (dropZone) {
                dropZone.removeEventListener('dragover', handleDragOver);
                dropZone.removeEventListener('dragleave', handleDragLeave);
                dropZone.removeEventListener('drop', handleDrop);
            }
        };
    }, []);

    // File icon based on type
    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'image': return <Image size={20} />;
            case 'document': return <FileText size={20} />;
            case 'archive': return <Archive size={20} />;
            default: return <File size={20} />;
        }
    };

    // Handle file selection
    const handleFileSelect = (file) => {
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast.error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB`);
            return;
        }

        setSelectedFile(file);

        const extension = file.name.split('.').pop().toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
        const archiveExtensions = ['zip', 'rar', '7z'];

        let detectedFileType = 'other';
        if (imageExtensions.includes(extension)) detectedFileType = 'image';
        else if (documentExtensions.includes(extension)) detectedFileType = 'document';
        else if (archiveExtensions.includes(extension)) detectedFileType = 'archive';

        setFileType(detectedFileType);
        setFileName(file.name);

        if (detectedFileType === 'image') {
            const reader = new FileReader();
            reader.onloadend = () => setFilePreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file ? `${file.name} (${file.size} bytes)` : 'No file');
        handleFileSelect(file);
    };

    // Remove selected file
    const removeFile = () => {
        setFilePreview(null);
        setFileType(null);
        setFileName('');
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Play sound on message send
    const playSendSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.15);

            oscillator.start();
            setTimeout(() => oscillator.stop(), 150);
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    };

    // Initialize socket and fetch users
// Initialize socket and fetch users - FIXED VERSION
useEffect(() => {
    const fetchAuthUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('No authentication token found');
                navigate('/login');
                return null;
            }

            const response = await axios.get(`${import.meta.env.VITE_USER_API_URL}/auth/check`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAuthUser(response.data);
            setUserRole(response.data.role || 'user');
            return response.data;
        } catch (error) {
            console.error('Auth error:', error);
            toast.error('Authentication failed, please log in again');
            localStorage.removeItem('token');
            navigate('/login');
            return null;
        }
    };

    const fetchUsers = async (userData) => {
        if (hasFetchedUsers) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_COMMUNICATION_API_URL}/messages/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const usersData = response.data.map(user => ({
                ...user,
                fullName: user.full_name || user.fullName || 'Unknown User',
                userType: user.role || user.userType || 'user',
                lastMessageTime: user.last_message_time ? new Date(user.last_message_time) : new Date(0)
            }));

            usersData.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
            setUsers(usersData);

            if (userData?.role === 'admin') {
                setUserCategories(['all', 'brokers', 'tenants', 'leasers', 'buyers', 'sellers', 'support']);
            } else if (userData?.role === 'broker') {
                setUserCategories(['all', 'clients', 'brokers']);
            } else if (userData?.role === 'support') {
                setUserCategories(['all', 'admins', 'brokers', 'buyers', 'sellers', 'leasers', 'renters']);
            } else {
                setUserCategories(['all']);
            }

            setHasFetchedUsers(true);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize socket only once
    if (!socket.current) {
        socket.current = io(import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5001', {
            withCredentials: true,
            extraHeaders: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            transports: ['websocket', 'polling'], // Add fallback transport
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const handleConnect = () => console.log('Connected to WebSocket');
        const handleDisconnect = (reason) => {
            console.log('Disconnected from WebSocket:', reason);
            if (reason === 'io server disconnect') {
                // The disconnection was initiated by the server, you need to reconnect manually
                socket.current.connect();
            }
        };
        const handleGetOnlineUsers = (users) => setOnlineUsers(users);
        const handleUserTyping = ({ userId, userName }) => {
            if (userId === selectedUser?.id) {
                setIsTyping(userName || selectedUser.fullName);
            }
        };
        const handleUserStoppedTyping = () => setIsTyping(null);
        const handleError = (error) => {
            console.error('Socket error:', error);
            toast.error('Connection error');
        };
        const handleNewMessage = (newMessage) => {
            if ((newMessage.receiverId === authUser?.id && newMessage.senderId === selectedUser?.id) ||
                (newMessage.senderId === authUser?.id && newMessage.receiverId === selectedUser?.id)) {
                setMessages((prev) => {
                    const messageExists = prev.some(msg => msg.id === newMessage.id);
                    if (!messageExists) {
                        return [...prev, { ...newMessage, status: 'delivered' }];
                    }
                    return prev;
                });

                if (newMessage.senderId !== authUser?.id) {
                    socket.current.emit('messageRead', { 
                        senderId: newMessage.senderId, 
                        messageId: newMessage.id 
                    });
                }

                setUsers(prev => {
                    const updatedUsers = [...prev];
                    const userIndex = updatedUsers.findIndex(u => 
                        u.id === newMessage.senderId || u.id === newMessage.receiverId
                    );
                    if (userIndex !== -1) {
                        const user = updatedUsers[userIndex];
                        user.lastMessageTime = new Date();
                        updatedUsers.splice(userIndex, 1);
                        updatedUsers.unshift(user);
                    }
                    return updatedUsers;
                });
            }
        };
        const handleMessageRead = (data) => {
            setMessages(prev => prev.map(msg => 
                msg.id === data.messageId ? { ...msg, status: 'read' } : msg
            ));
        };

        socket.current.on('connect', handleConnect);
        socket.current.on('disconnect', handleDisconnect);
        socket.current.on('getOnlineUsers', handleGetOnlineUsers);
        socket.current.on('userTyping', handleUserTyping);
        socket.current.on('userStoppedTyping', handleUserStoppedTyping);
        socket.current.on('error', handleError);
        socket.current.on('newMessage', handleNewMessage);
        socket.current.on('messageRead', handleMessageRead);
    }

    fetchAuthUser().then(userData => {
        if (userData) {
            fetchUsers(userData);
        }
    });

    return () => {
        // Don't disconnect the socket here, keep it connected
        // Only remove specific listeners if needed
        if (socket.current) {
            socket.current.off('userTyping');
            socket.current.off('userStoppedTyping');
            socket.current.off('newMessage');
            socket.current.off('messageRead');
        }
    };
}, []); // Empty dependency array - socket should be initialized only once

// Separate effect for handling messages based on selected user
useEffect(() => {
    if (!socket.current || !selectedUser) return;

    const handleNewMessage = (newMessage) => {
        if ((newMessage.receiverId === authUser?.id && newMessage.senderId === selectedUser?.id) ||
            (newMessage.senderId === authUser?.id && newMessage.receiverId === selectedUser?.id)) {
            setMessages((prev) => {
                const messageExists = prev.some(msg => msg.id === newMessage.id);
                if (!messageExists) {
                    return [...prev, { ...newMessage, status: 'delivered' }];
                }
                return prev;
            });

            if (newMessage.senderId !== authUser?.id) {
                socket.current.emit('messageRead', { 
                    senderId: newMessage.senderId, 
                    messageId: newMessage.id 
                });
            }
        }
    };

    socket.current.on('newMessage', handleNewMessage);

    return () => {
        if (socket.current) {
            socket.current.off('newMessage', handleNewMessage);
        }
    };
}, [authUser, selectedUser]);

// Separate effect for handling message read events
useEffect(() => {
    if (!socket.current || !selectedUser) return;

    const handleMessageRead = (data) => {
        setMessages(prev => prev.map(msg => 
            msg.id === data.messageId ? { ...msg, status: 'read' } : msg
        ));
    };

    socket.current.on('messageRead', handleMessageRead);

    return () => {
        if (socket.current) {
            socket.current.off('messageRead', handleMessageRead);
        }
    };
}, [selectedUser]);

// Separate effect for handling typing indicators
useEffect(() => {
    if (!socket.current || !selectedUser) return;

    const handleUserTyping = ({ userId, userName }) => {
        if (userId === selectedUser?.id) {
            setIsTyping(userName || selectedUser.fullName);
        }
    };

    const handleUserStoppedTyping = () => setIsTyping(null);

    socket.current.on('userTyping', handleUserTyping);
    socket.current.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
        if (socket.current) {
            socket.current.off('userTyping', handleUserTyping);
            socket.current.off('userStoppedTyping', handleUserStoppedTyping);
        }
    };
}, [selectedUser]);
    // Fetch messages for selected user
    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get(
                        `${import.meta.env.VITE_COMMUNICATION_API_URL}/messages/${selectedUser.id}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    setMessages(response.data.map(msg => ({
                        ...msg,
                        senderId: msg.sender_id,
                        status: msg.status || 'sent'
                    })));
                } catch (error) {
                    console.error('Error fetching messages:', error);
                    toast.error('Failed to load messages');
                }
            };
            fetchMessages();
        } else {
            setMessages([]);
        }
    }, [selectedUser]);

    // Scroll to latest message
    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Send message
    const handleSendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!text.trim() && !selectedFile) return;

        const userId = selectedUser?.id;
        if (!selectedUser || !userId) {
            toast.error('Please select a user to chat with');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const apiUrl = `${import.meta.env.VITE_COMMUNICATION_API_URL}/messages/send/${userId}`;

            const formData = new FormData();
            formData.append('text', text.trim());

            if (selectedFile) {
                if (!(selectedFile instanceof Blob)) {
                    console.error('Invalid file object:', selectedFile);
                    toast.error('Invalid file selected');
                    return;
                }
                formData.append('file', selectedFile);
            }

            const response = await axios.post(apiUrl, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            const newMessage = {
                ...response.data,
                senderId: authUser?.id,
                status: 'sent'
            };

            setMessages((prev) => [...prev, newMessage]);
            setText('');
            removeFile();

            playSendSound();

            socket.current.emit('newMessage', {
                ...newMessage,
                receiverId: userId
            });

        } catch (error) {
            console.error('Error sending message:', error);
            if (error.response?.status === 403) {
                toast.error('Message limit reached. Upgrade to premium for unlimited messages.');
            } else if (error.response?.status === 402) {
                toast.error('Please subscribe to send more messages');
            } else if (error.response?.status === 413) {
                toast.error('File too large. Maximum size is 50MB');
            } else {
                toast.error('Failed to send message: ' + (error.response?.data?.error || error.message));
            }
        }
    }, [text, selectedFile, selectedUser, authUser]);

    // Handle typing indicator
    const handleTyping = useCallback(() => {
        if (!selectedUser?.id) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        socket.current.emit('typing', {
            userId: authUser?.id,
            receiverId: selectedUser.id,
            userName: authUser?.fullName
        });

        typingTimeoutRef.current = setTimeout(() => {
            socket.current.emit('stopTyping', { userId: authUser?.id });
        }, 1000);
    }, [authUser, selectedUser]);

    // Add emoji to message
    const addEmoji = (emojiData) => {
        setText((prev) => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Handle right-click for context menu
    const handleRightClick = (e, messageId) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMessageId(messageId);
        setShowContextMenu(true);
    };

    // Toggle message selection
    const toggleMessageSelection = (messageId) => {
        setSelectedMessages(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(messageId)) {
                newSelection.delete(messageId);
            } else {
                newSelection.add(messageId);
            }

            if (newSelection.size === 0) {
                setIsSelectMode(false);
            } else if (!isSelectMode) {
                setIsSelectMode(true);
            }

            return newSelection;
        });
    };

    // Clear message selection
    const clearSelection = () => {
        setSelectedMessages(new Set());
        setIsSelectMode(false);
    };

    // Select all messages
    const selectAllMessages = () => {
        const allMessageIds = new Set(messages.map(msg => msg.id));
        setSelectedMessages(allMessageIds);
        setIsSelectMode(true);
    };

    // Delete selected messages
    const deleteSelectedMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const messageIds = Array.from(selectedMessages);

            const deletePromises = messageIds.map(messageId =>
                axios.delete(`${import.meta.env.VITE_COMMUNICATION_API_URL}/messages/${messageId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).catch(error => {
                    console.error(`Failed to delete message ${messageId}:`, error);
                    return { success: false, messageId, error };
                })
            );

            const results = await Promise.all(deletePromises);
            const successfulDeletes = results.filter(result => result && result.status === 200);
            const failedDeletes = results.filter(result => result && result.status !== 200);

            if (successfulDeletes.length > 0) {
                setMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
                toast.success(`Deleted ${successfulDeletes.length} message${successfulDeletes.length > 1 ? 's' : ''}`);
            }

            if (failedDeletes.length > 0) {
                toast.error(`Failed to delete ${failedDeletes.length} message${failedDeletes.length > 1 ? 's' : ''}`);
            }

            clearSelection();
        } catch (error) {
            console.error('Error deleting messages:', error);
            toast.error('Failed to delete messages');
        }
    };

    // Copy selected messages
    const copySelectedMessages = async () => {
        const selectedTexts = messages
            .filter(msg => selectedMessages.has(msg.id))
            .map(msg => msg.text)
            .filter(text => text)
            .join('\n\n');

        if (selectedTexts) {
            setIsCopying(true);
            try {
                await navigator.clipboard.writeText(selectedTexts);
                setCopiedMessageId('bulk');
                toast.success('Messages copied to clipboard');

                setTimeout(() => {
                    setCopiedMessageId(null);
                    setIsCopying(false);
                }, 2000);
            } catch (error) {
                toast.error('Failed to copy messages');
                setIsCopying(false);
            }
        } else {
            toast.error('No text messages selected');
        }
    };

    // Copy single message
    const copySingleMessage = async (messageId, messageText) => {
        if (!messageText) {
            toast.error('No text to copy');
            return;
        }

        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(messageText);
            setCopiedMessageId(messageId);
            toast.success('Message copied to clipboard');

            setTimeout(() => {
                setCopiedMessageId(null);
                setIsCopying(false);
            }, 2000);
        } catch (error) {
            toast.error('Failed to copy message');
            setIsCopying(false);
        }
    };

    // Delete single message
    const handleDeleteMessage = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${import.meta.env.VITE_COMMUNICATION_API_URL}/messages/${messageId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.status === 200) {
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
                toast.success('Message deleted');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            if (error.response?.status === 404) {
                toast.error('Message not found or already deleted');
            } else if (error.response?.status === 403) {
                toast.error('You can only delete your own messages');
            } else {
                toast.error('Failed to delete message');
            }
        }
        setShowContextMenu(false);
    };

    // Edit message (Note: Backend does not support PUT /messages/:id endpoint yet)
    const handleEditMessage = (messageId, currentText) => {
        setEditingMessageId(messageId);
        setEditingText(currentText);
        setShowContextMenu(false);
    };

    const handleSaveEdit = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            // Note: This endpoint is not implemented in the provided backend
            const response = await axios.put(
                `${import.meta.env.VITE_COMMUNICATION_API_URL}/messages/${messageId}`,
                { text: editingText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, text: editingText } : msg));
            setEditingMessageId(null);
            setEditingText('');
            toast.success('Message updated');
        } catch (error) {
            console.error('Error updating message:', error);
            toast.error('Failed to update message');
        }
    };

    // Open file in modal or download
    const handleOpenFile = (fileUrl, fileType, fileName) => {
        if (fileType === 'image') {
            setSelectedFile({ url: fileUrl, type: 'image', name: fileName });
            setShowFileModal(true);
            setIsFullScreenImage(true);
        } else {
            downloadFile(fileUrl, fileName);
        }
    };

    // Download file
    const downloadFile = (fileUrl, fileName) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Navigate to dashboard based on role
    const handleHomeClick = () => {
        if (userRole === 'admin') {
            navigate('/admin');
        } else if (userRole === 'broker') {
            navigate('/broker-dashboard');
        } else if (userRole === 'support') {
            navigate('/support-dashboard');
        } else {
            navigate('/user-dashboard');
        }
    };

    // Image editing functions
    const startDrawing = (e) => {
        if (!imageEditMode || !annotationCanvasRef.current) return;

        const canvas = annotationCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setCurrentAnnotation({
            type: 'drawing',
            points: [{ x, y }],
            color: '#ff0000',
            width: 3
        });
    };

    const draw = (e) => {
        if (!isDrawing || !annotationCanvasRef.current || !currentAnnotation) return;

        const canvas = annotationCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentAnnotation(prev => ({
            ...prev,
            points: [...prev.points, { x, y }]
        }));

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ff0000';

        const points = currentAnnotation.points;
        if (points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (!isDrawing) return;

        setIsDrawing(false);
        if (currentAnnotation) {
            setImageAnnotations([...imageAnnotations, currentAnnotation]);
            setCurrentAnnotation(null);
        }
    };

    const addTextAnnotation = () => {
        const text = prompt('Enter text:');
        if (text) {
            setImageAnnotations([...imageAnnotations, {
                type: 'text',
                text,
                x: 50,
                y: 50,
                color: '#ff0000',
                fontSize: 20
            }]);
        }
    };

    const saveEditedImage = () => {
        if (!annotationCanvasRef.current || !imageCanvasRef.current) return;

        const annotationCanvas = annotationCanvasRef.current;
        const imageCanvas = imageCanvasRef.current;
        const combinedCanvas = document.createElement('canvas');
        const ctx = combinedCanvas.getContext('2d');

        combinedCanvas.width = imageCanvas.width;
        combinedCanvas.height = imageCanvas.height;

        ctx.drawImage(imageCanvas, 0, 0);
        ctx.drawImage(annotationCanvas, 0, 0);

        const dataURL = combinedCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = dataURL;
        link.click();

        toast.success('Image saved successfully');
        setImageEditMode(false);
        setImageAnnotations([]);
    };

    // Filter users based on category, online status, and search
    const filteredUsers = useMemo(() => {
        let result = users;

        if (selectedCategory !== 'all') {
            if (userRole === 'admin') {
                result = result.filter(user => user.userType === selectedCategory);
            } else if (userRole === 'broker') {
                if (selectedCategory === 'clients') {
                    result = result.filter(user => ['tenant', 'leaser', 'buyer', 'seller', 'user'].includes(user.userType));
                } else if (selectedCategory === 'brokers') {
                    result = result.filter(user => user.userType === 'broker');
                }
            } else if (userRole === 'support') {
                if (selectedCategory === 'admins') {
                    result = result.filter(user => user.userType === 'admin');
                } else if (selectedCategory === 'brokers') {
                    result = result.filter(user => user.userType === 'broker');
                } else if (selectedCategory === 'buyers') {
                    result = result.filter(user => user.userType === 'buyer');
                } else if (selectedCategory === 'sellers') {
                    result = result.filter(user => user.userType === 'seller');
                } else if (selectedCategory === 'leasers') {
                    result = result.filter(user => user.userType === 'leaser');
                } else if (selectedCategory === 'renters') {
                    result = result.filter(user => user.userType === 'renter');
                }
            }
        }

        if (showOnlineOnly) {
            result = result.filter((u) => onlineUsers.includes(u.id));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((user) =>
                user.fullName.toLowerCase().includes(query) ||
                (user.email && user.email.toLowerCase().includes(query))
            );
        }

        return result;
    }, [selectedCategory, showOnlineOnly, users, onlineUsers, searchQuery, userRole]);

    // Get user initials and color
    const getInitialsAndColor = (user) => {
        const name = user?.fullName || 'Unknown User';
        const [firstName, lastName] = name.split(' ');
        const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

        const userTypeColors = {
            admin: 'bg-red-500',
            broker: 'bg-purple-500',
            tenant: 'bg-blue-500',
            leaser: 'bg-cyan-500',
            buyer: 'bg-green-500',
            seller: 'bg-yellow-500',
            support: 'bg-orange-500',
            renter: 'bg-pink-500',
            support_agent: 'bg-teal-500',
            default: 'bg-gray-500'
        };

        return {
            initials,
            colorClass: userTypeColors[user?.userType] || userTypeColors.default
        };
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isSelectMode) {
                    clearSelection();
                }
                if (showContextMenu) {
                    setShowContextMenu(false);
                }
                if (showEmojiPicker) {
                    setShowEmojiPicker(false);
                }
                if (showFileModal) {
                    setShowFileModal(false);
                    setIsFullScreenImage(false);
                    setImageEditMode(false);
                }
                if (editingMessageId) {
                    setEditingMessageId(null);
                    setEditingText('');
                }
            }

            if (e.ctrlKey && e.key === 'a' && selectedUser) {
                e.preventDefault();
                selectAllMessages();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSelectMode, selectedUser, showContextMenu, showEmojiPicker, showFileModal, editingMessageId]);

    // Get message style based on sender and theme
    const getMessageStyle = (message) => {
        const isOwn = message.senderId === authUser?.id;
        if (isOwn) {
            return theme === 'dark'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-900';
        }
        return theme === 'dark'
            ? 'bg-gray-700 text-white'
            : 'bg-white text-gray-900 border border-gray-200';
    };

    // Copy button component
    const CopyButton = ({
        onClick,
        isCopied = false,
        size = "sm",
        className = "",
        title = "Copy"
    }) => {
        const sizes = {
            sm: "w-4 h-4",
            md: "w-5 h-5",
            lg: "w-6 h-6"
        };

        return (
            <button
                onClick={onClick}
                disabled={isCopied}
                className={`p-2 rounded-full transition-all duration-300 ${
                    isCopied
                        ? 'text-amber-500 bg-green-100 dark:bg-green-900/30'
                        : theme === 'dark'
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-600'
                } hover:scale-110 ${className}`}
                title={isCopied ? "Copied!" : title}
            >
                {isCopied ? (
                    <svg className={`${sizes[size]} text-amber-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className={`${sizes[size]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                )}
            </button>
        );
    };

    // Typing animation
    const TypingDots = () => (
        <span className="flex items-center gap-0.5">
            <span className="animate-bounce inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
            <span className="animate-bounce inline-block w-2 h-2 bg-gray-500 rounded-full delay-150"></span>
            <span className="animate-bounce inline-block w-2 h-2 bg-gray-500 rounded-full delay-300"></span>
        </span>
    );

    // Render file message
    const renderFileMessage = (message) => {
        if (message.file) {
            return (
                <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 cursor-pointer"
                     onClick={() => handleOpenFile(message.file, message.file_type, message.file_name)}>
                    {getFileIcon(message.file_type || 'other')}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words">{message.file_name || 'File'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {message.file_type || 'File'} • Click to {message.file_type === 'image' ? 'view' : 'download'}
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(message.file, message.file_name);
                        }}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        title="Download file"
                    >
                        <Download size={16} />
                    </button>
                </div>
            );
        }
        return null;
    };

    // Toggle sidebar
    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    // Handle user selection
    const handleUserSelect = (user) => {
        setSelectedUser(user);
        if (isMobile) setShowSidebar(false);
    };

    return (
        <ErrorBoundary>
            <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
                {/* Mobile sidebar toggle */}
                {isMobile && !showSidebar && (
                    <button 
                        onClick={toggleSidebar}
                        className="fixed top-4 left-4 z-40 p-2 bg-amber-500 text-white rounded-full shadow-lg md:hidden"
                    >
                        <Users size={20} />
                    </button>
                )}

                {/* Sidebar */}
                <aside className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative ${sidebarExpanded ? 'w-60' : 'w-20 lg:w-80'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 overflow-y-auto flex flex-col z-30 h-full`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h1 className={`${sidebarExpanded ? 'block' : 'hidden lg:block'} text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent`}>Wubland Chatter</h1>
                            <div className="flex items-center gap-2">
                                {isMobile && (
                                    <button onClick={toggleSidebar} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                )}
                                <button onClick={() => setShowProfile(true)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <User size={20} />
                                </button>
                            </div>
                        </div>
                        {sidebarExpanded && (
                            <div className="mt-4 relative">
                                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className={`w-full pl-10 pr-4 py-2  ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-black placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {sidebarExpanded && userCategories.length > 1 && (
                        <div className="p-3 flex flex-wrap gap-2">
                            {userCategories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-3 py-1  text-sm capitalize ${selectedCategory === category ? 'bg-amber-500 text-white' : theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:bg-opacity-80 transition-colors`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}

                    {sidebarExpanded && (
                        <div className="p-3 flex items-center gap-2">
                            <button
                                onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                                className={`px-3 py-1  text-sm ${showOnlineOnly ? 'bg-amber-500 text-white' : theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:bg-opacity-80 transition-colors`}
                            >
                                Online
                            </button>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                ({onlineUsers.length - (authUser?.id ? 1 : 0)} online)
                            </span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1 p-2">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin h-6 w-6 text-amber-500" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map((user) => {
                                const userId = user.id;
                                const isOnline = onlineUsers.includes(userId);
                                const { initials, colorClass } = getInitialsAndColor(user);
                                const isSelected = selectedUser?.id === userId;

                                return (
                                    <button
                                        key={userId}
                                        onClick={() => handleUserSelect(user)}
                                        className={`w-full p-3 flex items-center gap-3 rounded-xl ${isSelected ? (theme === 'dark' ? 'bg-amber-900' : 'bg-amber-50') : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-all duration-200`}
                                    >
                                        <div className="relative">
                                            {user.profile_pic ? (
                                                <img src={user.profile_pic} alt={user.fullName} className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${colorClass}`}>
                                                    {initials}
                                                </div>
                                            )}
                                            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800" />}
                                        </div>
                                        {sidebarExpanded && (
                                            <div className="text-left flex-1 min-w-0">
                                                <div className={`font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{user.fullName}</div>
                                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {isOnline ? 'online' : 'offline'} • {user.userType}
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedUser ? (
                        <>
                            <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm`}>
                                <div className="flex items-center gap-3">
                                    {isMobile && (
                                        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                            <Users size={20} />
                                        </button>
                                    )}
                                    <div className="relative">
                                        {selectedUser.profile_pic ? (
                                            <img src={selectedUser.profile_pic} alt={selectedUser.fullName} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getInitialsAndColor(selectedUser).colorClass}`}>
                                                {getInitialsAndColor(selectedUser).initials}
                                            </div>
                                        )}
                                        {onlineUsers.includes(selectedUser.id) && <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{selectedUser.fullName}</h3>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {onlineUsers.includes(selectedUser.id) ? 'online' : 'offline'} • {selectedUser.userType}
                                            {isTyping && <span className="ml-1 italic flex items-center gap-0.5"><TypingDots /></span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsSelectMode(!isSelectMode)}
                                        className={`p-2 rounded-full transition-colors ${
                                            isSelectMode
                                                ? 'bg-amber-500 text-white'
                                                : theme === 'dark'
                                                    ? 'hover:bg-gray-700 text-gray-300'
                                                    : 'hover:bg-gray-200 text-gray-600'
                                        }`}
                                        title={isSelectMode ? "Exit selection mode" : "Select messages"}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </button>

                                    <button onClick={logout} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </div>
                            <div ref={messagesContainerRef} 
                                 className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors duration-300 ${
                                 theme === 'dark' 
                                  ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
                                  : 'bg-gradient-to-br from-gray-50 to-gray-100'
                              }`}>
                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-500 dark:text-gray-400">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No messages yet</p>
                                            <p className="text-sm">Start a conversation with {selectedUser.fullName}</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const isOwn = message.senderId === authUser?.id;
                                        const isSelected = selectedMessages.has(message.id);
                                        const isCopied = copiedMessageId === message.id;

                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} relative group`}
                                                onContextMenu={(e) => handleRightClick(e, message.id)}
                                            >
                                                <div
                                                    className={`max-w-[70%] p-3 rounded-xl ${getMessageStyle(message)} shadow-md transition-all duration-200 ${
                                                        isSelected ? 'ring-2 ring-amber-500 ring-opacity-70' : ''
                                                    } ${isSelectMode ? 'cursor-pointer' : ''}`}
                                                    onClick={() => isSelectMode && toggleMessageSelection(message.id)}
                                                >
                                                    {message.file && message.file_type === 'image' ? (
                                                        <div className="mb-2 cursor-pointer" onClick={() => handleOpenFile(message.file, message.file_type, message.file_name)}>
                                                            <img 
                                                                src={message.file} 
                                                                alt={message.file_name || 'Image'} 
                                                                className="max-w-full max-h-48 rounded-lg object-contain"
                                                            />
                                                            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400 break-words">
                                                                {message.file_name || 'Image'}
                                                            </p>
                                                        </div>
                                                    ) : renderFileMessage(message)}

                                                    {message.text && (
                                                        <div className="relative">
                                                            <p className="leading-relaxed pr-6 break-words">{message.text}</p>
                                                            {!isSelectMode && (
                                                                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                    <CopyButton
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            copySingleMessage(message.id, message.text);
                                                                        }}
                                                                        isCopied={isCopied}
                                                                        size="sm"
                                                                        title="Copy message"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className={`text-xs mt-1 flex justify-end ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isOwn && (
                                                            <span className="ml-1">
                                                                {message.status === 'read' ? '✓✓' : '✓'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isSelectMode && (
                                                        <div className={`absolute ${isOwn ? '-left-2' : '-right-2'} top-1/2 transform -translate-y-1/2`}>
                                                            <div className={`w-5 h-5 rounded-full border-2 ${
                                                                isSelected
                                                                    ? 'bg-amber-500 border-amber-500'
                                                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                                                            } flex items-center justify-center`}>
                                                                {isSelected && (
                                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messageEndRef} />

                                {isSelectMode && selectedMessages.size > 0 && (
                                    <div className={`sticky bottom-0 p-3 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t flex items-center justify-between shadow-lg`}>
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {selectedMessages.size} selected
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={copySelectedMessages}
                                                disabled={isCopying}
                                                className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                                                title="Copy selected messages"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </button>

                                            <button
                                                onClick={deleteSelectedMessages}
                                                className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-red-900 text-red-400' : 'hover:bg-red-100 text-red-600'} transition-colors`}
                                                title="Delete selected messages"
                                            >
                                                <Trash size={16} />
                                            </button>

                                            <button
                                                onClick={clearSelection}
                                                className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                                                title="Clear selection"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* File Input Area */}
                            <div 
                                ref={dropZoneRef}
                                className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-t border-gray-200 dark:border-gray-700 flex-shrink-0 relative ${
                                    isDragging ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-900/20' : ''
                                }`}
                            >
                                {isDragging && (
                                    <div className="absolute inset-0 bg-amber-500 bg-opacity-10 flex items-center justify-center rounded-lg z-10">
                                        <div className="text-center p-4">
                                            <Upload size={32} className="mx-auto mb-2 text-amber-600" />
                                            <p className="text-amber-600 font-medium">Drop files here to send</p>
                                        </div>
                                    </div>
                                )}

                                {(filePreview || fileType) && (
                                    <div className="mb-3 flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        {filePreview ? (
                                            <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                                        ) : (
                                            <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded">
                                                {getFileIcon(fileType)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium break-words">{fileName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{fileType}</p>
                                        </div>
                                        <button onClick={removeFile} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSendMessage} className="flex items-center gap-2 flex-wrap" onInput={handleTyping}>
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    >
                                        <Smile size={20} className="text-gray-500 dark:text-gray-400" />
                                    </button>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-20 left-4 z-50">
                                            <EmojiPicker
                                                onEmojiClick={addEmoji}
                                                theme={theme === 'dark' ? 'dark' : 'light'}
                                                width="300px"
                                                height="350px"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        className={`flex-1 p-3 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-black placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors`}
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                    />
                                    <input
                                        type="file"
                                        accept="*/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                        title="Attach file"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selectedUser || (!text.trim() && !fileType)}
                                        className={`p-3 rounded-full ${!selectedUser || (!text.trim() && !fileType) ? 'bg-gray-300 dark:bg-gray-600 text-gray-500' : 'bg-amber-500 text-white hover:bg-amber-600'} transition-colors`}
                                    >
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${
                           theme === 'dark' 
                           ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                          : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50'
                         }`}>
                            <div className="text-center p-8 max-w-md">
                                <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare className="w-10 h-10 text-white" />
                                </div>
                                <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Welcome to Wubland Chatter</h2>
                                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Select a conversation from the sidebar to start chatting</p>
                                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-amber-50'}`}>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-amber-800'}`}><strong>Tip:</strong> Use the search bar to find users quickly</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile Modal */}
                    {showProfile && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className={`rounded-xl p-6 w-96 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                                <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                    Your Profile
                                </h3>
                                <div className="flex items-center gap-4 mb-4">
                                    {authUser?.profile_pic ? (
                                        <img 
                                            src={authUser.profile_pic} 
                                            alt={authUser.fullName} 
                                            className="w-16 h-16 rounded-full object-cover" 
                                        />
                                    ) : (
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold ${getInitialsAndColor(authUser).colorClass}`}>
                                            {getInitialsAndColor(authUser).initials}
                                        </div>
                                    )}
                                    <div>
                                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                            {authUser?.fullName}
                                        </p>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {authUser?.userType}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Dark Mode</span>
                                        <button onClick={toggleTheme} className={`relative inline-flex h-6 w-11 items-center rounded-full ${theme === 'dark' ? 'bg-amber-600' : 'bg-gray-300'} transition-colors`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <button onClick={logout} className="w-full bg-red-500 text-white py-2 rounded-full hover:bg-red-600 transition-colors">
                                        Log Out
                                    </button>
                                    <button onClick={() => setShowProfile(false)} className="w-full bg-gray-300 dark:bg-gray-600 text-black dark:text-white py-2 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Context Menu */}
                    {showContextMenu && (
                        <div
                            ref={contextMenuRef}
                            className="fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2"
                            style={{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }}
                        >
                            <button onClick={() => toggleMessageSelection(contextMessageId)} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded w-full">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Select
                            </button>
                            <button onClick={() => handleEditMessage(contextMessageId, messages.find(msg => msg.id === contextMessageId)?.text || '')} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded w-full">
                                <Edit size={16} /> Edit
                            </button>
                            <button onClick={() => copySingleMessage(contextMessageId, messages.find(msg => msg.id === contextMessageId)?.text || '')} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded w-full">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Copy
                            </button>
                            <button onClick={() => handleDeleteMessage(contextMessageId)} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded w-full text-red-600 dark:text-red-400">
                                <Trash size={16} /> Delete
                            </button>
                        </div>
                    )}

                    {/* File Modal with Image Editing */}
                    {showFileModal && selectedFile && (
                        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                            <div className="relative max-w-4xl max-h-full w-full">
                                {selectedFile.type === 'image' ? (
                                    <div className="relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-white text-lg break-words">{selectedFile.name}</h3>
                                            <div className="flex gap-2 flex-wrap">
                                                {!imageEditMode && (
                                                    <button 
                                                        onClick={() => setImageEditMode(true)}
                                                        className="p-2 bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center gap-2"
                                                    >
                                                        <Edit size={16} /> Edit
                                                    </button>
                                                )}
                                                {imageEditMode && (
                                                    <>
                                                        <button 
                                                            onClick={addTextAnnotation}
                                                            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                                                        >
                                                            <Type size={16} /> Add Text
                                                        </button>
                                                        <button 
                                                            onClick={saveEditedImage}
                                                            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                                                        >
                                                            <Save size={16} /> Save
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => downloadFile(selectedFile.url, selectedFile.name)}
                                                    className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center gap-2"
                                                >
                                                    <Download size={16} /> Download
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setShowFileModal(false);
                                                        setIsFullScreenImage(false);
                                                        setImageEditMode(false);
                                                        setImageAnnotations([]);
                                                    }} 
                                                    className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="relative overflow-auto max-h-[70vh] flex justify-center">
                                            <img 
                                                src={selectedFile.url} 
                                                alt={selectedFile.name} 
                                                className="max-w-full max-h-full object-contain"
                                                ref={imageCanvasRef}
                                            />
                                            
                                            {imageEditMode && (
                                                <canvas
                                                    ref={annotationCanvasRef}
                                                    className="absolute top-0 left-0"
                                                    style={{ 
                                                        cursor: isDrawing ? 'crosshair' : 'default',
                                                        width: imageCanvasRef.current ? imageCanvasRef.current.width : '100%',
                                                        height: imageCanvasRef.current ? imageCanvasRef.current.height : '100%'
                                                    }}
                                                    width={imageCanvasRef.current ? imageCanvasRef.current.width : 0}
                                                    height={imageCanvasRef.current ? imageCanvasRef.current.height : 0}
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseLeave={stopDrawing}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                                        <File size={64} className="mx-auto mb-4 text-gray-400" />
                                        <h3 className="text-lg font-semibold mb-2 break-words">{selectedFile.name}</h3>
                                        <p className="text-gray-500 mb-4">This file type cannot be previewed</p>
                                        <button 
                                            onClick={() => downloadFile(selectedFile.url, selectedFile.name)}
                                            className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
                                        >
                                            Download File
                                        </button>
                                        <button 
                                            onClick={() => setShowFileModal(false)} 
                                            className="ml-2 bg-gray-300 dark:bg-gray-600 text-black dark:text-white px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Edit Message Modal */}
                    {editingMessageId && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className={`rounded-xl p-6 w-96 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                                <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Edit Message</h3>
                                <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className={`w-full p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-black placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors`}
                                    placeholder="Edit your message..."
                                />
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => handleSaveEdit(editingMessageId)}
                                        className="flex-1 bg-amber-500 text-white py-2 rounded-full hover:bg-amber-600 transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingMessageId(null);
                                            setEditingText('');
                                        }}
                                        className="flex-1 bg-gray-300 dark:bg-gray-600 text-black dark:text-white py-2 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default ChatApp;