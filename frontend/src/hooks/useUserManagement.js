// frontend/src/hooks/useUserManagement.js - UPDATED VERSION
import { useState, useCallback } from 'react';
import { apiCall, api } from '../utils/api.endpoints'; // Use apiCall instead of httpClient

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all users - USING apiCall
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching users from API...');
      
      // Use apiCall instead of direct httpClient
      const response = await apiCall('GET_USERS');
      
      console.log('✅ Users fetched successfully:', response);
      
      // The response is the array directly (as seen in your API test)
      if (Array.isArray(response)) {
        setUsers(response);
        return response;
      } else if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
        return response.data;
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setUsers([]);
        return [];
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch pending verifications - NEW FUNCTION
  const fetchPendingVerifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching pending verifications...');
      
      const response = await apiCall('GET_PENDING_USER_VERIFICATIONS');
      
      console.log('✅ Pending verifications:', response);
      
      if (Array.isArray(response)) {
        setPendingVerifications(response);
        return response;
      } else if (response.data && Array.isArray(response.data)) {
        setPendingVerifications(response.data);
        return response.data;
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setPendingVerifications([]);
        return [];
      }
    } catch (err) {
      console.error('❌ Error fetching pending verifications:', err);
      setError(err.message || 'Failed to fetch pending verifications');
      setPendingVerifications([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get user documents - NEW FUNCTION
  const getUserDocuments = useCallback(async (userId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching documents for user ${userId}...`);
      
      const response = await apiCall('GET_USER_DOCUMENTS_BY_ID', { id: userId });
      
      console.log('✅ User documents:', response);
      return response;
    } catch (err) {
      console.error(`❌ Error fetching documents for user ${userId}:`, err);
      setError(err.message || 'Failed to fetch user documents');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Approve/Reject verification - NEW FUNCTION
  const approveUserVerification = useCallback(async (userId, status, reason, documentVerifications = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔄 ${status === 'approved' ? 'Approving' : 'Rejecting'} verification for user ${userId}`);
      
      const response = await apiCall('APPROVE_USER_VERIFICATION', 
        { id: userId }, 
        { 
          method: 'PUT', 
          data: { 
            status, 
            reason,
            ...(documentVerifications ? { document_verifications: documentVerifications } : {})
          } 
        }
      );
      
      console.log(`✅ Verification ${status} for user ${userId}:`, response);
      return response;
    } catch (err) {
      console.error(`❌ Error ${status === 'approved' ? 'approving' : 'rejecting'} verification:`, err);
      setError(err.message || `Failed to ${status} verification`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create user - USING apiCall
  const createUser = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📤 Creating user:', userData);
      
      const response = await apiCall('CREATE_USER', {}, 
        { 
          method: 'POST', 
          data: userData,
          headers: {
            'x-confirm': 'true' // Add confirmation header for client roles
          }
        }
      );
      
      console.log('✅ User created response:', response);
      
      // Check for warning (client role confirmation)
      if (response.warning) {
        return { 
          warning: true, 
          message: response.message || 'Confirmation required',
          data: response,
          role: response.role
        };
      }

      if (response.success || response.data?.id || response.id) {
        await fetchUsers(); // Refresh users list
        return { 
          success: true, 
          data: response.data || response,
          password_change_required: response.password_change_required,
          email_verification_sent: response.email_verification_sent,
          is_verified: response.is_verified
        };
      }
      
      return { 
        success: false, 
        message: response.message || 'Unknown error' 
      };
    } catch (err) {
      console.error('❌ Error creating user:', err);
      setError(err.message || 'Failed to create user');
      return { 
        success: false, 
        message: err.message || 'Failed to create user'
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  // Update user - USING apiCall
  const updateUser = useCallback(async (userId, updates) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔄 Updating user ${userId}:`, updates);
      
      let response;
      
      // Update role
      if (updates.role !== undefined) {
        response = await apiCall('UPDATE_USER_ROLE', 
          { id: userId }, 
          { 
            method: 'PUT', 
            data: { 
              role: updates.role,
              broker_type: updates.broker_type,
              privilege_tier: updates.privilege_tier
            } 
          }
        );
      }
      
      // Update status
      if (updates.status !== undefined) {
        response = await apiCall('UPDATE_USER_STATUS', 
          { id: userId }, 
          { 
            method: 'PUT', 
            data: { status: updates.status } 
          }
        );
      }
      
      console.log('✅ User updated:', response);
      
      await fetchUsers(); // Refresh users list
      return { success: true, data: response };
    } catch (err) {
      console.error('❌ Error updating user:', err);
      setError(err.message || 'Failed to update user');
      return { 
        success: false, 
        message: err.message || 'Failed to update user'
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  // Delete user - USING apiCall
  const deleteUser = useCallback(async (userId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🗑️ Deleting user ${userId}`);
      
      const response = await apiCall('DELETE_USER', 
        { id: userId }, 
        { method: 'DELETE' }
      );
      
      console.log('✅ User deleted:', response);
      
      await fetchUsers(); // Refresh users list
      return { success: true };
    } catch (err) {
      console.error('❌ Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
      return { 
        success: false, 
        message: err.message || 'Failed to delete user'
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  // Get user counts - NEW FUNCTION
  const getUserCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching user counts...');
      
      const response = await apiCall('GET_USER_COUNTS');
      
      console.log('✅ User counts:', response);
      return response;
    } catch (err) {
      console.error('❌ Error fetching user counts:', err);
      setError(err.message || 'Failed to fetch user counts');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    users,
    pendingVerifications,
    isLoading,
    error,
    
    // User management functions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    setUsers,
    
    // Verification management functions
    fetchPendingVerifications,
    getUserDocuments,
    approveUserVerification,
    
    // Additional functions
    getUserCounts,
    clearError
  };
};