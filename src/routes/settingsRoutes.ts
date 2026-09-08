import { Router, Request, Response } from 'express';
import User from '../models/User';
import SettingsService from '../services/settingsService';
import NotificationService from '../services/notificationService';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Middleware to ensure user is authenticated
const protectedRoute = authMiddleware.verifyToken;

/**
 * GET /api/settings/profile
 * Get user profile information
 */
router.get('/profile', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const profile = await SettingsService.getProfile(userId);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile,
    });
  } catch (error: any) {
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
router.put('/profile', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { firstName, lastName, middleName, phoneNumber, dateOfBirth } = req.body;

    // Validate at least one field is provided
    if (!firstName && !lastName && !middleName && !phoneNumber && !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided',
      });
    }

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (middleName !== undefined) updateData.middleName = middleName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);

    const updated = await SettingsService.updateProfile(userId, updateData);

    await NotificationService.createNotification(
      userId,
      'security_alert',
      'Profile Updated',
      'Your profile information has been updated.',
      { updatedFields: Object.keys(updateData) }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    });
  } catch (error: any) {
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
router.post('/profile-photo', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Photo URL is required',
      });
    }

    const updated = await SettingsService.uploadProfilePhoto(userId, photoUrl);

    await NotificationService.createNotification(
      userId,
      'security_alert',
      'Profile Photo Updated',
      'Your profile photo has been updated.',
      { photoUrl }
    );

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: updated,
    });
  } catch (error: any) {
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
router.get('/sessions', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const sessions = await SettingsService.getActiveSessions(userId);

    res.status(200).json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: {
        totalSessions: sessions.length,
        sessions,
      },
    });
  } catch (error: any) {
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
router.delete('/sessions/:sessionId', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const sessionId = req.params.sessionId as string;

    const result = await SettingsService.signOutDevice(userId, sessionId);

    await NotificationService.createNotification(
      userId,
      'security_alert',
      'Signed Out From Device',
      'You have been signed out from one of your devices.',
      { sessionId }
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
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
router.post('/signout-all', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await SettingsService.signOutAllDevices(userId);

    await NotificationService.createNotification(
      userId,
      'security_alert',
      'Signed Out From All Devices',
      'You have been signed out from all devices.',
      {}
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        devicesLoggedOut: result.devicesLoggedOut,
      },
    });
  } catch (error: any) {
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
router.delete('/account', protectedRoute, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account',
      });
    }

    // Verify password before deletion
    const user = await User.findById(userId).select('+password');
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
    const result = await SettingsService.deleteAccount(userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
      },
    });
  } catch (error: any) {
    console.error('[SETTINGS] Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete account',
    });
  }
});

export default router;
