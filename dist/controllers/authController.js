"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const User_1 = __importDefault(require("../models/User"));
const tokenService_1 = __importDefault(require("../services/tokenService"));
const emailService_1 = __importDefault(require("../services/emailService"));
const walletService_1 = __importDefault(require("../services/walletService"));
const helpers_1 = require("../utils/helpers");
class AuthController {
    // SIGNUP
    static async signup(req, res) {
        try {
            const { firstName, lastName, middleName, username, email, phoneNumber, country, currency, accountType, pin, password, confirmPassword, agreedToTerms, } = req.body;
            // Validate all required fields
            if (!firstName ||
                !lastName ||
                !username ||
                !email ||
                !phoneNumber ||
                !country ||
                !currency ||
                !accountType ||
                !pin ||
                !password ||
                !confirmPassword) {
                res.status(400).json({ success: false, message: 'All required fields must be provided' });
                return;
            }
            // Validate terms acceptance
            if (!agreedToTerms) {
                res.status(400).json({ success: false, message: 'You must agree to terms and services' });
                return;
            }
            // Validate username
            const usernameValidation = helpers_1.UsernameUtils.validateUsername(username);
            if (!usernameValidation.isValid) {
                res.status(400).json({ success: false, message: usernameValidation.message });
                return;
            }
            // Validate email
            if (!helpers_1.EmailUtils.validateEmail(email)) {
                res.status(400).json({ success: false, message: 'Please provide a valid email address' });
                return;
            }
            // Validate phone number
            if (!helpers_1.PhoneUtils.validatePhoneNumber(phoneNumber)) {
                res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
                return;
            }
            // Validate PIN
            const pinValidation = helpers_1.PinUtils.validatePin(pin);
            if (!pinValidation.isValid) {
                res.status(400).json({ success: false, message: pinValidation.message });
                return;
            }
            // Validate password
            const passwordValidation = helpers_1.PasswordUtils.validatePassword(password);
            if (!passwordValidation.isValid) {
                res.status(400).json({ success: false, message: passwordValidation.message });
                return;
            }
            // Check password match
            if (password !== confirmPassword) {
                res.status(400).json({ success: false, message: 'Passwords do not match' });
                return;
            }
            // Check if user already exists
            const normalizedEmail = helpers_1.EmailUtils.normalizeEmail(email);
            const existingUser = await User_1.default.findOne({
                $or: [{ email: normalizedEmail }, { username }],
            });
            if (existingUser) {
                const field = existingUser.email === normalizedEmail ? 'email' : 'username';
                res.status(400).json({ success: false, message: `User with this ${field} already exists` });
                return;
            }
            // Hash PIN and Password
            const hashedPin = await helpers_1.PinUtils.hashPin(pin);
            const hashedPassword = await helpers_1.PasswordUtils.hashPassword(password);
            // Generate verification token
            const verificationToken = tokenService_1.default.generateVerificationToken();
            const verificationTokenExpiry = tokenService_1.default.getTokenExpiry(24); // 24 hours
            // Create new user
            const newUser = await User_1.default.create({
                firstName,
                lastName,
                middleName: middleName || undefined,
                username,
                email: normalizedEmail,
                phoneNumber,
                country,
                currency,
                accountType,
                pin: hashedPin,
                password: hashedPassword,
                emailVerificationToken: verificationToken,
                emailVerificationTokenExpiry: verificationTokenExpiry,
                agreedToTerms: true,
                isEmailVerified: false,
            });
            // Auto-create a wallet + account number for the new user.
            // Wallet creation failure should not block signup — log and continue;
            // it can be backfilled by an admin job if it ever happens.
            let wallet;
            try {
                wallet = await walletService_1.default.createWalletForUser(newUser._id.toString(), currency);
            }
            catch (walletError) {
                console.error('[AUTH] Error creating wallet for new user:', walletError);
            }
            // Generate verification link
            const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${normalizedEmail}`;
            // Send verification email
            const fullName = `${firstName} ${lastName}`;
            const emailHtml = emailService_1.default.generateVerificationEmailHtml(fullName, verificationLink);
            await emailService_1.default.sendEmail({
                to: normalizedEmail,
                subject: 'Verify Your Email - BankApp',
                html: emailHtml,
            });
            res.status(201).json({
                success: true,
                message: 'User registered successfully. Please verify your email to complete registration.',
                data: {
                    userId: newUser._id,
                    email: newUser.email,
                    username: newUser.username,
                    accountNumber: wallet?.accountNumber,
                },
            });
        }
        catch (error) {
            console.error('[AUTH] Signup error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error during signup',
            });
        }
    }
    // VERIFY EMAIL
    static async verifyEmail(req, res) {
        try {
            const { token, email } = req.body;
            if (!token || !email) {
                res.status(400).json({ success: false, message: 'Token and email are required' });
                return;
            }
            const normalizedEmail = helpers_1.EmailUtils.normalizeEmail(email);
            const user = await User_1.default.findOne({
                email: normalizedEmail,
                emailVerificationToken: token,
                emailVerificationTokenExpiry: { $gt: new Date() },
            }).select('+emailVerificationToken +emailVerificationTokenExpiry');
            if (!user) {
                res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
                return;
            }
            // Update user
            user.isEmailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationTokenExpiry = undefined;
            await user.save();
            // Send welcome email
            const fullName = `${user.firstName} ${user.lastName}`;
            const welcomeEmailHtml = emailService_1.default.generateWelcomeEmailHtml(fullName);
            await emailService_1.default.sendEmail({
                to: normalizedEmail,
                subject: 'Welcome to BankApp!',
                html: welcomeEmailHtml,
            });
            res.status(200).json({
                success: true,
                message: 'Email verified successfully. You can now login.',
            });
        }
        catch (error) {
            console.error('[AUTH] Verify email error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error verifying email',
            });
        }
    }
    // LOGIN
    static async login(req, res) {
        try {
            const { email, password, rememberMe } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, message: 'Email and password are required' });
                return;
            }
            // Check if user exists
            const normalizedEmail = helpers_1.EmailUtils.normalizeEmail(email);
            const user = await User_1.default.findOne({ email: normalizedEmail }).select('+password');
            if (!user) {
                res.status(401).json({ success: false, message: 'Invalid email or password' });
                return;
            }
            // Check if email is verified
            if (!user.isEmailVerified) {
                res.status(403).json({
                    success: false,
                    message: 'Please verify your email before logging in',
                });
                return;
            }
            // Compare password
            const isPasswordMatch = await helpers_1.PasswordUtils.comparePassword(password, user.password);
            if (!isPasswordMatch) {
                res.status(401).json({ success: false, message: 'Invalid email or password' });
                return;
            }
            // Generate tokens
            const accessToken = tokenService_1.default.generateAccessToken({
                userId: user._id.toString(),
                email: user.email,
            });
            const refreshToken = tokenService_1.default.generateRefreshToken({
                userId: user._id.toString(),
                email: user.email,
            });
            // Always save refresh token to database for security tracking
            user.refreshTokens.push(refreshToken);
            if (user.refreshTokens.length > 5) {
                user.refreshTokens.shift(); // Keep only last 5 tokens
            }
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            // Send login notification email
            const fullName = `${user.firstName} ${user.lastName}`;
            const notificationEmailHtml = emailService_1.default.generateLoginNotificationEmailHtml(fullName);
            await emailService_1.default.sendEmail({
                to: user.email,
                subject: 'New Login to Your BankApp Account',
                html: notificationEmailHtml,
            });
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        userId: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: user.username,
                        accountType: user.accountType,
                        isAdmin: Boolean(user.isAdmin),
                    },
                },
            });
        }
        catch (error) {
            console.error('[AUTH] Login error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error during login',
            });
        }
    }
    // REFRESH TOKEN
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({ success: false, message: 'Refresh token is required' });
                return;
            }
            // Verify refresh token
            const decoded = tokenService_1.default.verifyRefreshToken(refreshToken);
            if (!decoded) {
                res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
                return;
            }
            // Find user and check if token exists in refreshTokens array
            const user = await User_1.default.findById(decoded.userId);
            if (!user || !user.refreshTokens.includes(refreshToken)) {
                res.status(401).json({ success: false, message: 'Invalid refresh token' });
                return;
            }
            // Generate new access token
            const newAccessToken = tokenService_1.default.generateAccessToken({
                userId: user._id.toString(),
                email: user.email,
            });
            // Optional: Rotate refresh token for better security
            const newRefreshToken = tokenService_1.default.generateRefreshToken({
                userId: user._id.toString(),
                email: user.email,
            });
            // Replace old refresh token with new one
            const tokenIndex = user.refreshTokens.indexOf(refreshToken);
            if (tokenIndex > -1) {
                user.refreshTokens[tokenIndex] = newRefreshToken;
            }
            else {
                user.refreshTokens.push(newRefreshToken);
            }
            // Keep only last 5 tokens
            if (user.refreshTokens.length > 5) {
                user.refreshTokens = user.refreshTokens.slice(-5);
            }
            await user.save();
            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken, // Return new refresh token for rotation
                },
            });
        }
        catch (error) {
            console.error('[AUTH] Refresh token error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error refreshing token',
            });
        }
    }
    // FORGOT PASSWORD
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, message: 'Email is required' });
                return;
            }
            const normalizedEmail = helpers_1.EmailUtils.normalizeEmail(email);
            const user = await User_1.default.findOne({ email: normalizedEmail });
            // Always return success message for security (don't reveal if email exists)
            if (!user) {
                res.status(200).json({
                    success: true,
                    message: 'If an account with that email exists, a password reset link has been sent.',
                });
                return;
            }
            // Generate reset token
            const resetToken = tokenService_1.default.generateResetToken();
            const resetTokenExpiry = tokenService_1.default.getTokenExpiry(1); // 1 hour
            user.resetPasswordToken = resetToken;
            user.resetPasswordTokenExpiry = resetTokenExpiry;
            await user.save();
            // Generate reset link
            const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${normalizedEmail}`;
            // Send password reset email
            const fullName = `${user.firstName} ${user.lastName}`;
            const emailHtml = emailService_1.default.generatePasswordResetEmailHtml(fullName, resetLink);
            await emailService_1.default.sendEmail({
                to: normalizedEmail,
                subject: 'Password Reset Request - BankApp',
                html: emailHtml,
            });
            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
        }
        catch (error) {
            console.error('[AUTH] Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error processing forgot password request',
            });
        }
    }
    // RESET PASSWORD
    static async resetPassword(req, res) {
        try {
            const { token, email, newPassword, confirmPassword } = req.body;
            if (!token || !email || !newPassword || !confirmPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Token, email, new password, and confirm password are required',
                });
                return;
            }
            // Validate new password
            const passwordValidation = helpers_1.PasswordUtils.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                res.status(400).json({ success: false, message: passwordValidation.message });
                return;
            }
            // Check password match
            if (newPassword !== confirmPassword) {
                res.status(400).json({ success: false, message: 'Passwords do not match' });
                return;
            }
            const normalizedEmail = helpers_1.EmailUtils.normalizeEmail(email);
            const user = await User_1.default.findOne({
                email: normalizedEmail,
                resetPasswordToken: token,
                resetPasswordTokenExpiry: { $gt: new Date() },
            }).select('+password +resetPasswordToken +resetPasswordTokenExpiry');
            if (!user) {
                res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
                return;
            }
            // Hash new password
            const hashedPassword = await helpers_1.PasswordUtils.hashPassword(newPassword);
            // Update user
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordTokenExpiry = undefined;
            user.refreshTokens = []; // Clear all refresh tokens for security
            await user.save();
            res.status(200).json({
                success: true,
                message: 'Password reset successfully. Please login with your new password.',
            });
        }
        catch (error) {
            console.error('[AUTH] Reset password error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error resetting password',
            });
        }
    }
    // CHANGE PASSWORD (Authenticated user changes password)
    static async changePassword(req, res) {
        try {
            const { oldPassword, newPassword, confirmPassword } = req.body;
            const userId = req.userId; // From JWT middleware
            // Validate all required fields
            if (!oldPassword || !newPassword || !confirmPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Old password, new password, and confirm password are required',
                });
                return;
            }
            // Check if user is authenticated
            if (!userId) {
                res.status(401).json({ success: false, message: 'User not authenticated' });
                return;
            }
            // Find user with password field selected
            const user = await User_1.default.findById(userId).select('+password');
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            // Verify old password
            const isOldPasswordCorrect = await helpers_1.PasswordUtils.comparePassword(oldPassword, user.password);
            if (!isOldPasswordCorrect) {
                res.status(401).json({ success: false, message: 'Old password is incorrect' });
                return;
            }
            // Validate new password
            const passwordValidation = helpers_1.PasswordUtils.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                res.status(400).json({ success: false, message: passwordValidation.message });
                return;
            }
            // Check if new password matches old password
            const isSamePassword = await helpers_1.PasswordUtils.comparePassword(newPassword, user.password);
            if (isSamePassword) {
                res.status(400).json({
                    success: false,
                    message: 'New password cannot be the same as old password',
                });
                return;
            }
            // Check if new password and confirm password match
            if (newPassword !== confirmPassword) {
                res.status(400).json({ success: false, message: 'New passwords do not match' });
                return;
            }
            // Hash new password
            const hashedPassword = await helpers_1.PasswordUtils.hashPassword(newPassword);
            // Update user password and clear refresh tokens for security
            user.password = hashedPassword;
            user.refreshTokens = []; // Force re-login on all devices
            await user.save();
            // Send password change notification email
            const fullName = `${user.firstName} ${user.lastName}`;
            const emailHtml = emailService_1.default.generatePasswordChangeEmailHtml(fullName);
            await emailService_1.default.sendEmail({
                to: user.email,
                subject: 'Password Changed Successfully - BankApp',
                html: emailHtml,
            });
            res.status(200).json({
                success: true,
                message: 'Password changed successfully. Please login again on all devices.',
            });
        }
        catch (error) {
            console.error('[AUTH] Change password error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error changing password',
            });
        }
    }
}
exports.AuthController = AuthController;
