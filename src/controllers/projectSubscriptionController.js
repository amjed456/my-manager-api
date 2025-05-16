const ProjectSubscription = require('../models/ProjectSubscription');
const Project = require('../models/Project');

// Get all subscriptions for the current admin user
exports.getMySubscriptions = async (req, res) => {
  try {
    // Only admins can manage their subscriptions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin users can manage project subscriptions' });
    }
    
    const subscriptions = await ProjectSubscription.find({ user: req.user._id })
      .populate('project', 'name description status progress');
    
    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Subscribe to a project
exports.subscribe = async (req, res) => {
  try {
    // Only admins can subscribe to projects
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin users can subscribe to projects' });
    }
    
    const { projectId } = req.params;
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Create or update subscription
    const subscription = await ProjectSubscription.findOneAndUpdate(
      { user: req.user._id, project: projectId },
      { isSubscribed: true },
      { new: true, upsert: true }
    );
    
    res.json(subscription);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unsubscribe from a project
exports.unsubscribe = async (req, res) => {
  try {
    // Only admins can unsubscribe from projects
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin users can unsubscribe from projects' });
    }
    
    const { projectId } = req.params;
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Create or update subscription
    const subscription = await ProjectSubscription.findOneAndUpdate(
      { user: req.user._id, project: projectId },
      { isSubscribed: false },
      { new: true, upsert: true }
    );
    
    res.json(subscription);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle subscription status
exports.toggleSubscription = async (req, res) => {
  try {
    // Only admins can toggle subscriptions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin users can manage project subscriptions' });
    }
    
    const { projectId } = req.params;
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Find current subscription
    let subscription = await ProjectSubscription.findOne({ 
      user: req.user._id, 
      project: projectId 
    });
    
    if (subscription) {
      // Toggle existing subscription
      subscription.isSubscribed = !subscription.isSubscribed;
      await subscription.save();
    } else {
      // Create new subscription (default is subscribed)
      subscription = new ProjectSubscription({
        user: req.user._id,
        project: projectId,
        isSubscribed: true
      });
      await subscription.save();
    }
    
    res.json(subscription);
  } catch (error) {
    console.error('Toggle subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 