const express = require('express');
const router = express.Router();
const {
    getOverallStats,
    getEmployeeReports,
    getAttendanceReports,
    getLeaveReports,
    getDepartmentReports,
    getAttendanceMonthlyGrid
} = require('../controllers/reportsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes are protected and require admin or hr role
router.use(protect);
// Attendance grid is accessible by employees too
router.get('/attendance-grid', authorize('admin', 'hr', 'employee'), getAttendanceMonthlyGrid);

// Restrict all other report routes to admin and hr only
router.use(authorize('admin', 'hr'));

router.get('/overview', getOverallStats);
router.get('/employees', getEmployeeReports);
router.get('/attendance', getAttendanceReports);
router.get('/leaves', getLeaveReports);
router.get('/departments', getDepartmentReports);

module.exports = router;
