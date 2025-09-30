import api from './api';
import { UserData } from './authService';

// Admin service interfaces
export interface UserDetail extends UserData {
  projectCount?: number;
  memberProjectCount?: number;
}

interface ProjectSubscription {
  _id: string;
  user: string;
  project: {
    _id: string;
    name: string;
    description: string;
    status: string;
    progress: number;
  };
  isSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Admin service
const adminService = {
  /**
   * Get all users with their project memberships (admin only)
   */
  getAllUsers: async (): Promise<UserDetail[]> => {
    const response = await api.get('/users/admin/users');
    return response.data;
  },

  /**
   * Delete a user (admin only)
   * @param userId User ID to delete
   */
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Check if the current user is an admin
   */
  isAdmin: async (): Promise<boolean> => {
    try {
      const response = await api.get('/users/check-admin');
      return response.data.isAdmin;
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  },

  // Get project subscriptions
  getProjectSubscriptions: async (): Promise<ProjectSubscription[]> => {
    const response = await api.get('/subscriptions');
    return response.data;
  },

  // Subscribe to project notifications
  subscribeToProject: async (projectId: string): Promise<ProjectSubscription> => {
    const response = await api.post(`/subscriptions/${projectId}/subscribe`);
    return response.data;
  },

  // Unsubscribe from project notifications
  unsubscribeFromProject: async (projectId: string): Promise<ProjectSubscription> => {
    const response = await api.post(`/subscriptions/${projectId}/unsubscribe`);
    return response.data;
  },

  // Toggle project subscription
  toggleProjectSubscription: async (projectId: string): Promise<ProjectSubscription> => {
    const response = await api.post(`/subscriptions/${projectId}/toggle`);
    return response.data;
  }
};

export default adminService; 