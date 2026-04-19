const express = require('express');
const router = express.Router();

const { listServices, createService } = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Read (citizen/admin)
router.get('/', protect, listServices);

// Create (admin)
router.post('/', protect, authorizeRoles('admin'), createService);

module.exports = router;
