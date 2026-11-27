const express = require('express');
const router = express.Router();
const {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('admin', 'hr'), createAnnouncement);
router.put('/:id', authorize('admin', 'hr'), updateAnnouncement);
router.delete('/:id', authorize('admin', 'hr'), deleteAnnouncement);

module.exports = router;
