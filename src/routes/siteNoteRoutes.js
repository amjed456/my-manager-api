const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getSiteNotesByApartment,
  createSiteNote,
  updateSiteNote,
  deleteSiteNote,
  getSiteNoteById,
  getSiteNotesByStatus,
  toggleSiteNoteCompletion,
} = require('../controllers/siteNoteController');

// All routes require authentication
router.use(auth);

// Get all site notes for an apartment
router.get('/apartment/:apartmentId', getSiteNotesByApartment);

// Get site notes by status for an apartment
router.get('/apartment/:apartmentId/status/:status', getSiteNotesByStatus);

// Create a new site note for an apartment
router.post('/apartment/:apartmentId', upload, createSiteNote);

// Get a single site note
router.get('/:noteId', getSiteNoteById);

// Update a site note
router.put('/:noteId', updateSiteNote);

// Delete a site note
router.delete('/:noteId', deleteSiteNote);

// Toggle site note completion status
router.patch('/:noteId/completion', toggleSiteNoteCompletion);

module.exports = router; 