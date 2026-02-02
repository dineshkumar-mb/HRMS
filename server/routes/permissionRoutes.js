const express = require('express');
const router = express.Router();
const {
    getMyPermissions,
    applyPermission,
    getAllPermissions,
    updatePermissionStatus
} = require('../controllers/permissionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/me', getMyPermissions);
router.post('/', applyPermission);

router.use(authorize('admin', 'hr'));
router.get('/', getAllPermissions);
router.put('/:id', updatePermissionStatus);

module.exports = router;
