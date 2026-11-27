const express = require('express');
const router = express.Router();
const {
    getHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    seedDefaultHolidays
} = require('../controllers/holidayController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', getHolidays);
router.post('/', protect, authorize('admin', 'hr'), createHoliday);
router.post('/seed-defaults', protect, authorize('admin', 'hr'), seedDefaultHolidays);
router.put('/:id', protect, authorize('admin', 'hr'), updateHoliday);
router.delete('/:id', protect, authorize('admin', 'hr'), deleteHoliday);

module.exports = router;
