const express = require('express');
const router = express.Router();
const { generatePayroll, getMyPayroll, getAllPayroll } = require('../controllers/payrollController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/me', getMyPayroll);
router.get('/', authorize('admin', 'hr'), getAllPayroll);
router.post('/generate', authorize('admin', 'hr'), generatePayroll);

module.exports = router;
