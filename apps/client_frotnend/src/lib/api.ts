import { envs } from '@/constants/envs';
import type { User } from '@/store/useAppStore';
import axios from 'axios';

const API_BASE_URL = envs().BACKEND_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('swipx-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('swipx-token');
      localStorage.removeItem('swipx-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (userData: User) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  login: async (credentials: {
    email: string,
    password: string
  }) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    localStorage.removeItem('swipx-token');
    localStorage.removeItem('swipx-user');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfile: async (profileData: any) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/api/auth/stats');
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Backend health check failed:', error);
    throw error;
  }
};

export default api;
