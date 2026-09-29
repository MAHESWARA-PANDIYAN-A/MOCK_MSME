import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';
export const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mock_udyam_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized and not already on login page
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register') && !path.includes('/verify')) {
        localStorage.removeItem('mock_udyam_token');
        localStorage.removeItem('mock_udyam_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
