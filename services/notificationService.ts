import api from './api';

interface Notification {
  _id: string;
  type: 'TASK_COMPLETED' | 'PROJECT_PROGRESS' | 'TEAM_MEMBER_ADDED' | 'PROJECT_CREATED' | 'PROJECT_STATUS_CHANGED';
  message: string;
  project: {
    _id: string;
    name: string;
    progress?: number;
    status?: string;
  };
  task?: {
    _id: string;
    title: string;
  };
  progress?: number;
  actor: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  isRead: boolean;
  createdAt: string;
}

const notificationService = {
  /**
   * Fetches all notifications for the current user
   */
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await api.get('/notifications');
      // Ensure we return an array even if the response is unexpected
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      // Handle 401 and other errors gracefully
      if (error?.response?.status === 401) {
        console.log('User not authenticated for notifications');
        return [];
      }
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },

  /**
   * Marks a notification as read
   * @param id Notification ID
   */
  markAsRead: async (id: string): Promise<Notification | null> => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log('User not authenticated for marking notification as read');
        return null;
      }
      console.error('Failed to mark notification as read:', error);
      return null;
    }
  },

  /**
   * Marks all notifications as read for the current user
   */
  markAllAsRead: async (): Promise<{ message: string } | null> => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log('User not authenticated for marking all notifications as read');
        return null;
      }
      console.error('Failed to mark all notifications as read:', error);
      return null;
    }
  },

  /**
   * Deletes a notification
   * @param id Notification ID
   */
  deleteNotification: async (id: string): Promise<{ message: string } | null> => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log('User not authenticated for deleting notification');
        return null;
      }
      console.error('Failed to delete notification:', error);
      return null;
    }
  },

  /**
   * Returns the count of unread notifications
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const notifications = await notificationService.getNotifications();
      // Ensure notifications is an array before filtering
      if (!Array.isArray(notifications)) {
        console.warn('Notifications is not an array:', notifications);
        return 0;
      }
      return notifications.filter(notification => !notification.isRead).length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }
};

export default notificationService; 