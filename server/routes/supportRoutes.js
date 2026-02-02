const express = require('express');
const router = express.Router();
const { submitContactRequest } = require('../controllers/supportController');

// Public route - no authentication required
router.post('/contact', submitContactRequest);

module.exports = router;
