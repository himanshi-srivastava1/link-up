
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initializeTransporter();
    }

    async initializeTransporter() {
        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                console.log('⚠️ Email credentials not configured.');
                return false;
            }

            this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465, 
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    servername: 'smtp.gmail.com', 
                    rejectUnauthorized: false
                }
            });

            
            await new Promise((resolve, reject) => {
                this.transporter.verify((error, success) => {
                    if (error) reject(error);
                    else resolve(success);
                });
            });

            this.isConfigured = true;
            console.log('✅ Email transporter ready');
            return true;
        } catch (error) {
            console.error('❌ Email initialization failed:', error.message);
            this.isConfigured = false;
            return false;
        }
    }

    async sendVerificationEmail(email, verificationToken) {
        // If not configured, try to initialize and WAIT for it
        if (!this.isConfigured) {
            console.log('📧 Attempting to initialize service...');
            const ready = await this.initializeTransporter();
            if (!ready) return { success: false, message: 'Email service unavailable' };
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
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Failed to send email:', error.message);
            return { success: false, message: error.message };
        }
    }

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
