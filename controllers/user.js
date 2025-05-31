const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTP } = require('../services/emailService');

// Use environment variable or fallback to your current secret
const JWT_SECRET = process.env.JWT_SECRET ;

exports.registerUser = async (req, res) => {
    try {
        const { fullname, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Generate temporary token for OTP verification
        const tempToken = jwt.sign(
            { 
                userId: user._id,
                purpose: 'otp_verification',
                timestamp: Date.now()
            }, 
            JWT_SECRET, 
            { expiresIn: '15m' }
        );

        // Save OTP to user
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.tempToken = tempToken;
        user.isVerified = false;
        await user.save();

        console.log('Generated tempToken for user:', user._id, tempToken);

        // Send OTP via email
        try {
            await sendOTP(email, otp, user.fullname);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }

        res.status(200).json({
            message: 'OTP sent to your email',
            tempToken,
            requiresOTP: true,
            email: email // For display purposes
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// New OTP verification function
exports.verifyOTP = async (req, res) => {
    try {
        const { otp, tempToken } = req.body;

        console.log('OTP Verification - Received:', { otp, tempTokenLength: tempToken?.length });

        if (!tempToken || !otp) {
            return res.status(400).json({ message: 'OTP and token are required' });
        }

        // Verify temp token
        let decoded;
        try {
            decoded = jwt.verify(tempToken, JWT_SECRET);
            console.log('Token decoded successfully:', decoded);
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            return res.status(401).json({ message: 'Invalid or expired verification token' });
        }

        const user = await User.findById(decoded.userId);
        
        if (!user) {
            console.log('User not found for ID:', decoded.userId);
            return res.status(401).json({ message: 'User not found' });
        }

        console.log('User found:', user.email);
        console.log('Stored tempToken exists:', !!user.tempToken);

        // Check if this is the same temp token
        if (user.tempToken !== tempToken) {
            console.log('Token mismatch');
            return res.status(401).json({ message: 'Invalid verification session' });
        }

        // Check OTP
        if (!user.otp || user.otp !== otp) {
            console.log('OTP mismatch - stored:', user.otp, 'provided:', otp);
            return res.status(401).json({ message: 'Invalid OTP' });
        }

        // Check OTP expiry
        if (user.otpExpiry < new Date()) {
            console.log('OTP expired');
            return res.status(401).json({ message: 'OTP expired' });
        }

        // Clear OTP fields and generate main JWT token
        user.otp = null;
        user.otpExpiry = null;
        user.tempToken = null;
        user.isVerified = true;
        await user.save();

        // Generate main JWT token (same format as your original login)
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        console.log('OTP verification successful for user:', user.email);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Resend OTP function
exports.resendOTP = async (req, res) => {
    try {
        const { tempToken } = req.body;

        if (!tempToken) {
            return res.status(400).json({ message: 'Token is required' });
        }

        let decoded;
        try {
            decoded = jwt.verify(tempToken, JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const user = await User.findById(decoded.userId);

        if (!user || user.tempToken !== tempToken) {
            return res.status(404).json({ message: 'Invalid session' });
        }

        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendOTP(user.email, otp, user.fullname);

        res.status(200).json({ message: 'OTP resent successfully' });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// NEW: Forgot Password - Step 1: Send OTP to email
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate OTP for password reset
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Generate temporary token for password reset
        const tempToken = jwt.sign(
            { 
                userId: user._id,
                purpose: 'password_reset',
                timestamp: Date.now()
            }, 
            JWT_SECRET, 
            { expiresIn: '15m' }
        );

        // Save OTP and temp token to user
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.tempToken = tempToken;
        await user.save();

        console.log('Generated password reset tempToken for user:', user._id, tempToken);

        // Send OTP via email
        try {
            await sendOTP(email, otp, user.fullname, 'password_reset');
        } catch (emailError) {
            console.error('Password reset email sending failed:', emailError);
            return res.status(500).json({ message: 'Failed to send password reset OTP email' });
        }

        res.status(200).json({
            message: 'Password reset OTP sent to your email',
            tempToken,
            email: email
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// NEW: Verify OTP for Password Reset - Step 2
exports.verifyPasswordResetOTP = async (req, res) => {
    try {
        const { otp, tempToken } = req.body;

        console.log('Password Reset OTP Verification - Received:', { otp, tempTokenLength: tempToken?.length });

        if (!tempToken || !otp) {
            return res.status(400).json({ message: 'OTP and token are required' });
        }

        // Verify temp token
        let decoded;
        try {
            decoded = jwt.verify(tempToken, JWT_SECRET);
            console.log('Password reset token decoded successfully:', decoded);
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            return res.status(401).json({ message: 'Invalid or expired verification token' });
        }

        // Check if this is a password reset token
        if (decoded.purpose !== 'password_reset') {
            return res.status(401).json({ message: 'Invalid token purpose' });
        }

        const user = await User.findById(decoded.userId);
        
        if (!user) {
            console.log('User not found for ID:', decoded.userId);
            return res.status(401).json({ message: 'User not found' });
        }

        console.log('User found for password reset:', user.email);

        // Check if this is the same temp token
        if (user.tempToken !== tempToken) {
            console.log('Token mismatch for password reset');
            return res.status(401).json({ message: 'Invalid verification session' });
        }

        // Check OTP
        if (!user.otp || user.otp !== otp) {
            console.log('OTP mismatch for password reset - stored:', user.otp, 'provided:', otp);
            return res.status(401).json({ message: 'Invalid OTP' });
        }

        // Check OTP expiry
        if (user.otpExpiry < new Date()) {
            console.log('OTP expired for password reset');
            return res.status(401).json({ message: 'OTP expired' });
        }

        // Generate a password reset token (different from tempToken)
        const passwordResetToken = jwt.sign(
            { 
                userId: user._id,
                purpose: 'password_change',
                timestamp: Date.now()
            }, 
            JWT_SECRET, 
            { expiresIn: '5m' } // Short expiry for password change
        );

        // Clear OTP fields but keep user in password reset state
        user.otp = null;
        user.otpExpiry = null;
        user.tempToken = passwordResetToken; // Store the password reset token
        await user.save();

        console.log('Password reset OTP verification successful for user:', user.email);

        res.status(200).json({
            message: 'OTP verified successfully. You can now reset your password.',
            passwordResetToken,
            canResetPassword: true
        });

    } catch (error) {
        console.error('Password reset OTP verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// NEW: Reset Password - Step 3: Set new password
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword, passwordResetToken } = req.body;

        console.log('Password Reset - Received token length:', passwordResetToken?.length);

        if (!passwordResetToken || !newPassword) {
            return res.status(400).json({ message: 'Password reset token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Verify password reset token
        let decoded;
        try {
            decoded = jwt.verify(passwordResetToken, JWT_SECRET);
            console.log('Password reset token decoded successfully:', decoded);
        } catch (jwtError) {
            console.error('Password reset JWT verification failed:', jwtError.message);
            return res.status(401).json({ message: 'Invalid or expired password reset token' });
        }

        // Check if this is a password change token
        if (decoded.purpose !== 'password_change') {
            return res.status(401).json({ message: 'Invalid token purpose for password reset' });
        }

        const user = await User.findById(decoded.userId);
        
        if (!user) {
            console.log('User not found for password reset ID:', decoded.userId);
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if this is the same password reset token
        if (user.tempToken !== passwordResetToken) {
            console.log('Password reset token mismatch');
            return res.status(401).json({ message: 'Invalid password reset session' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password and clear reset fields
        user.password = hashedPassword;
        user.tempToken = null;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        console.log('Password reset successful for user:', user.email);

        res.status(200).json({
            message: 'Password reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all users (excluding sensitive information) - unchanged
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'fullname email _id').sort({ fullname: 1 });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};