const Notification = require('../models/Notification');
const Project = require('../models/Project');
const User = require('../models/User');
const ProjectSubscription = require('../models/ProjectSubscription');
const Task = require('../models/Task');

// Create a new notification
exports.createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Get all notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    // Get user role to determine notification handling
    const user = req.user;
    const isAdmin = user.role === 'admin';
    
    // Get notifications where the user is a recipient, sorted by newest first
    const notifications = await Notification.find({
      recipients: req.user._id
    })
    .sort({ createdAt: -1 })
    .populate('actor', 'name username profilePicture')
    .populate('project', 'name progress status owner')
    .populate('task', 'title');
    
    // Process notifications based on user role
    const processedNotifications = await Promise.all(notifications.map(async (notification) => {
      const notificationObj = notification.toObject();
      
      // Process TASK_COMPLETED notifications
      if (notification.type === 'TASK_COMPLETED') {
        // Get the project to check if user is owner
        const project = await Project.findById(notification.project);
        
        // For regular users who are not project owners, hide who completed the task
        if (!isAdmin && project.owner.toString() !== user._id.toString()) {
          notificationObj.message = `Task "${notification.task.title}" was completed`;
          
          // Hide actor information for regular members
          notificationObj.actor = {
            _id: notification.actor._id,
            name: 'Team Member',
            username: '',
            profilePicture: ''
          };
        }
      }
      
      return notificationObj;
    }));
    
    res.json(processedNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if user is a recipient of this notification
    if (!notification.recipients.some(recipient => recipient.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipients: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if user is a recipient of this notification
    if (!notification.recipients.some(recipient => recipient.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    
    await notification.deleteOne();
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 