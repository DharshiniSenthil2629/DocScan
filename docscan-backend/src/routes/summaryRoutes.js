const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// Routes
router.post('/:id', documentController.generateSummary);

module.exports = router; 