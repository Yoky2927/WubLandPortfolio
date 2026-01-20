import React, { useState, useEffect, useRef } from 'react';
import { AlertOctagon, X, Clock, AlertTriangle, Bell, Zap, RefreshCw, RotateCcw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { directApi } from '../utils/api.endpoints.js';

const AnnouncementBanner = ({ theme }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dismissed, setDismissed] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [expandedAnnouncement, setExpandedAnnouncement] = useState(null);
    const tickerRef = useRef(null);
    const { addToast } = useToast();

    // Fetch user role from token
    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('🔑 Token exists:', !!token);
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('👤 User role from token:', payload.role);
                setUserRole(payload.role);
            } catch (error) {
                console.error('❌ Error decoding token:', error);
            }
        }
    }, []);

    // Fetch announcements - DEBUG VERSION
    const fetchAnnouncements = async () => {
        try {
            console.log('🔄 Starting to fetch announcements...');
            setLoading(true);
            
            // Get dismissed items from localStorage
            const dismissedItems = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
            console.log('🗑️ Dismissed items:', dismissedItems);
            setDismissed(dismissedItems);
            
            // Fetch public announcements from API
            console.log('📡 Calling directApi.getPublicAnnouncements()...');
            const response = await directApi.getPublicAnnouncements();
            console.log('📥 API Response received:', {
                success: response?.success,
                hasData: Array.isArray(response?.data),
                dataLength: response?.data?.length || 0,
                fullResponse: response
            });
            
            if (response && response.success && Array.isArray(response.data)) {
                const apiAnnouncements = response.data;
                console.log('📊 Raw announcements from API:', apiAnnouncements);
                
                if (apiAnnouncements.length === 0) {
                    console.log('⚠️ API returned empty array - no active announcements');
                }
                
                // Filter only by dismissed items (backend already filters status/expiration)
                const filteredAnnouncements = apiAnnouncements.filter(ann => {
                    const isDismissed = dismissedItems.includes(ann.id);
                    if (isDismissed) {
                        console.log(`➖ Filtering out dismissed announcement: ${ann.id} - "${ann.title}"`);
                    }
                    return !isDismissed;
                });
                
                console.log('✅ Final announcements to display:', filteredAnnouncements);
                setAnnouncements(filteredAnnouncements);
                
                // Log each announcement's details
                filteredAnnouncements.forEach((ann, index) => {
                    console.log(`📋 Announcement ${index + 1}:`, {
                        id: ann.id,
                        title: ann.title,
                        status: ann.status,
                        expires_at: ann.expires_at,
                        scheduled_for: ann.scheduled_for,
                        is_urgent: ann.is_urgent,
                        priority: ann.priority
                    });
                });
            } else {
                console.log('❌ API response format error or no data');
                console.log('Response was:', response);
                setAnnouncements([]);
            }
            
        } catch (error) {
            console.error('❌ Error fetching announcements:', {
                message: error.message,
                stack: error.stack,
                fullError: error
            });
            setAnnouncements([]);
            addToast('Failed to load announcements', 'error', 3000);
        } finally {
            setLoading(false);
            console.log('🏁 Fetch completed, loading:', false);
        }
    };

    useEffect(() => {
        console.log('🎬 AnnouncementBanner mounted');
        fetchAnnouncements();
        
        // Set up refresh interval (every 2 minutes for debugging)
        const interval = setInterval(() => {
            console.log('⏰ Auto-refreshing announcements...');
            fetchAnnouncements();
        }, 120000);
        
        return () => {
            console.log('🧹 AnnouncementBanner unmounting');
            clearInterval(interval);
        };
    }, []);

    const dismissAnnouncement = (id) => {
        console.log(`🚫 Dismissing announcement ${id}`);
        const newDismissed = [...dismissed, id];
        setDismissed(newDismissed);
        localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
        setAnnouncements(prev => {
            const filtered = prev.filter(ann => ann.id !== id);
            console.log(`📉 Announcements after dismissal:`, filtered.length);
            return filtered;
        });
        addToast('Announcement dismissed', 'info', 2000);
    };

    const clearDismissed = () => {
        console.log('🔄 Clearing all dismissed announcements');
        localStorage.removeItem('dismissedAnnouncements');
        setDismissed([]);
        fetchAnnouncements();
        addToast('All announcements restored', 'success', 3000);
    };

    const dismissAll = () => {
        console.log(`🚫 Dismissing all ${announcements.length} announcements`);
        const allIds = announcements.map(ann => ann.id);
        const newDismissed = [...dismissed, ...allIds];
        setDismissed(newDismissed);
        localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
        setAnnouncements([]);
        addToast('All announcements dismissed', 'info', 2000);
    };

    const getPriorityColor = (priority, isUrgent) => {
        if (isUrgent) return 'from-red-600 to-orange-500';
        switch (priority) {
            case 'urgent': return 'from-red-500 to-orange-500';
            case 'high': return 'from-orange-500 to-amber-500';
            case 'normal': return 'from-blue-600 to-cyan-500';
            case 'low': return 'from-green-500 to-emerald-500';
            default: return 'from-blue-600 to-cyan-500';
        }
    };

    const getPriorityIcon = (priority, isUrgent) => {
        if (isUrgent) return <AlertOctagon className="w-4 h-4" />;
        switch (priority) {
            case 'urgent': return <AlertOctagon className="w-4 h-4" />;
            case 'high': return <AlertTriangle className="w-4 h-4" />;
            case 'normal': return <Bell className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    // Add a test function to manually create announcements
    const createTestAnnouncement = async () => {
        try {
            console.log('🧪 Creating test announcement...');
            const response = await fetch('http://localhost:5001/api/announcements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title: 'TEST: Announcement Banner Working',
                    message: 'This is a test announcement to verify the banner component is working correctly.',
                    priority: 'normal',
                    target: 'all_users',
                    status: 'active'
                })
            });
            const data = await response.json();
            console.log('🧪 Test announcement created:', data);
            if (data.success) {
                addToast('Test announcement created', 'success', 3000);
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('❌ Error creating test announcement:', error);
        }
    };

    console.log('🎯 Render - announcements:', announcements.length, 'loading:', loading);

    // If no announcements, show minimal panel with test button
    if (announcements.length === 0) {
        return (
            <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-gray-100/90'} backdrop-blur-sm border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} shadow-sm`}>
                <div className="container mx-auto">
                    <div className="flex items-center justify-between px-4 py-1.5">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <Bell className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                No active announcements
                            </span>
                            
                            {/* Test button for debugging */}
                            {userRole === 'super_admin' && (
                                <button
                                    onClick={createTestAnnouncement}
                                    className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${theme === 'dark' 
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                        : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                                    title="Create test announcement"
                                >
                                    <Zap className="w-3 h-3" />
                                    Test
                                </button>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                            {dismissed.length > 0 && (
                                <button
                                    onClick={clearDismissed}
                                    className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${theme === 'dark' 
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                        : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                                    title="Restore dismissed announcements"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Restore
                                </button>
                            )}
                            
                            <button
                                onClick={fetchAnnouncements}
                                className={`p-1 rounded ${theme === 'dark' 
                                    ? 'hover:bg-gray-700 text-gray-400' 
                                    : 'hover:bg-gray-100 text-gray-500'}`}
                                title="Refresh"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="sticky top-0 z-40">
            {announcements.map((announcement) => {
                const isUrgent = announcement.is_urgent || announcement.priority === 'urgent';
                const isExpanded = expandedAnnouncement === announcement.id;
                
                return (
                    <div
                        key={announcement.id}
                        className={`p-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${isUrgent ? 'animate-pulse' : ''}`}
                        style={{
                            background: isUrgent 
                                ? 'linear-gradient(90deg, rgba(220, 38, 38, 0.1), rgba(234, 88, 12, 0.1))'
                                : theme === 'dark'
                                    ? 'linear-gradient(90deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))'
                                    : 'linear-gradient(90deg, rgba(241, 245, 249, 0.9), rgba(226, 232, 240, 0.9))'
                        }}
                    >
                        <div className="container mx-auto px-2">
                            {/* Header - always visible with marquee */}
                            <div className="flex items-center justify-between gap-2">
                                {/* Priority badge */}
                                <div className={`px-2 py-1 rounded-lg bg-gradient-to-r ${getPriorityColor(announcement.priority, announcement.is_urgent)} text-white flex items-center gap-1.5 shrink-0 z-10`}>
                                    {getPriorityIcon(announcement.priority, announcement.is_urgent)}
                                    <span className="text-xs font-medium">
                                        {announcement.priority?.toUpperCase()}
                                    </span>
                                </div>
                                
                                {/* Marquee ticker - Scrolls horizontally */}
                                <div 
                                    className="flex-1 min-w-0 overflow-hidden hide-scrollbar cursor-pointer"
                                    onClick={() => setExpandedAnnouncement(isExpanded ? null : announcement.id)}
                                >
                                    <div className="animate-marquee whitespace-nowrap hover:pause">
                                        <span className={`text-sm font-semibold mr-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {announcement.title}
                                        </span>
                                        <span className={`text-xs mr-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {announcement.message.substring(0, 100)}
                                            {announcement.message.length > 100 ? '...' : ''}
                                        </span>
                                        {announcement.expires_at && (
                                            <span className={`text-xs mr-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <Clock className="inline w-3 h-3 mr-1" />
                                                Until: {new Date(announcement.expires_at).toLocaleDateString()}
                                            </span>
                                        )}
                                        {announcement.is_urgent && (
                                            <span className={`text-xs font-bold mr-8 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
                                                <Zap className="inline w-3 h-3 mr-1" />
                                                URGENT
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex items-center gap-1 shrink-0 z-10">
                                    <button
                                        onClick={() => setExpandedAnnouncement(isExpanded ? null : announcement.id)}
                                        className={`p-1 rounded ${theme === 'dark' 
                                            ? 'hover:bg-white/10 text-gray-300' 
                                            : 'hover:bg-black/10 text-gray-700'}`}
                                        title={isExpanded ? "Collapse" : "Expand for details"}
                                    >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    
                                    {userRole === 'super_admin' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`/super-admin-dashboard?edit=${announcement.id}`, '_blank');
                                            }}
                                            className={`p-1 rounded ${theme === 'dark' 
                                                ? 'hover:bg-white/10 text-gray-300' 
                                                : 'hover:bg-black/10 text-gray-700'}`}
                                            title="Edit announcement"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dismissAnnouncement(announcement.id);
                                        }}
                                        className={`p-1 rounded ${theme === 'dark' 
                                            ? 'hover:bg-white/10 text-gray-300' 
                                            : 'hover:bg-black/10 text-gray-700'}`}
                                        title="Dismiss announcement"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Expandable content */}
                            {isExpanded && (
                                <div className="mt-2 pt-2 border-t border-white/10">
                                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}>
                                        <h4 className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {announcement.title}
                                        </h4>
                                        <p className={`text-sm whitespace-pre-line ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {announcement.message}
                                        </p>
                                        
                                        {/* Additional info */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {announcement.target && (
                                                <span className={`px-2 py-1 text-xs rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                                    👥 Target: {announcement.target.replace('_', ' ')}
                                                </span>
                                            )}
                                            
                                            {announcement.expires_at && (
                                                <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${theme === 'dark' ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    Expires: {new Date(announcement.expires_at).toLocaleString()}
                                                </span>
                                            )}
                                            
                                            {announcement.scheduled_for && (
                                                <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    Scheduled: {new Date(announcement.scheduled_for).toLocaleString()}
                                                </span>
                                            )}
                                            
                                            {announcement.is_urgent && (
                                                <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
                                                    <Zap className="w-3 h-3" />
                                                    URGENT
                                                </span>
                                            )}
                                            
                                            <span className={`px-2 py-1 text-xs rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                                Priority: {announcement.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Control bar */}
            <div className={`${theme === 'dark' ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="container mx-auto px-2">
                    <div className="flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {announcements.length} active announcement{announcements.length !== 1 ? 's' : ''}
                            </span>
                            
                            {dismissed.length > 0 && (
                                <button
                                    onClick={clearDismissed}
                                    className={`text-xs ${theme === 'dark' ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}
                                >
                                    {dismissed.length} dismissed
                                </button>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={dismissAll}
                                className={`text-xs flex items-center gap-0.5 ${theme === 'dark' 
                                    ? 'text-gray-400 hover:text-gray-300' 
                                    : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                <X className="w-3 h-3" />
                                Dismiss all
                            </button>
                            
                            <button
                                onClick={fetchAnnouncements}
                                className={`p-0.5 rounded ${theme === 'dark' 
                                    ? 'hover:bg-gray-800 text-gray-400' 
                                    : 'hover:bg-gray-100 text-gray-500'}`}
                                title="Refresh"
                            >
                                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            
                            {/* Debug button */}
                            <button
                                onClick={() => {
                                    console.log('🔍 Current state:', {
                                        announcements,
                                        dismissed,
                                        userRole,
                                        loading
                                    });
                                }}
                                className={`p-0.5 rounded ${theme === 'dark' 
                                    ? 'hover:bg-gray-800 text-gray-400' 
                                    : 'hover:bg-gray-100 text-gray-500'}`}
                                title="Debug info"
                            >
                                <span className="text-xs">🔍</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementBanner;