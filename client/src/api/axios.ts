import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// Base API URL - points to backend server
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Flag to prevent duplicate 401 redirects
let isRedirecting = false;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - logout user (prevent duplicate redirects)
          if (!isRedirecting) {
            isRedirecting = true;
            localStorage.removeItem('token');
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden - show access denied
          toast.error('Access denied. You do not have permission.');
          break;
          
        case 404:
          // Not found
          toast.error('Resource not found.');
          break;
          
        case 500:
          // Server error
          toast.error(data.message || 'Internal server error. Please try again later.');
          break;
          
        default:
          // Other errors
          toast.error(data.message || 'An error occurred. Please try again.');
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your internet connection.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
