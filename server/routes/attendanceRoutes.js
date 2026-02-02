const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getMyAttendance, raiseCorrectionQuery } = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.post('/query', raiseCorrectionQuery);
router.get('/me', getMyAttendance);

module.exports = router;
