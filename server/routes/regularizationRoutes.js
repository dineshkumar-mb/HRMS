const express = require('express');
const router = express.Router();
const {
    getMyRegularizations,
    createRegularization,
    getAllRegularizations,
    updateRegularizationStatus
} = require('../controllers/regularizationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/me', getMyRegularizations);
router.post('/', createRegularization);

router.get('/', authorize('admin', 'hr'), getAllRegularizations);
router.put('/:id', authorize('admin', 'hr'), updateRegularizationStatus);

module.exports = router;
