import axios from 'axios';
import { SERVICES } from '../config/service.config.js';

// Cache for service-to-service calls
const responseCache = new Map();

export const fetchData = async (service, endpoint, token, useCache = true) => {
  const cacheKey = `${service}-${endpoint}`;
  
  // Check cache first
  if (useCache && responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      return cached.data;
    }
  }
  
  try {
    const url = `${SERVICES[service]}${endpoint}`;
    const config = {
      headers: {
        Authorization: token,
        'X-Service-Request': 'analysis-service'
      },
      timeout: 10000 // 10 second timeout
    };
    
    const response = await axios.get(url, config);
    
    // Cache the response
    if (useCache) {
      responseCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch from ${service}:`, error.message);
    
    // Return empty array without mock data
    return [];
  }
};

export const fetchMultiple = async (requests, token) => {
  try {
    const results = await Promise.allSettled(
      requests.map(({ service, endpoint, useCache = true }) => 
        fetchData(service, endpoint, token, useCache)
      )
    );
    
    return results.map((result, index) => ({
      service: requests[index].service,
      data: result.status === 'fulfilled' ? result.value : [],
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  } catch (error) {
    console.error('Error fetching multiple services:', error);
    throw error;
  }
};

export const clearCache = () => {
  responseCache.clear();
};