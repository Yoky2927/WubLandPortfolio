import axios from 'axios';

// Base URL for analysis service
const ANALYSIS_API_BASE = 'http://localhost:3004/api/analysis';
const USER_API_BASE = 'http://localhost:3001/api/user';

// Get token from localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Get user info from localStorage
const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// Create axios instance with default config
const apiClient = axios.create({
    timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403 || error.response?.status === 401) {
            // Token expired or invalid - clear and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login-register';
        }
        return Promise.reject(error);
    }
);

// Analysis Service API
export const analysisAPI = {
    // Dashboard
    getDashboard: (startDate, endDate) => {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return apiClient.get(`${ANALYSIS_API_BASE}/dashboard`, { params });
    },

    // Sales Report
    getSalesReport: (startDate, endDate, format = 'json') => {
        const params = { format };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return apiClient.get(`${ANALYSIS_API_BASE}/reports/sales`, { 
            params,
            responseType: format === 'pdf' ? 'blob' : 'json'
        });
    },

    // Rental Report
    getRentalReport: (startDate, endDate, format = 'json') => {
        const params = { format };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return apiClient.get(`${ANALYSIS_API_BASE}/reports/rental`, { 
            params,
            responseType: format === 'pdf' ? 'blob' : 'json'
        });
    },

    // User Activity Report
    getUserActivityReport: (startDate, endDate, format = 'json') => {
        const params = { format };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return apiClient.get(`${ANALYSIS_API_BASE}/reports/user-activity`, { 
            params,
            responseType: format === 'pdf' ? 'blob' : 'json'
        });
    },

    // Get all reports
    getAllReports: (type, limit = 50, offset = 0) => {
        const params = { limit, offset };
        if (type) params.type = type;
        return apiClient.get(`${ANALYSIS_API_BASE}/reports`, { params });
    },

    // Get report by ID
    getReportById: (id, format = 'json') => {
        return apiClient.get(`${ANALYSIS_API_BASE}/reports/${id}`, { 
            params: { format },
            responseType: format === 'pdf' ? 'blob' : 'json'
        });
    },

    // Delete report
    deleteReport: (id) => {
        return apiClient.delete(`${ANALYSIS_API_BASE}/reports/${id}`);
    },
};

// User Service API
export const userAPI = {
    login: async (email, password) => {
        const response = await axios.post(`${USER_API_BASE}/login`, { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            // Decode token to get user info (simple base64 decode)
            try {
                const payload = JSON.parse(atob(response.data.token.split('.')[1]));
                localStorage.setItem('user', JSON.stringify({ 
                    id: payload.id, 
                    role: payload.role 
                }));
            } catch (e) {
                console.error('Error parsing token:', e);
            }
        }
        return response;
    },

    register: (email, password, role) => {
        return axios.post(`${USER_API_BASE}/register`, { email, password, role });
    },
};

// Helper to download PDF
export const downloadPDF = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export { getToken, getUser };
export default apiClient;

