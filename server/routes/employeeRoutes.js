const express = require('express');
const router = express.Router();
const {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getDashboardHighlights,
    addEmployeeDocument,
    deleteEmployeeDocument
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/highlights', getDashboardHighlights);

router.route('/')
    .get(getEmployees)
    .post(authorize('admin', 'hr'), createEmployee);

router.route('/:id')
    .get(getEmployeeById)
    .put(updateEmployee)
    .delete(authorize('admin'), deleteEmployee);

router.post('/:id/documents', addEmployeeDocument);
router.delete('/:id/documents/:docId', deleteEmployeeDocument);

module.exports = router;
