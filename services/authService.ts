import api from './api';

// Types
export interface UserRegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface UserLoginData {
  username: string;
  password: string;
}

export interface UserData {
  _id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  token: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  profilePicture?: string;
  preferences?: {
    darkMode: boolean;
    notifications: boolean;
  };
}

export interface UpdateProfileData {
  name?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  preferences?: {
    darkMode: boolean;
    notifications: boolean;
  };
}

// Token storage utilities for mobile compatibility
const TokenStorage = {
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('token', token);
      console.log('Token stored successfully in localStorage');
      
      // Also store in sessionStorage as backup for mobile
      sessionStorage.setItem('token', token);
      console.log('Token also stored in sessionStorage as backup');
    } catch (error) {
      console.error('Failed to store token:', error);
      // If localStorage fails, try sessionStorage only
      try {
        sessionStorage.setItem('token', token);
        console.log('Token stored in sessionStorage as fallback');
      } catch (sessionError) {
        console.error('Failed to store token in sessionStorage:', sessionError);
      }
    }
  },
  
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      // Try localStorage first
      let token = localStorage.getItem('token');
      if (token) {
        console.log('Token retrieved from localStorage');
        return token;
      }
      
      // Fallback to sessionStorage
      token = sessionStorage.getItem('token');
      if (token) {
        console.log('Token retrieved from sessionStorage (fallback)');
        // Restore to localStorage if possible
        try {
          localStorage.setItem('token', token);
        } catch (e) {
          console.log('Could not restore token to localStorage');
        }
        return token;
      }
      
      console.log('No token found in any storage');
      return null;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },
  
  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('token');
      console.log('Token removed from localStorage');
    } catch (error) {
      console.error('Error removing token from localStorage:', error);
    }
    
    try {
      sessionStorage.removeItem('token');
      console.log('Token removed from sessionStorage');
    } catch (error) {
      console.error('Error removing token from sessionStorage:', error);
    }
  }
};

// Authentication service
const authService = {
  register: async (userData: UserRegisterData): Promise<UserData> => {
    console.log('=== REGISTER ATTEMPT ===');
    console.log('User data:', { 
      username: userData.username, 
      email: userData.email, 
      name: userData.name, 
      password: '***' 
    });
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'https://my-manager-api-8xme.onrender.com/api');
    
    try {
      const response = await api.post('/users/register', userData);
      console.log('Register response received:', response.status, response.data);
      
      if (response.data.token) {
        TokenStorage.setToken(response.data.token);
        console.log('Token saved after registration:', response.data.token.substring(0, 15) + '...');
      } else {
        console.error('No token received in register response');
        throw new Error('No authentication token received');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Register error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid registration data');
      } else if (error.response?.status === 409) {
        throw new Error('Username or email already exists');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.response?.data?.message || 'Registration failed');
      }
    }
  },
  
  login: async (credentials: UserLoginData): Promise<UserData> => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Credentials:', { username: credentials.username, password: '***' });
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'https://my-manager-api-8xme.onrender.com/api');
    
    try {
      const response = await api.post('/users/login', credentials);
      console.log('Login response received:', response.status, response.data);
      
      if (response.data.token) {
        TokenStorage.setToken(response.data.token);
        console.log('Token saved after login:', response.data.token.substring(0, 15) + '...');
      } else {
        console.error('No token received in login response');
        throw new Error('No authentication token received');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!error.response) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.response?.data?.message || 'Login failed');
      }
    }
  },
  
  logout: (): void => {
    console.log('Logout called - removing token from all storage');
    TokenStorage.removeToken();
  },
  
  getProfile: async (): Promise<UserData> => {
    console.log('Getting profile - checking token...');
    const token = TokenStorage.getToken();
    console.log('Current token:', token ? token.substring(0, 15) + '...' : 'No token found');
    
    try {
      const response = await api.get('/users/profile');
      console.log('Profile fetch successful');
      return response.data;
    } catch (error: any) {
      console.error('Profile fetch failed:', error?.response?.status, error?.response?.data);
      throw error;
    }
  },
  
  updateProfile: async (userData: UpdateProfileData): Promise<UserData> => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
  
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') {
      console.log('isAuthenticated: window undefined (SSR)');
      return false;
    }
    
    const token = TokenStorage.getToken();
    const isAuth = !!token;
    console.log('isAuthenticated check:', {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 15) + '...' : 'None',
      result: isAuth
    });
    
    return isAuth;
  }
};

export default authService; 