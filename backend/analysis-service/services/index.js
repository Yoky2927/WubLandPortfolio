// services/index.js
export * from './userData.service.js';
export * from './propertyData.service.js';
export * from './transactionData.service.js';
export * from './todoData.service.js';

// Add fetchServiceData function if not already there
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Service URLs from environment variables
const SERVICES = {
  USER: process.env.USER_SERVICE_URL || "http://localhost:5000",
  PROPERTY: process.env.PROPERTY_SERVICE_URL || "http://localhost:5002",
  TRANSACTION: process.env.TRANSACTION_SERVICE_URL || "http://localhost:5001",
  TODO: process.env.TODO_SERVICE_URL || "http://localhost:5003",
};

// Store for admin token (cached)
let adminToken = null;
let tokenExpiry = null;

// Function to get a valid admin token
export const getAdminToken = async () => {
  // Return cached token if still valid (5 minutes)
  if (adminToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log("📝 Using cached admin token");
    return adminToken;
  }

  try {
    console.log("🔐 Getting new admin token...");

    const loginData = {
      username: process.env.ANALYSIS_SERVICE_USERNAME || "yokabd_admin",
      password: process.env.ANALYSIS_SERVICE_PASSWORD || "Admin@123",
    };

    console.log("Logging in with:", loginData.username);

    const response = await axios.post(
      `${SERVICES.USER}/api/auth/login`,
      loginData,
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data.token) {
      adminToken = response.data.token;
      tokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
      console.log("✅ Admin token obtained successfully");
      return adminToken;
    } else {
      console.error("❌ No token in login response:", response.data);
      throw new Error("No token received from login");
    }
  } catch (error) {
    console.error("❌ Failed to get admin token:", error.message);
    if (error.response) {
      console.error(
        "Login response:",
        error.response.status,
        error.response.data
      );
    }
    throw error;
  }
};

// Helper to fetch data from services
export const fetchServiceData = async (service, endpoint) => {
  try {
    const token = await getAdminToken();
    const url = `${SERVICES[service]}${endpoint}`;

    console.log(`📡 Fetching: ${url}`);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Service-Request": "analysis-service",
      },
      timeout: 15000,
      validateStatus: (status) => status < 500,
    });

    console.log(
      `✅ ${service}: ${response.status} - data received`
    );

    if (response.status === 200) {
      return response.data;
    } else {
      console.warn(
        `⚠️ ${service} returned ${response.status}:`,
        response.data?.message || ""
      );
      return null;
    }
  } catch (error) {
    console.error(`❌ Failed to fetch from ${service}:`, error.message);

    if (error.code === "ECONNREFUSED") {
      console.error(
        `🔌 ${service} service not running at ${SERVICES[service]}`
      );
    } else if (error.response) {
      console.error(
        `📉 ${service} error ${error.response.status}:`,
        error.response.data
      );
    }

    return null;
  }
};

// Helper function to extract array from response
export const extractArrayFromResponse = (response, dataKey) => {
  if (!response) {
    console.log(`🔄 No response received for ${dataKey}`);
    return [];
  }
  
  console.log(`🔍 Extracting ${dataKey} from response:`, JSON.stringify(response, null, 2).substring(0, 500) + '...');
  
  // If response is already an array
  if (Array.isArray(response)) {
    console.log(`✅ ${dataKey}: Response is already array, length: ${response.length}`);
    return response;
  }
  
  // For property service response structure
  if (dataKey === 'properties' && response.data && response.data.properties && Array.isArray(response.data.properties)) {
    console.log(`✅ ${dataKey}: Found in response.data.properties, length: ${response.data.properties.length}`);
    return response.data.properties;
  }
  
  // For user service (might be different structure)
  if (dataKey === 'users' && response.data && Array.isArray(response.data)) {
    console.log(`✅ ${dataKey}: Found in response.data, length: ${response.data.length}`);
    return response.data;
  }
  
  // If response has a data property that's an array
  if (response.data && Array.isArray(response.data)) {
    console.log(`✅ ${dataKey}: Found in response.data, length: ${response.data.length}`);
    return response.data;
  }
  
  // If response has success property with data
  if (response.success && response.data && Array.isArray(response.data)) {
    console.log(`✅ ${dataKey}: Found in success response.data, length: ${response.data.length}`);
    return response.data;
  }
  
  // If dataKey exists directly in response
  if (response[dataKey] && Array.isArray(response[dataKey])) {
    console.log(`✅ ${dataKey}: Found directly in response, length: ${response[dataKey].length}`);
    return response[dataKey];
  }
  
  console.log(`❌ ${dataKey}: Could not find array in response`);
  return [];
};