/**
 * Professional Email Configuration
 * 
 * This module provides email sending functionality using Nodemailer
 * with proper configuration, error handling, and templates.
 */

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        console.log('🚀 EmailService constructor called');
        this.transporter = null;
        this.isConfigured = false;
        console.log('🚀 About to initialize transporter...');
        this.initializeTransporter();
        console.log('🚀 EmailService constructor completed');
    }

    /**
     * Initialize Nodemailer transporter
     */
    initializeTransporter() {
        try {
            // Check if email credentials are configured
            console.log('🔍 Checking email configuration...');
            console.log('📧 EMAIL_USER exists:', !!process.env.EMAIL_USER);
            console.log('🔑 EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
            console.log('📧 EMAIL_USER value:', process.env.EMAIL_USER);
            console.log('🔑 EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                console.log('⚠️ Email credentials not configured. Email sending disabled.');
                return;
            }

            this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    ciphers: 'SSLv3',
                    rejectUnauthorized: false
                },
                pool: true,
                maxConnections: 1,
                maxMessages: 5
            });

            // Verify transporter configuration
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ Email transporter verification failed:', error.message);
                    console.error('❌ Full error details:', error);
                    this.isConfigured = false;
                } else {
                    console.log('✅ Email transporter ready');
                    console.log('📧 Email user:', process.env.EMAIL_USER);
                    this.isConfigured = true;
                }
            });

        } catch (error) {
            console.error('❌ Failed to initialize email transporter:', error);
            this.isConfigured = false;
        }
    }

    /**
     * Send email verification email
     */
    async sendVerificationEmail(email, verificationToken) {
        console.log('🔍 sendVerificationEmail called');
        console.log('📧 isConfigured value:', this.isConfigured);
        console.log('📧 transporter exists:', !!this.transporter);

        if (!this.isConfigured) {
            console.log('📧 Email not configured - skipping verification email');
            console.log('📧 Attempting to re-initialize email service...');
            this.initializeTransporter();

            // Wait a moment and check again
            setTimeout(() => {
                console.log('📧 After re-init, isConfigured:', this.isConfigured);
            }, 1000);

            return { success: false, message: 'Email service not configured' };
        }

        try {
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

            const mailOptions = {
                from: `"LinkUp" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Verify Your Email Address - LinkUp',
                html: this.getVerificationEmailTemplate(email, verificationUrl)
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Verification email sent to ${email}:`, info.messageId);

            return {
                success: true,
                messageId: info.messageId,
                message: 'Verification email sent successfully'
            };

        } catch (error) {
            console.error('❌ Failed to send verification email:', error);
            return { success: false, message: 'Failed to send verification email' };
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, resetToken) {
        if (!this.isConfigured) {
            console.log('📧 Email not configured - skipping password reset email');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

            const mailOptions = {
                from: `"LinkUp" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Reset Your Password - LinkUp',
                html: this.getPasswordResetEmailTemplate(email, resetUrl)
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Password reset email sent to ${email}:`, info.messageId);

            return {
                success: true,
                messageId: info.messageId,
                message: 'Password reset email sent successfully'
            };

        } catch (error) {
            console.error('❌ Failed to send password reset email:', error);
            return { success: false, message: 'Failed to send password reset email' };
        }
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(email, firstname) {
        if (!this.isConfigured) {
            console.log('📧 Email not configured - skipping welcome email');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const mailOptions = {
                from: `"LinkUp" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Welcome to LinkUp!',
                html: this.getWelcomeEmailTemplate(firstname)
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Welcome email sent to ${email}:`, info.messageId);

            return {
                success: true,
                messageId: info.messageId,
                message: 'Welcome email sent successfully'
            };

        } catch (error) {
            console.error('❌ Failed to send welcome email:', error);
            return { success: false, message: 'Failed to send welcome email' };
        }
    }

    /**
     * Email verification template
     */
    getVerificationEmailTemplate(email, verificationUrl) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - LinkUp</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; background: #f9fafb; }
                .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔗 LinkUp</h1>
                    <p>Connect with friends and family</p>
                </div>
                <div class="content">
                    <h2>Verify Your Email Address</h2>
                    <p>Hi there!</p>
                    <p>Thank you for signing up for LinkUp! To complete your registration, please verify your email address by clicking the button below:</p>
                    <div style="text-align: center;">
                        <a href="${verificationUrl}" class="button" style="color: #ffffff;">Verify Email Address</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4f46e5;">${verificationUrl}</p>
                    <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
                    <p>If you didn't create an account with LinkUp, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 LinkUp. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Password reset template
     */
    getPasswordResetEmailTemplate(email, resetUrl) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - LinkUp</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; background: #f9fafb; }
                .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔗 LinkUp</h1>
                    <p>Connect with friends and family</p>
                </div>
                <div class="content">
                    <h2>Reset Your Password</h2>
                    <p>Hi there!</p>
                    <p>We received a request to reset the password for your LinkUp account. To reset your password, click the button below:</p>
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button" style="color: #ffffff;">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #ef4444;">${resetUrl}</p>
                    <p><strong>Note:</strong> This password reset link will expire in 10 minutes.</p>
                    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 LinkUp. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Welcome email template
     */
    getWelcomeEmailTemplate(firstname) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to LinkUp!</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10b981; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; background: #f9fafb; }
                .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔗 LinkUp</h1>
                    <p>Connect with friends and family</p>
                </div>
                <div class="content">
                    <h2>Welcome to LinkUp, ${firstname}!</h2>
                    <p>We're excited to have you join our community! 🎉</p>
                    <p>LinkUp is the perfect place to:</p>
                    <ul>
                        <li>Connect with friends and family</li>
                        <li>Share messages and media</li>
                        <li>Build meaningful relationships</li>
                        <li>Stay in touch with loved ones</li>
                    </ul>
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL}/login" class="button" style="color: #ffffff;">Get Started</a>
                    </div>
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    <p>Happy connecting!</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 LinkUp. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Check if email service is configured
     */
    isEmailConfigured() {
        return this.isConfigured;
    }
}

// Create and export singleton instance
const emailService = new EmailService();

module.exports = emailService;
