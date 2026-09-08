"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const settingsService_1 = __importDefault(require("../services/settingsService"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const router = (0, express_1.Router)();
// Middleware to ensure user is authenticated
const protectedRoute = authMiddleware_1.default.verifyToken;
/**
 * GET /api/settings/profile
 * Get user profile information
 */
router.get('/profile', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const profile = await settingsService_1.default.getProfile(userId);
        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: profile,
        });
    }
    catch (error) {
        console.error('[SETTINGS] Error getting profile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get profile',
        });
    }
});
/**
 * PUT /api/settings/profile
 * Update user profile (name, phone, date of birth)
 */
router.put('/profile', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const { firstName, lastName, middleName, phoneNumber, dateOfBirth } = req.body;
        // Validate at least one field is provided
        if (!firstName && !lastName && !middleName && !phoneNumber && !dateOfBirth) {
            return res.status(400).json({
                success: false,
                message: 'At least one field must be provided',
            });
        }
        const updateData = {};
        if (firstName)
            updateData.firstName = firstName;
        if (lastName)
            updateData.lastName = lastName;
        if (middleName !== undefined)
            updateData.middleName = middleName;
        if (phoneNumber)
            updateData.phoneNumber = phoneNumber;
        if (dateOfBirth)
            updateData.dateOfBirth = new Date(dateOfBirth);
        const updated = await settingsService_1.default.updateProfile(userId, updateData);
        await notificationService_1.default.createNotification(userId, 'security_alert', 'Profile Updated', 'Your profile information has been updated.', { updatedFields: Object.keys(updateData) });
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updated,
        });
    }
    catch (error) {
        console.error('[SETTINGS] Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile',
        });
    }
});
/**
 * POST /api/settings/profile-photo
 * Upload profile photo (expects photoUrl in body)
 */
router.post('/profile-photo', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const { photoUrl } = req.body;
        if (!photoUrl) {
            return res.status(400).json({
                success: false,
                message: 'Photo URL is required',
            });
        }
        const updated = await settingsService_1.default.uploadProfilePhoto(userId, photoUrl);
        await notificationService_1.default.createNotification(userId, 'security_alert', 'Profile Photo Updated', 'Your profile photo has been updated.', { photoUrl });
        res.status(200).json({
            success: true,
            message: 'Profile photo uploaded successfully',
            data: updated,
        });
    }
    catch (error) {
        console.error('[SETTINGS] Error uploading profile photo:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload profile photo',
        });
    }
});
/**
 * GET /api/settings/sessions
 * Get all active sessions
 */
router.get('/sessions', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const sessions = await settingsService_1.default.getActiveSessions(userId);
        res.status(200).json({
            success: true,
            message: 'Sessions retrieved successfully',
            data: {
                totalSessions: sessions.length,
                sessions,
            },
        });
    }
    catch (error) {
        console.error('[SETTINGS] Error getting sessions:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get sessions',
        });
    }
});
/**
 * DELETE /api/settings/sessions/:sessionId
 * Sign out from a specific device
 */
router.delete('/sessions/:sessionId', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const sessionId = req.params.sessionId;
        const result = await settingsService_1.default.signOutDevice(userId, sessionId);
        await notificationService_1.default.createNotification(userId, 'security_alert', 'Signed Out From Device', 'You have been signed out from one of your devices.', { sessionId });
        res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error('[SETTINGS] Error signing out from device:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to sign out from device',
        });
    }
});
/**
 * POST /api/settings/signout-all
 * Sign out from all devices
 */
router.post('/signout-all', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await settingsService_1.default.signOutAllDevices(userId);
        await notificationService_1.default.createNotification(userId, 'security_alert', 'Signed Out From All Devices', 'You have been signed out from all devices.', {});
        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                devicesLoggedOut: result.devicesLoggedOut,
            },
        });
    }
    catch (error) {
        console.error('[SETTINGS] Error signing out from all devices:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to sign out from all devices',
        });
    }
});
/**
 * DELETE /api/settings/account
 * Permanently delete user account
 */
router.delete('/account', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account',
            });
        }
        // Verify password before deletion
        const user = await User_1.default.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        const { PasswordUtils } = require('../utils/helpers');
        const isPasswordValid = await PasswordUtils.comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password',
            });
        }
        // Delete account
        const result = await settingsService_1.default.deleteAccount(userId);
        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                email: result.email,
            },
        });
    }
    catch (error) {
        console.error('[SETTINGS] Error deleting account:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete account',
        });
    }
});
exports.default = router;
