// frontend/src/utils/profilePicture.js
import { SERVICE_URLS } from './api.endpoints';

// Default profile picture paths
const DEFAULT_PROFILE_PICTURES = {
  admin: '/images/default-admin.png',
  super_admin: '/images/default-admin.png',
  broker: '/images/default-broker.png',
  user: '/images/default-user.png',
  anonymous: '/images/default-anonymous.png'
};

// Generate fallback initials avatar URL
const generateInitialsAvatar = (firstName, lastName, size = 128, background = '4f46e5') => {
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${background}&color=fff&size=${size}&bold=true&rounded=true`;
};

// Main profile picture formatter
export const formatProfilePicture = (user, options = {}) => {
  const {
    forceDefault = false,
    useInitialsFallback = true,
    size = 'medium'
  } = options;

  // If forceDefault or no user, return default
  if (forceDefault || !user) {
    return DEFAULT_PROFILE_PICTURES.anonymous;
  }

  const profilePic = user.profile_picture || user.profilePicture || user.avatar;
  const firstName = user.first_name || user.firstName || '';
  const lastName = user.last_name || user.lastName || '';
  const role = user.role || 'user';

  // 1. Check if profilePic is a valid URL
  if (profilePic && typeof profilePic === 'string' && profilePic.trim()) {
    const cleanPic = profilePic.trim();
    
    // If it's already a full URL, return as-is
    if (cleanPic.startsWith('http://') || cleanPic.startsWith('https://')) {
      return cleanPic;
    }

    // If it's a relative path, prepend user service URL
    if (cleanPic.startsWith('/')) {
      // Remove any ellipsis truncation
      const fixedPic = cleanPic.replace(/\.\.\.$/, '');
      return `${SERVICE_URLS.USER}${fixedPic}`;
    }

    // If it's just a filename, construct proper path
    if (cleanPic.includes('.')) {
      // Remove any ellipsis truncation
      const fixedPic = cleanPic.replace(/\.\.\.$/, '');
      return `${SERVICE_URLS.USER}/Uploads/profile-pictures/${fixedPic}`;
    }
  }

  // 2. Use initials avatar as fallback if enabled
  if (useInitialsFallback && (firstName || lastName)) {
    // Different background colors based on role
    const roleColors = {
      super_admin: 'dc2626', // red
      admin: '059669',       // green
      broker: '7c3aed',      // purple
      user: '4f46e5'         // indigo
    };
    
    const bgColor = roleColors[role] || '4f46e5';
    return generateInitialsAvatar(firstName, lastName, 128, bgColor);
  }

  // 3. Return role-based default image
  return DEFAULT_PROFILE_PICTURES[role] || DEFAULT_PROFILE_PICTURES.user;
};

// Quick utility for just URL formatting (if you have the URL already)
export const formatProfilePictureUrl = (url, user = null) => {
  if (!url || !url.trim()) {
    return formatProfilePicture(user || {});
  }

  const cleanUrl = url.trim();
  
  // Already a full URL
  if (cleanUrl.startsWith('http')) {
    return cleanUrl;
  }

  // Relative path
  if (cleanUrl.startsWith('/')) {
    return `${SERVICE_URLS.USER}${cleanUrl.replace(/\.\.\.$/, '')}`;
  }

  // Filename only
  if (cleanUrl.includes('.')) {
    return `${SERVICE_URLS.USER}/Uploads/profile-pictures/${cleanUrl.replace(/\.\.\.$/, '')}`;
  }

  // Invalid format, fallback to defaults
  return formatProfilePicture(user || {});
};