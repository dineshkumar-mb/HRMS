const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const nodemailer = require('nodemailer');
const otplib = require('otplib');
const qrcode = require('qrcode');

// Helper to send email
const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const message = {
        from: process.env.EMAIL_FROM,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    await transporter.sendMail(message);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    const { email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            return next(new Error('User already exists'));
        }

        const user = await User.create({
            email,
            password,
            role
        });

        if (user) {
            res.status(201).json({
                success: true,
                _id: user._id,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400);
            next(new Error('Invalid user data'));
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password +twoFactorSecret');

        if (user && (await user.matchPassword(password))) {
            // Check if 2FA is enabled
            if (user.isTwoFactorEnabled) {
                return res.json({
                    success: true,
                    requires2FA: true,
                    email: user.email
                });
            }

            const accessToken = generateToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            // Save refresh token in DB
            user.refreshToken = refreshToken;
            await user.save();

            // Set cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                success: true,
                _id: user._id,
                email: user.email,
                role: user.role,
                token: accessToken
            });
        } else {
            res.status(401);
            return next(new Error('Invalid email or password'));
        }
    } catch (error) {
        return next(error);
    }
};

// ... (other exports)

// @desc    Generate 2FA Secret
// @route   POST /api/auth/2fa/generate
// @access  Private
const generate2FA = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        const secret = otplib.generateSecret();
        // Manual OTP Auth URL construction since keyuri is missing in this version
        const otpauth = `otpauth://totp/HRMS:${user.email}?secret=${secret}&issuer=HRMS`;

        const imageUrl = await qrcode.toDataURL(otpauth);

        // Save secret to user but don't enable it yet
        user.twoFactorSecret = secret;
        await user.save();

        res.json({
            success: true,
            secret,
            qrCode: imageUrl
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify and Enable 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
const verify2FA = async (req, res, next) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user._id).select('+twoFactorSecret');

        if (!user.twoFactorSecret) {
            res.status(400);
            return next(new Error('2FA secret not generated'));
        }



        const isValid = otplib.verify({
            token,
            secret: user.twoFactorSecret
        });

        if (isValid) {
            user.isTwoFactorEnabled = true;
            await user.save();
            res.json({ success: true, message: '2FA enabled successfully' });
        } else {
            res.status(400);
            return next(new Error('Invalid token'));
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Validate 2FA during Login
// @route   POST /api/auth/2fa/validate
// @access  Public
const validate2FA = async (req, res, next) => {
    try {
        const { email, token } = req.body;
        const user = await User.findOne({ email }).select('+twoFactorSecret');

        if (!user || !user.isTwoFactorEnabled) {
            res.status(400);
            return next(new Error('Invalid request'));
        }



        const isValid = otplib.verify({
            token,
            secret: user.twoFactorSecret
        });

        if (isValid) {
            const accessToken = generateToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            await user.save();

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                _id: user._id,
                email: user.email,
                role: user.role,
                token: accessToken
            });
        } else {
            res.status(401);
            return next(new Error('Invalid 2FA code'));
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
const disable2FA = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        user.isTwoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();

        res.json({ success: true, message: '2FA disabled successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id).populate('employee');

    if (user) {
        res.json({
            success: true,
            _id: user._id,
            email: user.email,
            role: user.role,
            employee: user.employee,
            isTwoFactorEnabled: user.isTwoFactorEnabled
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    res.cookie('refreshToken', '', {
        httpOnly: true,
        expires: new Date(0)
    });

    if (req.user) {
        const user = await User.findById(req.user._id);
        if (user) {
            user.refreshToken = undefined;
            await user.save();
        }
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        res.status(404);
        return next(new Error('There is no user with that email'));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Password Reset</h1>
            </div>
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="font-size: 16px; line-height: 1.6;">You are receiving this email because you (or someone else) has requested the reset of a password.</p>
                <p style="font-size: 16px; line-height: 1.6;">Please click on the button below to complete the process:</p>
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #6b7280; line-height: 1.6; border-top: 1px solid #f3f4f6; pt-20px; margin-top: 30px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">Link valid for 10 minutes only.</p>
            </div>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            html,
        });

        res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
        console.error(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        res.status(500);
        return next(new Error('Email could not be sent'));
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
const resetPassword = async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        return next(new Error('Invalid token'));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successful',
    });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!user || !(await user.matchPassword(currentPassword))) {
            res.status(401);
            return next(new Error('Invalid current password'));
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Login via Face Recognition
// @route   POST /api/auth/face-login
// @access  Public
const faceLogin = async (req, res, next) => {
    try {
        const { descriptor } = req.body;

        if (!descriptor || !Array.isArray(descriptor)) {
            res.status(400);
            return next(new Error('Invalid facial descriptor'));
        }

        // Find all users who have a face descriptor
        const users = await User.find({ faceDescriptor: { $exists: true, $ne: null } });

        let bestMatch = null;
        let minDistance = 0.6; // face-api.js default threshold is 0.6

        for (const user of users) {
            const distance = euclideanDistance(descriptor, user.faceDescriptor);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = user;
            }
        }

        if (bestMatch) {
            const accessToken = generateToken(bestMatch._id);
            const refreshToken = generateRefreshToken(bestMatch._id);

            bestMatch.refreshToken = refreshToken;
            await bestMatch.save();

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                _id: bestMatch._id,
                email: bestMatch.email,
                role: bestMatch.role,
                token: accessToken
            });
        } else {
            res.status(401);
            return next(new Error('Face not recognized'));
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Enroll Face
// @route   POST /api/auth/enroll-face
// @access  Private
const enrollFace = async (req, res, next) => {
    try {
        const { descriptor } = req.body;

        if (!descriptor || !Array.isArray(descriptor)) {
            res.status(400);
            return next(new Error('Invalid facial descriptor'));
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404);
            return next(new Error('User not found'));
        }

        user.faceDescriptor = descriptor;
        await user.save();

        res.json({
            success: true,
            message: 'Face enrolled successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Helper function for Euclidean Distance
function euclideanDistance(arr1, arr2) {
    if (arr1.length !== arr2.length) return Infinity;
    const sumSq = arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0);
    return Math.sqrt(sumSq);
}

module.exports = {
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
};
