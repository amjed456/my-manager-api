const SiteNote = require('../models/SiteNote');
const Apartment = require('../models/Apartment');
const Project = require('../models/Project');

// Get all site notes for an apartment
const getSiteNotesByApartment = async (req, res) => {
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
    
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this apartment' });
    }
    
    const notes = await SiteNote.find({ apartment: apartmentId })
      .populate('author', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching site notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new site note
const createSiteNote = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { 
      title, 
      description, 
      images, 
      priority, 
      category, 
      assignedTo, 
      notes 
    } = req.body;
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to create notes for this apartment' });
    }
    
    const siteNote = new SiteNote({
      apartment: apartmentId,
      project: apartment.project,
      author: req.user.id,
      title,
      description,
      images: images || [],
      priority: priority || 'Medium',
      category: category || 'Other',
      assignedTo: assignedTo || null,
      notes: notes || '',
    });
    
    await siteNote.save();
    
    // Populate author and assignedTo info for response
    await siteNote.populate('author', 'name email');
    if (siteNote.assignedTo) {
      await siteNote.populate('assignedTo', 'name email');
    }
    
    res.status(201).json(siteNote);
  } catch (error) {
    console.error('Error creating site note:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a site note
const updateSiteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { 
      title, 
      description, 
      images, 
      status, 
      priority, 
      category, 
      assignedTo, 
      notes,
      startDate,
      completionDate
    } = req.body;
    
    const siteNote = await SiteNote.findById(noteId);
    if (!siteNote) {
      return res.status(404).json({ message: 'Site note not found' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(siteNote.apartment);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }
    
    // Update fields
    if (title !== undefined) siteNote.title = title;
    if (description !== undefined) siteNote.description = description;
    if (images !== undefined) siteNote.images = images;
    if (status !== undefined) siteNote.status = status;
    if (priority !== undefined) siteNote.priority = priority;
    if (category !== undefined) siteNote.category = category;
    if (assignedTo !== undefined) siteNote.assignedTo = assignedTo;
    if (notes !== undefined) siteNote.notes = notes;
    if (startDate !== undefined) siteNote.startDate = startDate;
    if (completionDate !== undefined) siteNote.completionDate = completionDate;
    
    // Auto-set start date when status changes to 'In Progress'
    if (status === 'In Progress' && !siteNote.startDate) {
      siteNote.startDate = new Date();
    }
    
    // Auto-set completion date when status changes to 'Closed'
    if (status === 'Closed' && !siteNote.completionDate) {
      siteNote.completionDate = new Date();
    }
    
    await siteNote.save();
    
    // Populate author and assignedTo info for response
    await siteNote.populate('author', 'name email');
    if (siteNote.assignedTo) {
      await siteNote.populate('assignedTo', 'name email');
    }
    
    res.json(siteNote);
  } catch (error) {
    console.error('Error updating site note:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a site note
const deleteSiteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    
    const siteNote = await SiteNote.findById(noteId);
    if (!siteNote) {
      return res.status(404).json({ message: 'Site note not found' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(siteNote.apartment);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }
    
    await SiteNote.findByIdAndDelete(noteId);
    
    res.json({ message: 'Site note deleted successfully' });
  } catch (error) {
    console.error('Error deleting site note:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single site note
const getSiteNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;
    
    const siteNote = await SiteNote.findById(noteId)
      .populate('author', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!siteNote) {
      return res.status(404).json({ message: 'Site note not found' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(siteNote.apartment);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this note' });
    }
    
    res.json(siteNote);
  } catch (error) {
    console.error('Error fetching site note:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get site notes by status for an apartment
const getSiteNotesByStatus = async (req, res) => {
  try {
    const { apartmentId, status } = req.params;
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this apartment' });
    }
    
    const notes = await SiteNote.find({ 
      apartment: apartmentId, 
      status: status 
    })
      .populate('author', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching site notes by status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSiteNotesByApartment,
  createSiteNote,
  updateSiteNote,
  deleteSiteNote,
  getSiteNoteById,
  getSiteNotesByStatus,
}; 