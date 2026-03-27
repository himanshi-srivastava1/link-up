const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send email utility
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// Email templates
const emailTemplates = {
    verification: (verificationToken, userName) => ({
        subject: 'LinkUp - Verify Your Email',
        html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="color: #4CAF50;">Welcome to LinkUp, ${userName}!</h2>
                <p>Thank you for registering with LinkUp. Please verify your email address to complete your registration.</p>
                <p>Click the link below to verify your email:</p>
                <a href="${process.env.FRONTEND_URL}/verify-email/${verificationToken}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email
                </a>
                <p style="margin-top: 20px;">Or copy and paste this link in your browser:</p>
                <p>${process.env.FRONTEND_URL}/verify-email/${verificationToken}</p>
                <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
            </div>
        `,
        text: `Welcome to LinkUp, ${userName}! Please verify your email by visiting: ${process.env.FRONTEND_URL}/verify-email/${verificationToken}. This link expires in 24 hours.`
    }),

    passwordReset: (resetToken, userName) => ({
        subject: 'LinkUp - Password Reset Request',
        html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="color: #f44336;">Password Reset Request</h2>
                <p>Hi ${userName},</p>
                <p>We received a request to reset your password for your LinkUp account.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
                   style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
                <p style="margin-top: 20px;">Or copy and paste this link in your browser:</p>
                <p>${process.env.FRONTEND_URL}/reset-password/${resetToken}</p>
                <p style="color: #666; font-size: 12px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
            </div>
        `,
        text: `Hi ${userName}, reset your password by visiting: ${process.env.FRONTEND_URL}/reset-password/${resetToken}. This link expires in 1 hour. If you didn't request this, please ignore this email.`
    })
};

module.exports = {
    sendEmail,
    emailTemplates
};
