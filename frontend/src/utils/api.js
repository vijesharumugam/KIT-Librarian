import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://kit-librarian-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth tokens
api.interceptors.request.use(
  (config) => {
    try {
      const url = config.url || '';
      const isAdminEndpoint = typeof url === 'string' && url.startsWith('/api/admin');
      const isStudentEndpoint = typeof url === 'string' && url.startsWith('/api/student');
      
      if (isAdminEndpoint) {
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${adminToken}`;
        }
      } else if (isStudentEndpoint) {
        // For iOS compatibility, also send student token in header as fallback
        const studentToken = localStorage.getItem('studentToken');
        if (studentToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${studentToken}`;
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
      
      console.log('API Interceptor 401:', { url, isAdminEndpoint, userAgent: navigator.userAgent });
      
      if (isAdminEndpoint) {
        localStorage.removeItem('adminToken');
        console.log('API Interceptor: Admin 401, removed token');
        // Don't auto-redirect here - let ProtectedRoute handle it to avoid conflicts
      } else {
        // Student cookie-based session expired
        console.log('API Interceptor: Student 401, redirecting to student login');
        window.location.href = '/student/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
