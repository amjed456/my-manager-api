import axios from 'axios';

// Extend the axios config interface to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// Update this URL to your Render deployment URL
// Add /api to the base URL if not included
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://my-manager-api-8xme.onrender.com/api';

// Token retrieval utility for mobile compatibility
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try localStorage first
    let token = localStorage.getItem('token');
    if (token) {
      return token;
    }
    
    // Fallback to sessionStorage
    token = sessionStorage.getItem('token');
    if (token) {
      // Try to restore to localStorage
      try {
        localStorage.setItem('token', token);
      } catch (e) {
        // localStorage might be disabled or full
      }
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Optimized timeout settings
  timeout: 15000,  // Reduced from 30s to 15s for better UX
  
  // Performance optimizations
  maxRedirects: 3,
  maxContentLength: 50 * 1024 * 1024, // 50MB max response size
  maxBodyLength: 10 * 1024 * 1024,    // 10MB max request size
  
  // Connection optimizations - treat 4xx and 5xx as errors
  validateStatus: (status) => status >= 200 && status < 300, // Only treat 2xx as success
});

// Request interceptor for adding auth token and performance optimization
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    
    // Debug ALL requests to see what's happening
    console.log('=== API REQUEST DEBUG ===');
    console.log('Full URL:', (config.baseURL || '') + (config.url || ''));
    console.log('Method:', config.method?.toUpperCase());
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    console.log('Auth token present:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No auth token available for request to:', config.url);
    }
    
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors and performance monitoring
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - (response.config.metadata?.startTime || 0);
    
    // Debug successful responses
    console.log('=== API RESPONSE DEBUG ===');
    console.log('Status:', response.status);
    console.log('URL:', response.config.url);
    console.log('Data:', response.data);
    console.log('Duration:', duration + 'ms');
    
    // Log slow requests (over 2 seconds)
    if (duration > 2000) {
      console.warn(`Slow API request: ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Calculate request duration for failed requests
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
    
    // Network error or timeout
    if (error.code === 'ECONNABORTED') {
      console.error(`Request timeout after ${duration}ms. Server might be starting up if using Render free tier.`);
      if (typeof window !== 'undefined') {
        // Show user-friendly message for timeouts
        const message = duration > 10000 
          ? 'Server is taking longer than usual to respond. Please wait and try again.'
          : 'Request timed out. Please check your connection and try again.';
        alert(message);
      }
    } else if (!error.response) {
      console.error('Network error:', error.message);
      if (typeof window !== 'undefined') {
        alert('Network error: Unable to connect to the server. Please check your internet connection.');
      }
    } else if (error.response) {
      // The request was made and the server responded with an error status
      if (error.response.status === 401) {
        console.error('Authentication error:', error.response.data);
        // Clear token if it's expired or invalid
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            console.log('Cleared invalid tokens from both storages');
          } catch (e) {
            console.error('Error clearing tokens:', e);
          }
        }
      } else if (error.response.status === 403) {
        console.error('Authorization error:', error.response.data);
        console.log('Current user lacks permission for this resource');
      } else if (error.response.status === 502 || error.response.status === 503) {
        console.error('Server unavailable. May be starting up if on free tier.');
        if (typeof window !== 'undefined') {
          alert('Server is currently unavailable. If using Render free tier, it may take 30-60 seconds to start up. Please try again shortly.');
        }
      } else if (error.response.status >= 500) {
        console.error('Server error:', error.response.status, error.response.data);
        if (typeof window !== 'undefined') {
          alert('Server error occurred. Please try again later.');
        }
      }
      
      // Log slow failed requests
      if (duration > 2000) {
        console.warn(`Slow failed API request: ${error.config?.method?.toUpperCase()} ${error.config?.url} took ${duration}ms`);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 