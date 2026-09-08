"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationService_1 = __importDefault(require("../services/notificationService"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const router = (0, express_1.Router)();
// Middleware to parse user from JWT
const protectedRoute = authMiddleware_1.default.verifyToken;
/**
 * GET /api/notifications/preferences
 * Get notification preferences for authenticated user
 */
router.get('/preferences', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const preferences = await notificationService_1.default.getOrCreatePreferences(userId);
        res.json({
            success: true,
            data: {
                signup: preferences.signup,
                login: preferences.login,
                passwordReset: preferences.passwordReset,
                welcome: preferences.welcome,
                securityAlert: preferences.securityAlert,
            },
        });
    }
    catch (error) {
        console.error('[v0] Error fetching preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch preferences',
            error: error.message,
        });
    }
});
/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const { signup, login, passwordReset, welcome, securityAlert } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const preferences = await notificationService_1.default.updatePreferences(userId, {
            signup: signup !== undefined ? signup : undefined,
            login: login !== undefined ? login : undefined,
            passwordReset: passwordReset !== undefined ? passwordReset : undefined,
            welcome: welcome !== undefined ? welcome : undefined,
            securityAlert: securityAlert !== undefined ? securityAlert : undefined,
        });
        res.json({
            success: true,
            message: 'Preferences updated successfully',
            data: {
                signup: preferences?.signup,
                login: preferences?.login,
                passwordReset: preferences?.passwordReset,
                welcome: preferences?.welcome,
                securityAlert: preferences?.securityAlert,
            },
        });
    }
    catch (error) {
        console.error('[v0] Error updating preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences',
            error: error.message,
        });
    }
});
/**
 * GET /api/notifications
 * Get all notifications for user (paginated)
 */
router.get('/', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        // Validate pagination
        if (page < 1) {
            return res.status(400).json({
                success: false,
                message: 'Page must be greater than 0',
            });
        }
        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be between 1 and 100',
            });
        }
        const result = await notificationService_1.default.getNotifications(userId, page, limit);
        res.json({
            success: true,
            data: result.notifications,
            pagination: {
                currentPage: page,
                totalPages: result.pages,
                totalNotifications: result.total,
                limit,
            },
        });
    }
    catch (error) {
        console.error('[v0] Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message,
        });
    }
});
/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const count = await notificationService_1.default.getUnreadCount(userId);
        res.json({
            success: true,
            unreadCount: count,
        });
    }
    catch (error) {
        console.error('[v0] Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message,
        });
    }
});
/**
 * PUT /api/notifications/:notificationId/read
 * Mark a specific notification as read
 */
router.put('/:notificationId/read', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        const notificationId = Array.isArray(req.params.notificationId)
            ? req.params.notificationId[0]
            : req.params.notificationId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const notification = await notificationService_1.default.markAsRead(notificationId, userId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }
        res.json({
            success: true,
            message: 'Notification marked as read',
            data: notification,
        });
    }
    catch (error) {
        console.error('[v0] Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message,
        });
    }
});
/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for user
 */
router.put('/read-all', protectedRoute, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        const modifiedCount = await notificationService_1.default.markAllAsRead(userId);
        res.json({
            success: true,
            message: 'All notifications marked as read',
            modifiedCount,
        });
    }
    catch (error) {
        console.error('[v0] Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all as read',
            error: error.message,
        });
    }
});
exports.default = router;
