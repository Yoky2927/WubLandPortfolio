import { fetchData } from '../utils/axiosClient.js';

export const getPropertyData = async (token) => {
  try {
    const properties = await fetchData('PROPERTY', '/api/properties', token);
    return properties;
  } catch (error) {
    console.error('Error fetching property data:', error);
    throw error;
  }
};

export const getPropertyStatistics = async (token) => {
  const properties = await getPropertyData(token);
  
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === 'available').length;
  const soldProperties = properties.filter(p => p.status === 'sold').length;
  const rentedProperties = properties.filter(p => p.status === 'rented').length;
  
  // Property type distribution
  const typeDistribution = {};
  properties.forEach(property => {
    typeDistribution[property.type] = (typeDistribution[property.type] || 0) + 1;
  });
  
  // Total property value
  const totalValue = properties.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
  
  return {
    totalProperties,
    availableProperties,
    soldProperties,
    rentedProperties,
    typeDistribution,
    totalValue,
    averagePrice: totalProperties > 0 ? totalValue / totalProperties : 0
  };
};