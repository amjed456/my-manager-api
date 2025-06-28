const multer = require('multer');

// Set up storage engine
const storage = multer.memoryStorage();

// Initialize upload
const upload = multer({ storage });

module.exports = upload.array('photos', 10); // allow up to 10 files under the field name 'photos' 