import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services';

// Custom hook for managing notification state across components
export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      setIsLoading(true);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread notifications count:', error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const result = await notificationService.markAsRead(id);
      if (result) {
        // Decrement unread count if greater than 0
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result) {
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchUnreadCount();
    
    // Set up interval to check for new notifications every minute
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
  };
}; 