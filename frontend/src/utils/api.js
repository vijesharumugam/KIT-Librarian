import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://kit-librarian-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include admin auth token only for admin endpoints
api.interceptors.request.use(
  (config) => {
    try {
      const url = config.url || '';
      const isAdminEndpoint = typeof url === 'string' && url.startsWith('/api/admin');
      if (isAdminEndpoint) {
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${adminToken}`;
        }
      }
    } catch (_) {
      // no-op
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors and route-specific redirects
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      const url = error.config?.url || '';
      const isAdminEndpoint = typeof url === 'string' && url.startsWith('/api/admin');
      if (isAdminEndpoint) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      } else {
        // Student cookie-based session expired
        window.location.href = '/student/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
