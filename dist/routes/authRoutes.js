"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validators_1 = require("../middleware/validators");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @body    firstName, lastName, middleName, username, email, phoneNumber, country, currency, accountType, pin, password, confirmPassword, agreedToTerms
 * @public
 */
router.post('/signup', validators_1.validateSignup, authController_1.AuthController.signup);
/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email with token
 * @body    token, email
 * @public
 */
router.post('/verify-email', validators_1.validateVerifyEmail, authController_1.AuthController.verifyEmail);
/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @body    email, password, rememberMe (optional)
 * @public
 */
router.post('/login', validators_1.validateLogin, authController_1.AuthController.login);
/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @body    refreshToken
 * @public
 */
router.post('/refresh-token', validators_1.validateRefreshToken, authController_1.AuthController.refreshToken);
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @body    email
 * @public
 */
router.post('/forgot-password', validators_1.validateForgotPassword, authController_1.AuthController.forgotPassword);
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @body    token, email, newPassword, confirmPassword
 * @public
 */
router.post('/reset-password', validators_1.validateResetPassword, authController_1.AuthController.resetPassword);
/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @body    oldPassword, newPassword, confirmPassword
 * @private (requires JWT authentication)
 */
router.post('/change-password', authMiddleware_1.authenticateToken, validators_1.validateChangePassword, authController_1.AuthController.changePassword);
exports.default = router;
