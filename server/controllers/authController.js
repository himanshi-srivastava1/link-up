const bcrypt = require('bcrypt');
const User = require('../models/user');
const asyncHandler = require('../middleware/asyncHandler');
const { generateRandomToken, generateTokens } = require('../utils/tokenService');


// Register new user
const register = asyncHandler(async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'User with this email already exists'
        });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔍 Password hashed successfully');

    // Create new user (auto-verified)
    const newUser = await User.create({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        isEmailVerified: true, // Auto-verify
        emailVerificationToken: undefined
    });

    // Generate tokens for immediate login
    const { accessToken, refreshToken } = generateTokens(newUser._id);

    return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: newUser._id,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                email: newUser.email,
                isEmailVerified: newUser.isEmailVerified
            },
            accessToken,
            refreshToken
        }
    });
});

// Login user
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔍 Login attempt:', { email, password }); // Debug log

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 User found:', user ? 'YES' : 'NO');
    console.log('🔍 User password hash:', user ? user.password.substring(0, 20) + '...' : 'NOT_FOUND');
    
    if (!user) {
        console.log('❌ User not found error');
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔍 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
        console.log('❌ Password mismatch error');
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    console.log('🔍 Tokens generated successfully');

    const response = {
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                isEmailVerified: true
            },
            accessToken,
            refreshToken
        }
    };
    
    console.log('✅ Login response:', response);
    return res.status(200).json(response);
});

// Logout user
const logout = asyncHandler(async (req, res) => {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user;

    res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: {
            id: user._id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            profilePic: user.profilePic,
            lastSeen: user.lastSeen,
            isEmailVerified: true,
            createdAt: user.createdAt
        }
    });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    });
});

// Refresh access token
const refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'No refresh token provided'
        });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY);

    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'User not found'
        });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            accessToken
        }
    });
});

// Verify email
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    console.log('🔍 Email Verification Attempt');
    console.log('Token received:', token);
    console.log('Current time:', new Date().toISOString());

    // Find user with verification token
    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });

    console.log('Database query result:', user ? 'User found' : 'User not found');

    if (user) {
        console.log('User email:', user.email);
        console.log('Token expires:', user.emailVerificationExpires ? new Date(user.emailVerificationExpires).toISOString() : 'Not set');
        console.log('Token valid:', user.emailVerificationExpires ? user.emailVerificationExpires > Date.now() : 'No expiration date');
    }

    if (!user) {
        console.log('❌ Token validation failed: User not found or token expired');
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired verification token'
        });
    }

    // Update user verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('✅ Email verified successfully for:', user.email);

    res.status(200).json({
        success: true,
        message: 'Email verified successfully'
    });
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    return res.status(200).json({
        success: true,
        message: 'Password reset token generated. Use the token to reset your password.',
        data: {
            resetToken,
            expiresAt: resetTokenExpires
        }
    });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with reset token
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successfully'
    });
});

// Resend email verification
const resendEmailVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Email verification is not required'
    });
});

module.exports = {
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
};
