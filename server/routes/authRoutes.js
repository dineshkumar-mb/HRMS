const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    logoutUser,
    forgotPassword,
    resetPassword,
    changePassword,
    faceLogin,
    enrollFace,
    generate2FA,
    verify2FA,
    validate2FA,
    disable2FA
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.post('/face-login', faceLogin);
router.post('/enroll-face', protect, enrollFace);
router.post('/2fa/generate', protect, generate2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/validate', validate2FA);
router.post('/2fa/disable', protect, disable2FA);

module.exports = router;
