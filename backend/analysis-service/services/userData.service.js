import { fetchData } from '../utils/axiosClient.js';

export const getUserData = async (token) => {
  try {
    const users = await fetchData('USER', '/api/users', token);
    return users;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const getUserStatistics = async (token) => {
  const users = await getUserData(token);
  
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const verifiedUsers = users.filter(u => u.verified).length;
  
  // Count by role
  const roleCounts = {};
  users.forEach(user => {
    roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
  });
  
  return {
    totalUsers,
    activeUsers,
    verifiedUsers,
    roleCounts,
    usersLast7Days: users.filter(u => {
      const userDate = new Date(u.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return userDate > sevenDaysAgo;
    }).length
  };
};