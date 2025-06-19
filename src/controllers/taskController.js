const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const ProjectSubscription = require('../models/ProjectSubscription');
const notificationController = require('./notificationController');
const { cache, CacheKeys, CacheInvalidation } = require('../utils/cache');

// Get all tasks for a project (with caching)
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const cacheKey = CacheKeys.projectTasks(projectId);
    
    // Try to get from cache first
    const cachedTasks = cache.get(cacheKey);
    if (cachedTasks) {
      return res.json(cachedTasks);
    }
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId).lean().select('owner members');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is authorized to view tasks for this project
    if (
      project.owner.toString() !== req.user._id.toString() &&
      !project.members.includes(req.user._id)
    ) {
      return res.status(403).json({ message: 'Not authorized to access tasks for this project' });
    }
    
    // Get all tasks for this project with optimized query
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name username profilePicture')
      .populate('createdBy', 'name username')
      .lean() // Use lean for better performance
      .sort({ createdAt: -1 })
      .select('title description status priority dueDate assignedTo createdBy createdAt updatedAt'); // Only select needed fields
    
    // Cache the results for 2 minutes (tasks change frequently)
    cache.set(cacheKey, tasks, 2 * 60 * 1000);
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single task by ID (with caching)
exports.getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name username profilePicture')
      .populate('createdBy', 'name username')
      .populate('project', 'name owner members')
      .lean(); // Use lean for better performance
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is authorized to view this task
    const project = task.project;
    if (
      project.owner.toString() !== req.user._id.toString() &&
      !project.members.includes(req.user._id)
    ) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new task (with cache invalidation)
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assignedTo } = req.body;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId).lean().select('owner members');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is authorized to add tasks to this project
    if (
      project.owner.toString() !== req.user._id.toString() &&
      !project.members.includes(req.user._id)
    ) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this project' });
    }
    
    // Create the task
    const task = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      project: projectId,
      assignedTo,
      createdBy: req.user._id,
    });
    
    await task.save();
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateTask(projectId, assignedTo, req.user._id);
    
    // Return the created task with populated fields
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name username profilePicture')
      .populate('createdBy', 'name username')
      .lean();
    
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a task (with cache invalidation and optimized notifications)
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    const taskId = req.params.id;
    
    // Find task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Get project to check permissions (use lean for better performance)
    const project = await Project.findById(task.project).lean().select('owner members');
    
    // Check if user is authorized to update this task
    if (
      project.owner.toString() !== req.user._id.toString() &&
      !project.members.includes(req.user._id)
    ) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    // Check if status is changing to "Done"
    const isCompleted = status === "Done" && task.status !== "Done";
    const oldStatus = task.status;
    const oldAssignedTo = task.assignedTo;
    
    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (assignedTo) task.assignedTo = assignedTo;
    
    await task.save();
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateTask(task.project, assignedTo, req.user._id);
    if (oldAssignedTo && oldAssignedTo.toString() !== (assignedTo || '').toString()) {
      CacheInvalidation.invalidateTask(task.project, oldAssignedTo, req.user._id);
    }
    
    // Calculate new project progress using aggregation for better performance
    const progressResult = await Task.aggregate([
      { $match: { project: task.project } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "Done"] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const progressPercentage = progressResult.length > 0 
      ? Math.round((progressResult[0].completed / progressResult[0].total) * 100)
      : 0;
    
    // Update project progress
    await Project.findByIdAndUpdate(task.project, { progress: progressPercentage });
    
    // Create notifications if task was completed
    if (isCompleted) {
      try {
        // Get project details for notifications (optimized query)
        const populatedProject = await Project.findById(task.project)
          .populate('owner', '_id name')
          .populate('members', '_id')
          .lean();
        
        // Define basic recipients (owner and all members)
        const recipients = [populatedProject.owner._id];
        populatedProject.members.forEach(member => {
          recipients.push(member._id);
        });
        
        // Get admin users who are subscribed to this project (optimized query)
        const adminSubscriptions = await ProjectSubscription.find({
          project: task.project,
          isSubscribed: true
        })
        .populate('user', 'role _id')
        .lean();
        
        // Add subscribed admins to recipients
        const adminRecipients = adminSubscriptions
          .filter(subscription => subscription.user.role === 'admin')
          .map(subscription => subscription.user._id);
        
        // Combine all recipients and remove duplicates
        const allRecipients = [...new Set([...recipients, ...adminRecipients])];
        
        // Exclude current user from recipients
        const finalRecipients = allRecipients.filter(r => r.toString() !== req.user._id.toString());
        
        // Create task completion notification
        await notificationController.createNotification({
          type: 'TASK_COMPLETED',
          message: `Task "${task.title}" was completed by ${req.user.name}`,
          project: task.project,
          task: task._id,
          actor: req.user._id,
          recipients: finalRecipients
        });
        
        // Create project progress notification if progress changed significantly
        if (progressPercentage % 25 === 0 || progressPercentage === 100) {
          await notificationController.createNotification({
            type: 'PROJECT_PROGRESS',
            message: `Project "${populatedProject.name}" is now ${progressPercentage}% complete`,
            project: task.project,
            progress: progressPercentage,
            actor: req.user._id,
            recipients: finalRecipients
          });
        }
      } catch (notifError) {
        console.error('Failed to create task completion notification:', notifError);
        // Continue execution even if notification creation fails
      }
    }
    
    // Return updated task with populated fields
    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'name username profilePicture')
      .populate('createdBy', 'name username')
      .lean();
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a task (with cache invalidation)
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Get project to check permissions
    const project = await Project.findById(task.project).lean().select('owner members');
    
    // Check if user is authorized to delete this task
    if (
      project.owner.toString() !== req.user._id.toString() &&
      !project.members.includes(req.user._id)
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    // Store task details for cache invalidation
    const projectId = task.project;
    const assignedTo = task.assignedTo;
    const createdBy = task.createdBy;
    
    // Delete the task
    await Task.findByIdAndDelete(taskId);
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateTask(projectId, assignedTo, createdBy);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 