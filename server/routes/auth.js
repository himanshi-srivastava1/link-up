const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getCurrentUser,
    changePassword,
    refreshToken,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendEmailVerification
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
    validateRegistration,
    validateLogin,
    validateChangePassword,
    validateForgotPassword,
    validateResetPassword,
    validateToken,
    validateResendVerification
} = require('../validators/authValidator');

// POST /api/auth/register - Register new user
router.post('/register', authLimiter, validateRegistration, register);

// POST /api/auth/login - Login user
router.post('/login', authLimiter, validateLogin, login);

// POST /api/auth/logout - Logout user
router.post('/logout', logout);

// GET /api/auth/current-user - Get current user
router.get('/current-user', authenticate, getCurrentUser);

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticate, validateChangePassword, changePassword);

// POST /api/auth/refresh-token - Refresh access token
router.post('/refresh-token', refreshToken);

// GET /api/auth/verify-email/:verificationToken - Verify email
router.get('/verify-email/:token', validateToken, verifyEmail);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, forgotPassword);

// POST /api/auth/reset-password/:resetToken - Reset password
router.post('/reset-password/:token', validateToken, validateResetPassword, resetPassword);

// POST /api/auth/resend-email-verification - Resend verification email
router.post('/resend-email-verification', authLimiter, validateResendVerification, resendEmailVerification);

module.exports = router;
