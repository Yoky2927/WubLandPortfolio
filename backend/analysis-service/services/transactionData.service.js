import { fetchData } from '../utils/axiosClient.js';

export const getTransactionData = async (token) => {
  try {
    const transactions = await fetchData('TRANSACTION', '/api/transactions', token);
    return transactions;
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw error;
  }
};

export const getTransactionStatistics = async (token) => {
  const transactions = await getTransactionData(token);
  
  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  
  const totalRevenue = completedTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  // Revenue by month (last 6 months)
  const monthlyRevenue = {};
  const now = new Date();
  
  completedTransactions.forEach(transaction => {
    const date = new Date(transaction.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!monthlyRevenue[monthKey]) {
      monthlyRevenue[monthKey] = 0;
    }
    
    monthlyRevenue[monthKey] += parseFloat(transaction.amount) || 0;
  });
  
  return {
    totalTransactions: transactions.length,
    completedTransactions: completedTransactions.length,
    pendingTransactions: pendingTransactions.length,
    totalRevenue,
    monthlyRevenue
  };
};