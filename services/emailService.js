// services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // App password for Gmail
    }
});

const sendOTP = async (email, otp, fullname, purpose = 'login') => {
    let subject, htmlContent;

    if (purpose === 'password_reset') {
        subject = 'Password Reset OTP - Polling App';
        htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hi ${fullname},</p>
                <p>We received a request to reset your password for your Polling App account. Please use the following OTP to continue with the password reset process:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #dc3545; font-size: 32px; margin: 0;">${otp}</h1>
                </div>
                <p><strong>This OTP will expire in 10 minutes.</strong></p>
                <p style="color: #dc3545;"><strong>Security Note:</strong> If you didn't request a password reset, please ignore this email and consider changing your password as a precaution.</p>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated email from Polling App. Please do not reply to this email.</p>
            </div>
        `;
    } else {
        // Default login/registration OTP
        subject = 'Verify Your Email - Polling App Registration';
        htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Polling App!</h2>
                <p>Hi ${fullname},</p>
                <p>Thank you for signing up! Please use the following OTP to verify your email address and complete your registration:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
                </div>
                <p><strong>This OTP will expire in 10 minutes.</strong></p>
                <p>If you didn't create an account with us, please ignore this email.</p>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated email from Polling App. Please do not reply to this email.</p>
            </div>
        `;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`${purpose === 'password_reset' ? 'Password reset' : 'Login'} OTP email sent successfully to ${email}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error(`Failed to send ${purpose === 'password_reset' ? 'password reset' : 'login'} OTP email`);
    }
};

module.exports = { sendOTP };