const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const ProjectSubscription = require('../models/ProjectSubscription');
const notificationController = require('./notificationController');

// Get all tasks for a project
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
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
    
    // Get all tasks for this project
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name username profilePicture')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name username profilePicture')
      .populate('createdBy', 'name username')
      .populate('project', 'name owner members');
    
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

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, projectId, assignedTo } = req.body;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
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
    
    // Return the created task with populated fields
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name username profilePicture')
      .populate('createdBy', 'name username');
    
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    
    // Find task
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Get project to check permissions
    const project = await Project.findById(task.project);
    
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
    
    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (assignedTo) task.assignedTo = assignedTo;
    
    await task.save();
    
    // Calculate new project progress
    const tasks = await Task.find({ project: task.project });
    const completedCount = tasks.filter(t => t.status === "Done").length;
    const progressPercentage = Math.round((completedCount / tasks.length) * 100);
    
    // Create notifications if task was completed
    if (isCompleted) {
      try {
        // Get project details for notifications
        const populatedProject = await Project.findById(task.project)
          .populate('owner')
          .populate('members');
        
        // Define basic recipients (owner and all members)
        const recipients = [populatedProject.owner._id];
        populatedProject.members.forEach(member => {
          recipients.push(member._id);
        });
        
        // Get admin users who are subscribed to this project
        const adminSubscriptions = await ProjectSubscription.find({
          project: task.project,
          isSubscribed: true
        }).populate('user', 'role');
        
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
        console.error('Failed to create notification:', notifError);
        // Continue execution even if notification creation fails
      }
    }
    
    // Return the updated task with populated fields
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name username profilePicture')
      .populate('createdBy', 'name username');
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    // Find task
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Get project to check permissions
    const project = await Project.findById(task.project);
    
    // Check if user is authorized to delete this task
    if (
      project.owner.toString() !== req.user._id.toString() &&
      task.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    await task.deleteOne();
    
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 