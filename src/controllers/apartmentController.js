const Apartment = require('../models/Apartment');
const Project = require('../models/Project');

// Get all apartments for a project
const getApartmentsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if user has access to the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is owner or has access
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }
    
    const apartments = await Apartment.find({ project: projectId })
      .sort({ number: 1 });
    
    res.json(apartments);
  } catch (error) {
    console.error('Error fetching apartments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new apartment
const createApartment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, number, description } = req.body;
    
    // Check if user has access to the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create apartments for this project' });
    }
    
    // Check if apartment number already exists for this project
    const existingApartment = await Apartment.findOne({ 
      project: projectId, 
      number: number 
    });
    
    if (existingApartment) {
      return res.status(400).json({ message: 'Apartment number already exists for this project' });
    }
    
    const apartment = new Apartment({
      name,
      number,
      description,
      project: projectId,
    });
    
    await apartment.save();
    
    res.status(201).json(apartment);
  } catch (error) {
    console.error('Error creating apartment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an apartment
const updateApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { name, description, status, progress } = req.body;
    
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    // Check if user has access to the project
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this apartment' });
    }
    
    // Update fields
    if (name !== undefined) apartment.name = name;
    if (description !== undefined) apartment.description = description;
    if (status !== undefined) apartment.status = status;
    if (progress !== undefined) apartment.progress = progress;
    
    await apartment.save();
    
    // Update project progress
    await project.updateProgress();
    
    res.json(apartment);
  } catch (error) {
    console.error('Error updating apartment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an apartment
const deleteApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    // Check if user has access to the project
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this apartment' });
    }
    
    await Apartment.findByIdAndDelete(apartmentId);
    
    // Update project progress
    await project.updateProgress();
    
    res.json({ message: 'Apartment deleted successfully' });
  } catch (error) {
    console.error('Error deleting apartment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single apartment
const getApartmentById = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    // Check if user has access to the project
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this apartment' });
    }
    
    res.json(apartment);
  } catch (error) {
    console.error('Error fetching apartment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getApartmentsByProject,
  createApartment,
  updateApartment,
  deleteApartment,
  getApartmentById,
}; 