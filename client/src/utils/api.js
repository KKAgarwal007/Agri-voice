import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('agri_token');
  }
  return null;
};

// Get current user from localStorage
export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('agri_user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

// Check if user is authenticated (including guest users)
export const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  return !!token || (user && user.isGuest);
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add session ID for activity tracking
  if (typeof window !== 'undefined') {
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    config.headers['X-Session-ID'] = sessionStorage.getItem('session_id');
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('agri_token');
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const logout = () => {
  localStorage.removeItem('agri_token');
  localStorage.removeItem('agri_user');
};

export const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (updates) => {
  const response = await api.put('/auth/profile', updates);
  if (response.data.user) {
    localStorage.setItem('agri_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// ==================== CROP API ====================
export const searchCrops = async (query) => {
  const response = await api.get('/crop-search', { params: { query } });
  return response.data;
};

export const getCropDetails = async (id) => {
  const response = await api.get(`/crop/${id}`);
  return response.data;
};

// ==================== WEATHER API ====================
export const getWeather = async (lat, lon, city) => {
  const params = {};
  if (lat && lon) {
    params.lat = lat;
    params.lon = lon;
  } else if (city) {
    params.city = city;
  }
  const response = await api.get('/weather', { params });
  return response.data;
};

// ==================== NEWS API ====================
export const getNews = async () => {
  const response = await api.get('/news');
  return response.data;
};

// ==================== GEMINI AI API ====================
export const sendChatMessage = async (message, history = []) => {
  const response = await api.post('/gemini/chat', { message, history });
  return response.data;
};

export const analyzeImage = async (imageFile, message = '') => {
  const formData = new FormData();
  formData.append('image', imageFile);
  if (message) {
    formData.append('message', message);
  }
  
  const response = await api.post('/gemini/analyze-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ==================== ACTIVITY API ====================
export const getActivities = async () => {
  const response = await api.get('/activities');
  return response.data;
};

export const getChatHistory = async () => {
  const response = await api.get('/chat-history');
  return response.data;
};

export default api;
