const express = require('express');
const router = express.Router();
const {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getDashboardHighlights
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/highlights', getDashboardHighlights);

router.route('/')
    .get(getEmployees)
    .post(authorize('admin', 'hr'), createEmployee);

router.route('/:id')
    .get(getEmployeeById)
    .put(authorize('admin', 'hr', 'manager'), updateEmployee)
    .delete(authorize('admin'), deleteEmployee);

module.exports = router;
