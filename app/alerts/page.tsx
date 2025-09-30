'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Bell, AlertCircle, Users, Calendar, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { notificationService, authService, adminService } from '@/services';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import MobileNavbar from '@/components/mobile-navbar';
import PageHeader from '@/components/page-header';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import Image from 'next/image';

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

export default function AlertsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast: uiToast } = useToast();
  const router = useRouter();
  
  // Use the shared notification hook for badge and read states
  const { markAsRead: markNotificationAsRead, markAllAsRead: markAllNotificationsAsRead, fetchUnreadCount } = useNotifications();

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/');
      return;
    }
    
    // Check if user is admin
    checkAdminStatus();
    
    fetchNotifications();
  }, [router]);
  
  const checkAdminStatus = async () => {
    try {
      const userIsAdmin = await adminService.isAdmin();
      setIsAdmin(userIsAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
      
      // Ensure unread count is synchronized when we fetch notifications
      fetchUnreadCount();
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // First call the shared hook to update the badge counter
      const success = await markNotificationAsRead(id);
      
      if (success) {
        // Then update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === id 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      uiToast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      // Call the shared hook to update badge counter
      const success = await markAllNotificationsAsRead();
      
      if (success) {
        // Then update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        
        toast('All notifications marked as read');
      } else {
        toast.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Check if the user can delete a notification
  const canDeleteNotification = (notification: Notification): boolean => {
    // Admins can delete any notification
    if (isAdmin) return true;
    
    console.log('Project status check:', notification.project._id, notification.project?.status);
    
    // For normal users, can only delete if project status is "Completed"
    return notification.project?.status === "Completed";
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      
      // Remove from local state
      setNotifications(prev => prev.filter(notification => notification._id !== id));
      
      // Make sure to update the badge count
      fetchUnreadCount();
      
      toast('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PROJECT_PROGRESS':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'TEAM_MEMBER_ADDED':
        return <Users className="h-5 w-5 text-indigo-500" />;
      case 'PROJECT_CREATED':
        return <Bell className="h-5 w-5 text-amber-500" />;
      case 'PROJECT_STATUS_CHANGED':
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const goToProject = (projectId: string) => {
    router.push(`/projects/details?id=${projectId}`);
  };
  
  const handleSignOut = () => {
    authService.logout();
    toast.success('Signed out successfully');
    router.push('/');
  };

  // Delete all notifications that the user is allowed to delete
  const deleteAllAllowedNotifications = async () => {
    try {
      // Find notifications user is allowed to delete
      const notificationsToDelete = notifications.filter(canDeleteNotification);
      
      if (notificationsToDelete.length === 0) {
        toast('No notifications available to delete');
        return;
      }
      
      // Delete each notification
      for (const notification of notificationsToDelete) {
        await notificationService.deleteNotification(notification._id);
      }
      
      // Update local state to remove deleted notifications
      setNotifications(prev => 
        prev.filter(notification => !canDeleteNotification(notification))
      );
      
      // Make sure to update the badge count
      fetchUnreadCount();
      
      toast(`${notificationsToDelete.length} notification(s) deleted`);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error('Failed to delete notifications');
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-16">
      {/* Use the new PageHeader component */}
      <PageHeader onSignOut={handleSignOut} />
      
      {/* Centered page title */}
      <h1 className="text-xl font-bold text-center my-4">Notifications</h1>
      
      <div className="flex-1 p-4">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="flex gap-2 justify-center sm:justify-start w-full sm:w-auto">
            <Button 
              variant="default" 
              size="sm" 
              onClick={markAllAsRead}
              className="flex-1 sm:flex-initial"
            >
              Mark All as Read
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={fetchNotifications}
              className="flex-1 sm:flex-initial"
            >
              Refresh
            </Button>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={deleteAllAllowedNotifications}
            className="w-full sm:w-auto"
          >
            Delete All Notifications
          </Button>
        </div>

        {loading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="mb-4">
                <CardHeader className="flex flex-row items-start gap-4 pb-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-24 mr-2" />
                  <Skeleton className="h-8 w-20" />
                </CardFooter>
              </Card>
            ))}
          </>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification._id} 
              className={`mb-4 ${notification.isRead ? 'border-slate-200' : 'border-l-4 border-l-blue-500'}`}
            >
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <Avatar>
                  <AvatarImage 
                    src={notification.actor.profilePicture || ''} 
                    alt={notification.actor.name} 
                  />
                  <AvatarFallback>
                    {notification.actor.name === 'Team Member' 
                      ? 'TM'
                      : notification.actor.name.substring(0, 2).toUpperCase()
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getNotificationIcon(notification.type)}
                    {notification.actor.name}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {formatDate(notification.createdAt)}
                  </CardDescription>
                </div>
                <div className="ml-auto flex flex-col items-end">
                  {notification.type === 'PROJECT_PROGRESS' && notification.progress && (
                    <Badge variant="outline">
                      {notification.progress}% Complete
                    </Badge>
                  )}
                  {notification.project?.status && (
                    <Badge 
                      variant={notification.project.status === "Completed" ? "default" : "outline"}
                      className="mt-1"
                    >
                      {notification.project.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-md">{notification.message}</p>
                <div className="mt-2">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-500 mr-3" 
                    onClick={() => goToProject(notification.project._id)}
                  >
                    View Project
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {!notification.isRead && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => markAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
                {canDeleteNotification(notification) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500" 
                    onClick={() => deleteNotification(notification._id)}
                  >
                    Delete
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Mobile navbar at the bottom */}
      <MobileNavbar />
    </div>
  );
} 