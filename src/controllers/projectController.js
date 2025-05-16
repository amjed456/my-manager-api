const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const notificationController = require('./notificationController');

// Get all projects for current user
exports.getProjects = async (req, res) => {
  try {
    // Find projects where user is the owner or a member
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name username profilePicture')
      .populate('owner', 'name username profilePicture');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Debug ownership comparison
    console.log('Project owner:', typeof project.owner, project.owner);
    console.log('Current user:', typeof req.user._id, req.user._id);
    
    // Get owner ID accounting for populated or non-populated owner
    const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
    
    // Check if user is authorized to view this project
    const isOwner = ownerId.toString() === req.user._id.toString();
    const isMember = project.members.some(member => {
      const memberId = typeof member === 'object' ? member._id : member;
      return memberId.toString() === req.user._id.toString();
    });
    
    if (!isOwner && !isMember) {
      console.log('Access denied: User is not owner or member');
      console.log('Is owner:', isOwner);
      console.log('Is member:', isMember);
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { name, description, dueDate, members } = req.body;
    
    const project = new Project({
      name,
      description,
      dueDate,
      members: members || [],
      owner: req.user._id,
    });
    
    await project.save();
    
    // Create notification for project creation if there are members
    if (members && members.length > 0) {
      try {
        await notificationController.createNotification({
          type: 'PROJECT_CREATED',
          message: `${req.user.name} created a new project: "${name}"`,
          project: project._id,
          actor: req.user._id,
          recipients: members
        });
      } catch (notifError) {
        console.error('Failed to create project creation notification:', notifError);
        // Continue execution even if notification creation fails
      }
    }
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  try {
    const { name, description, status, dueDate, members } = req.body;
    
    // Find project
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get owner ID accounting for populated or non-populated owner
    const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
    
    // Check if user is the project owner
    if (ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    
    // Check for new members
    let newMembers = [];
    if (members) {
      // Find members that weren't in the project before
      newMembers = members.filter(m => !project.members.includes(m));
      
      // If new members were added, create notifications
      if (newMembers.length > 0) {
        try {
          // Get user details for notifications
          const memberNames = await User.find({ _id: { $in: newMembers } }, 'name');
          const memberNameList = memberNames.map(m => m.name).join(', ');
          
          // Create notification for existing team members and the owner
          const existingTeam = [...project.members, project.owner.toString()];
          
          await notificationController.createNotification({
            type: 'TEAM_MEMBER_ADDED',
            message: `${memberNames.length > 1 ? 'New team members' : 'A new team member'} ${memberNameList} ${memberNames.length > 1 ? 'were' : 'was'} added to project "${project.name}"`,
            project: project._id,
            actor: req.user._id,
            recipients: existingTeam.filter(m => m.toString() !== req.user._id.toString())
          });
          
          // Create notifications for the new members
          newMembers.forEach(async (memberId) => {
            await notificationController.createNotification({
              type: 'TEAM_MEMBER_ADDED',
              message: `You were added to project "${project.name}" by ${req.user.name}`,
              project: project._id,
              actor: req.user._id,
              recipients: [memberId]
            });
          });
        } catch (notifError) {
          console.error('Failed to create team member notification:', notifError);
          // Continue execution even if notification creation fails
        }
      }
    }
    
    // Check if status is changing
    const isStatusChanging = status && status !== project.status;
    const oldStatus = project.status;
    
    // Update fields
    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (dueDate) project.dueDate = dueDate;
    if (members) project.members = members;
    
    await project.save();
    
    // Send notification about status change if status changed
    if (isStatusChanging) {
      try {
        // Get all project members for notification
        const allMembers = [...project.members];
        
        // Filter out the owner (who made the change) from recipients
        const recipientsForNotification = allMembers.filter(
          m => m.toString() !== req.user._id.toString()
        );
        
        if (recipientsForNotification.length > 0) {
          await notificationController.createNotification({
            type: 'PROJECT_STATUS_CHANGED',
            message: `Project "${project.name}" status has been changed from "${oldStatus}" to "${status}" by ${req.user.name}`,
            project: project._id,
            actor: req.user._id,
            recipients: recipientsForNotification
          });
        }
      } catch (notifError) {
        console.error('Failed to create status change notification:', notifError);
        // Continue execution even if notification creation fails
      }
    }
    
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get owner ID accounting for populated or non-populated owner
    const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
    
    // Check if user is the project owner
    if (ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }
    
    // Delete all tasks associated with this project
    await Task.deleteMany({ project: req.params.id });
    
    // Delete the project
    await project.deleteOne();
    
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 