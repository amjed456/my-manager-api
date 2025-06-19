const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const notificationController = require('./notificationController');
const { cache, CacheKeys, CacheInvalidation } = require('../utils/cache');

// Get all projects for current user (with caching)
exports.getProjects = async (req, res) => {
  try {
    const cacheKey = CacheKeys.userProjects(req.user._id);
    
    // Try to get from cache first
    const cachedProjects = cache.get(cacheKey);
    if (cachedProjects) {
      return res.json(cachedProjects);
    }
    
    // Find projects where user is the owner
    const projects = await Project.find({
      owner: req.user._id
    })
    .lean() // Returns plain JavaScript objects instead of Mongoose documents
    .sort({ createdAt: -1 })
    .select('name description status progress dueDate startDate owner createdAt updatedAt'); // Only select needed fields
    
    // Cache the results for 3 minutes
    cache.set(cacheKey, projects, 3 * 60 * 1000);
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single project by ID (with caching)
exports.getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const cacheKey = CacheKeys.project(projectId);
    
    // Try to get from cache first
    let project = cache.get(cacheKey);
    
    if (!project) {
      // Not in cache, fetch from database
      project = await Project.findById(projectId)
        .populate('owner', 'name username profilePicture')
        .lean(); // Use lean for better performance
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Cache the project for 5 minutes
      cache.set(cacheKey, project, 5 * 60 * 1000);
    }
    
    // Debug ownership comparison
    console.log('Project owner:', typeof project.owner, project.owner);
    console.log('Current user:', typeof req.user._id, req.user._id);
    
    // Get owner ID accounting for populated or non-populated owner
    const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
    
    // Check if user is authorized to view this project (only owner)
    const isOwner = ownerId.toString() === req.user._id.toString();
    
    if (!isOwner) {
      console.log('Access denied: User is not owner');
      console.log('Is owner:', isOwner);
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new project (with cache invalidation)
exports.createProject = async (req, res) => {
  try {
    const { name, description, dueDate } = req.body;
    
    const project = new Project({
      name,
      description,
      dueDate,
      owner: req.user._id,
    });
    
    await project.save();
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateUser(req.user._id);
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a project (with cache invalidation)
exports.updateProject = async (req, res) => {
  try {
    const { name, description, status, dueDate } = req.body;
    const projectId = req.params.id;
    
    // Find project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get owner ID accounting for populated or non-populated owner
    const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
    
    // Check if user is the project owner
    if (ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    
    // Check if status is changing
    const isStatusChanging = status && status !== project.status;
    const oldStatus = project.status;
    
    // Update fields
    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (dueDate) project.dueDate = dueDate;
    
    await project.save();
    
    // Invalidate caches
    CacheInvalidation.invalidateProject(projectId, [req.user._id.toString()]);
    CacheInvalidation.invalidateUser(req.user._id);
    
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a project (with cache invalidation)
exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    
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
    await Task.deleteMany({ project: projectId });
    
    // Delete the project
    await Project.findByIdAndDelete(projectId);
    
    // Invalidate caches
    CacheInvalidation.invalidateProject(projectId, [req.user._id.toString()]);
    CacheInvalidation.invalidateUser(req.user._id);
    
    res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 