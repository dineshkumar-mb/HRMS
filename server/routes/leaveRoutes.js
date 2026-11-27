const express = require('express');
const router = express.Router();
const { applyLeave, getLeaves, updateLeaveStatus, getOnLeaveToday } = require('../controllers/leaveController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/on-leave-today', getOnLeaveToday);
router.post('/', applyLeave);
router.get('/', authorize('admin', 'hr', 'manager', 'employee'), getLeaves);
router.put('/:id', authorize('admin', 'hr', 'manager', 'employee'), updateLeaveStatus);

module.exports = router;
