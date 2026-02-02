const express = require('express');
const router = express.Router();
const { getHolidays, createHoliday, deleteHoliday } = require('../controllers/holidayController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', getHolidays);
router.post('/', protect, authorize('admin', 'hr'), createHoliday);
router.delete('/:id', protect, authorize('admin'), deleteHoliday);

module.exports = router;
