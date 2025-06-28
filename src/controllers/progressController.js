const ProgressEntry = require('../models/ProgressEntry');
const Apartment = require('../models/Apartment');
const Project = require('../models/Project');

// Get all progress entries for an apartment
const getProgressEntriesByApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this apartment' });
    }
    
    const entries = await ProgressEntry.find({ apartment: apartmentId })
      .populate('author', 'name email')
      .sort({ date: -1 });
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching progress entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new progress entry
const createProgressEntry = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { workDescription, hoursWorked, date } = req.body;
    
    // Basic validation
    if (!workDescription || !hoursWorked || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create entries for this apartment' });
    }
    
    let photoUrls = [];
    if (req.files) {
      photoUrls = req.files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
    }
    
    const entry = new ProgressEntry({
      apartment: apartmentId,
      project: apartment.project,
      author: req.user.id,
      workDescription,
      hoursWorked,
      photos: photoUrls,
      date,
    });
    
    await entry.save();
    
    // Populate author info for response
    await entry.populate('author', 'name email');
    
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating progress entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a progress entry
const updateProgressEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const {  workDescription, workPoints, images, hoursWorked, notes, date } = req.body;
    
    const entry = await ProgressEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Progress entry not found' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(entry.apartment);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this entry' });
    }
    
    // Update fields
    if (summary !== undefined) entry.summary = summary;
    if (workPoints !== undefined) entry.workPoints = workPoints;
    if (images !== undefined) entry.images = images;
    if (hoursWorked !== undefined) entry.hoursWorked = hoursWorked;
    if (notes !== undefined) entry.notes = notes;
    if (date !== undefined) entry.date = date;
    
    await entry.save();
    
    // Populate author info for response
    await entry.populate('author', 'name email');
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating progress entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a progress entry
const deleteProgressEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    
    const entry = await ProgressEntry.findById(entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Progress entry not found' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(entry.apartment);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this entry' });
    }
    
    await ProgressEntry.findByIdAndDelete(entryId);
    
    res.json({ message: 'Progress entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting progress entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single progress entry
const getProgressEntryById = async (req, res) => {
  try {
    const { entryId } = req.params;
    
    const entry = await ProgressEntry.findById(entryId)
      .populate('author', 'name email');
    
    if (!entry) {
      return res.status(404).json({ message: 'Progress entry not found' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(entry.apartment);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this entry' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error fetching progress entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get progress entries by date for an apartment
const getProgressEntriesByDate = async (req, res) => {
  try {
    const { apartmentId, date } = req.params;
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this apartment' });
    }
    
    // Parse the date and create start/end of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const entries = await ProgressEntry.find({
      apartment: apartmentId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('author', 'name email');
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching progress entries by date:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProgressEntriesByApartment,
  createProgressEntry,
  updateProgressEntry,
  deleteProgressEntry,
  getProgressEntryById,
  getProgressEntriesByDate,
}; 