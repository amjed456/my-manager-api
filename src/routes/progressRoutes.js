const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getProgressEntriesByApartment,
  createProgressEntry,
  updateProgressEntry,
  deleteProgressEntry,
  getProgressEntryById,
  getProgressEntriesByDate,
} = require('../controllers/progressController');

// All routes require authentication
router.use(auth);

// Get all progress entries for an apartment
router.get('/apartment/:apartmentId', getProgressEntriesByApartment);

// Get progress entries by date for an apartment
router.get('/apartment/:apartmentId/date/:date', getProgressEntriesByDate);

// Create a new progress entry for an apartment
router.post('/apartment/:apartmentId', createProgressEntry);

// Get a single progress entry
router.get('/:entryId', getProgressEntryById);

// Update a progress entry
router.put('/:entryId', updateProgressEntry);

// Delete a progress entry
router.delete('/:entryId', deleteProgressEntry);

module.exports = router; 