import api from './api';
import { UserData } from './authService';

// User service
const userService = {
  // Get all available users (excluding current user)
  getAvailableUsers: async (): Promise<UserData[]> => {
    const response = await api.get('/users/available');
    return response.data;
  }
};

export default userService; 