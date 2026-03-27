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
    resetPassword
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
    validateRegistration,
    validateLogin,
    validateChangePassword,
    validateForgotPassword,
    validateResetPassword,
    validateToken
} = require('../validators/authValidator');


router.post('/register', authLimiter, validateRegistration, register);


router.post('/login', authLimiter, validateLogin, login);

router.post('/logout', logout);

router.get('/current-user', authenticate, getCurrentUser);

router.post('/change-password', authenticate, validateChangePassword, changePassword);

router.post('/refresh-token', refreshToken);

router.get('/verify-email/:token', validateToken, verifyEmail);

router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, forgotPassword);

router.post('/reset-password/:token', validateToken, resetPassword);
router.post('/reset-password/:token', validateToken, validateResetPassword, resetPassword);


module.exports = router;
