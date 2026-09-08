import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateRefreshToken,
  validateChangePassword,
} from '../middleware/validators';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @body    firstName, lastName, middleName, username, email, phoneNumber, country, currency, accountType, pin, password, confirmPassword, agreedToTerms
 * @public
 */
router.post('/signup', validateSignup, AuthController.signup);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email with token
 * @body    token, email
 * @public
 */
router.post('/verify-email', validateVerifyEmail, AuthController.verifyEmail);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @body    email, password, rememberMe (optional)
 * @public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @body    refreshToken
 * @public
 */
router.post('/refresh-token', validateRefreshToken, AuthController.refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @body    email
 * @public
 */
router.post('/forgot-password', validateForgotPassword, AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @body    token, email, newPassword, confirmPassword
 * @public
 */
router.post('/reset-password', validateResetPassword, AuthController.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @body    oldPassword, newPassword, confirmPassword
 * @private (requires JWT authentication)
 */
router.post(
  '/change-password',
  authenticateToken,
  validateChangePassword,
  AuthController.changePassword
);

export default router;
