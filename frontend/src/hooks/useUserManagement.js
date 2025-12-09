import { useState, useCallback } from 'react';
import { httpClient } from '../services/http.service';
import { API_CONFIG } from '../config/api.config';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await httpClient.get(API_CONFIG.ENDPOINTS.USERS);
      
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Invalid users data format:', response.data);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create user
  const createUser = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const payload = {
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        privilege_tier: userData.privilege_tier,
        phone: userData.phone,
        ...(userData.role.includes('broker') && { broker_type: userData.broker_type })
      };

      const response = await httpClient.post(
        API_CONFIG.ENDPOINTS.CREATE_USER,
        payload
      );

      if (response.data.warning) {
        // Handle warning (duplicate email, etc.)
        return { warning: true, message: response.data.message, data: response.data };
      }

      if (response.data.success) {
        await fetchUsers(); // Refresh users list
        return { success: true, data: response.data };
      }

      return { success: false, message: response.data.message || 'Unknown error' };
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  // Update user role/status
  const updateUser = useCallback(async (userId, updates) => {
    try {
      setIsLoading(true);
      setError(null);

      // Update role if changed
      if (updates.role) {
        const roleResponse = await httpClient.put(API_CONFIG.ENDPOINTS.UPDATE_ROLE, {
          userId,
          newRole: updates.role,
          privilege_tier: updates.privilege_tier,
          ...(updates.role.includes('broker') && { broker_type: updates.broker_type })
        });

        if (!roleResponse.data.success) {
          throw new Error(roleResponse.data.message || 'Failed to update role');
        }
      }

      // Update status if changed
      if (updates.status) {
        const statusResponse = await httpClient.put(
          API_CONFIG.ENDPOINTS.USER_STATUS.replace('{id}', userId),
          { status: updates.status }
        );

        if (!statusResponse.data.success) {
          throw new Error(statusResponse.data.message || 'Failed to update status');
        }
      }

      await fetchUsers(); // Refresh users list
      return { success: true };
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  // Delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      setIsLoading(true);
      setError(null);

      await httpClient.delete(
        API_CONFIG.ENDPOINTS.USERS + '/' + userId
      );

      await fetchUsers(); // Refresh users list
      return { success: true };
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    setUsers
  };
};