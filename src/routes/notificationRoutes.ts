import { Router, Request, Response } from 'express';
import NotificationService from '../services/notificationService';
import authMiddleware from '../middleware/authMiddleware';
import { validationResult } from 'express-validator';

const router = Router();

// Middleware to parse user from JWT
const protectedRoute = authMiddleware.verifyToken;

/**
 * GET /api/notifications/preferences
 * Get notification preferences for authenticated user
 */
router.get('/preferences', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const preferences =
      await NotificationService.getOrCreatePreferences(userId);

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
  } catch (error) {
    console.error('[v0] Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: (error as Error).message,
    });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { signup, login, passwordReset, welcome, securityAlert } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const preferences = await NotificationService.updatePreferences(userId, {
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
  } catch (error) {
    console.error('[v0] Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/notifications
 * Get all notifications for user (paginated)
 */
router.get('/', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

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

    const result = await NotificationService.getNotifications(
      userId,
      page,
      limit
    );

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
  } catch (error) {
    console.error('[v0] Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error('[v0] Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: (error as Error).message,
    });
  }
});

/**
 * PUT /api/notifications/:notificationId/read
 * Mark a specific notification as read
 */
router.put(
  '/:notificationId/read',
  protectedRoute,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const notificationId = Array.isArray(req.params.notificationId)
        ? req.params.notificationId[0]
        : req.params.notificationId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const notification = await NotificationService.markAsRead(
        notificationId,
        userId
      );

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
    } catch (error) {
      console.error('[v0] Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: (error as Error).message,
      });
    }
  }
);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for user
 */
router.put('/read-all', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const modifiedCount = await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount,
    });
  } catch (error) {
    console.error('[v0] Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: (error as Error).message,
    });
  }
});

export default router;
