const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');
const emailService = require('../config/email');
const { generateRandomToken, generateTokens } = require('../utils/tokenService');


// Register new user
const register = asyncHandler(async (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        if (existingUser.isEmailVerified) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists and is verified'
            });
        } else {
            // User exists but not verified - resend verification email
            const newVerificationToken = generateRandomToken();
            await User.findByIdAndUpdate(existingUser._id, {
                emailVerificationToken: newVerificationToken,
                emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            });

            // Send verification email
            const emailResult = await emailService.sendVerificationEmail(existingUser.email, newVerificationToken);

            return res.status(200).json({
                success: true,
                message: 'Account already exists but not verified. A new verification link has been sent to your email.',
                data: {
                    email: existingUser.email,
                    emailSent: emailResult.success,
                    needsVerification: true
                }
            });
        }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const newUser = new User({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        emailVerificationToken,
        emailVerificationExpires,
        isEmailVerified: false
    });

    await newUser.save();

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(newUser.email, emailVerificationToken);

    // Send welcome email (only if verification email was sent successfully)
    if (emailResult.success) {
        await emailService.sendWelcomeEmail(newUser.email, newUser.firstname);
    }

    res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email for verification.',
        data: {
            user: {
                id: newUser._id,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                email: newUser.email
            },
            emailSent: emailResult.success
        }
    });
});

// Login user
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    console.log('Looking for user with email:', email.toLowerCase().trim());
    console.log('Found user:', user ? 'YES' : 'NO');

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }
    // Check if email is verified
    if (!user.isEmailVerified) {
        // Check if user has a verification token
        if (!user.emailVerificationToken) {
            // Generate new verification token and send email
            const newVerificationToken = generateRandomToken();
            console.log('Generated verification token:', newVerificationToken);

            await User.findByIdAndUpdate(user._id, {
                emailVerificationToken: newVerificationToken,
                emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            });

            // Send verification email
            const emailResult = await emailService.sendVerificationEmail(user.email, newVerificationToken);

            if (emailResult.success) {
                return res.status(401).json({
                    success: false,
                    message: 'Please verify your email. A new verification link has been sent to your email address.',
                    requiresVerification: true,
                    email: user.email,
                    emailSent: true
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Please verify your email before logging in. Email service temporarily unavailable.',
                    requiresVerification: true,
                    email: user.email,
                    emailSent: false
                });
            }
        } else {
            // Resend existing verification email
            const emailResult = await emailService.sendVerificationEmail(user.email, user.emailVerificationToken);

            if (emailResult.success) {
                return res.status(401).json({
                    success: false,
                    message: 'Please verify your email before logging in. Check your email for the verification link.',
                    requiresVerification: true,
                    email: user.email,
                    emailSent: true
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Please verify your email before logging in. Email service temporarily unavailable.',
                    requiresVerification: true,
                    email: user.email,
                    emailSent: false
                });
            }
        }
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                profilePic: user.profilePic,
                lastSeen: user.lastSeen,
                createdAt: user.createdAt
            },
            accessToken
        }
    });
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
            isEmailVerified: user.isEmailVerified,
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

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'No user found with this email address'
        });
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Send reset email
    const emailResult = await emailService.sendPasswordResetEmail(user.email, resetToken);

    if (!emailResult.success) {
        // If email fails, remove reset token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(500).json({
            success: false,
            message: 'Failed to send password reset email. Please try again.'
        });
    }

    res.json({
        success: true,
        message: 'Password reset link has been sent to your email address.',
        data: {
            email: user.email,
            emailSent: true
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

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'No user found with this email address'
        });
    }

    // Check if already verified
    if (user.isEmailVerified) {
        return res.status(400).json({
            success: false,
            message: 'Email is already verified'
        });
    }

    // Generate new verification token
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(email, emailVerificationToken);

    if (!emailResult.success) {
        return res.status(500).json({
            success: false,
            message: 'Failed to send verification email. Please try again.'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
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
