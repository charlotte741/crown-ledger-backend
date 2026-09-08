import User from '../models/User';
import Session from '../models/Session';
import mongoose from 'mongoose';

class SettingsService {
  /**
   * Get user profile
   */
  static async getProfile(userId: string | mongoose.Types.ObjectId) {
    try {
      const user = await User.findById(userId).select(
        'firstName lastName middleName email phoneNumber country currency accountType profilePhoto dateOfBirth createdAt'
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        country: user.country,
        currency: user.currency,
        accountType: user.accountType,
        profilePhoto: user.profilePhoto,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
      };
    } catch (error) {
      console.error('[SETTINGS] Error getting profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile (name, phone, DOB)
   */
  static async updateProfile(
    userId: string | mongoose.Types.ObjectId,
    updateData: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
      phoneNumber?: string;
      dateOfBirth?: Date;
    }
  ) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (updateData.firstName) user.firstName = updateData.firstName;
      if (updateData.lastName) user.lastName = updateData.lastName;
      if (updateData.middleName !== undefined) user.middleName = updateData.middleName;
      if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;
      if (updateData.dateOfBirth) user.dateOfBirth = updateData.dateOfBirth;

      await user.save();

      return {
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
      };
    } catch (error) {
      console.error('[SETTINGS] Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Upload profile photo
   */
  static async uploadProfilePhoto(userId: string | mongoose.Types.ObjectId, photoUrl: string) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      user.profilePhoto = photoUrl;
      await user.save();

      return {
        profilePhoto: user.profilePhoto,
      };
    } catch (error) {
      console.error('[SETTINGS] Error uploading profile photo:', error)
      throw error;
    }
  }

  /**
   * Get all active sessions for user
   */
  static async getActiveSessions(userId: string | mongoose.Types.ObjectId) {
    try {
      const sessions = await Session.find({ userId }).sort({ lastActivity: -1 });

      return sessions.map((session) => ({
        sessionId: session._id,
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        ipAddress: session.ipAddress,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
      }));
    } catch (error) {
      console.error('[SETTINGS] Error getting active sessions:', error);
      throw error;
    }
  }

  /**
   * Sign out from specific device
   */
  static async signOutDevice(
    userId: string | mongoose.Types.ObjectId,
    sessionId: string | mongoose.Types.ObjectId
  ) {
    try {
      const session = await Session.findOne({
        _id: sessionId,
        userId,
      });

      if (!session) {
        throw new Error('Session not found');
      }

      await Session.deleteOne({ _id: sessionId });

      return { message: 'Signed out from device successfully' };
    } catch (error) {
      console.error('[SETTINGS] Error signing out from device:', error);
      throw error;
    }
  }

  /**
   * Sign out from all devices
   */
  static async signOutAllDevices(userId: string | mongoose.Types.ObjectId) {
    try {
      const result = await Session.deleteMany({ userId });

      return {
        message: 'Signed out from all devices successfully',
        devicesLoggedOut: result.deletedCount,
      };
    } catch (error) {
      console.error('[SETTINGS] Error signing out from all devices:', error);
      throw error;
    }
  }

  /**
   * Delete user account permanently
   */
  static async deleteAccount(userId: string | mongoose.Types.ObjectId) {
    try {
      // Delete all user sessions
      await Session.deleteMany({ userId });

      // Delete user
      const result = await User.findByIdAndDelete(userId);

      if (!result) {
        throw new Error('User not found');
      }

      return {
        message: 'Account deleted permanently',
        email: result.email,
      };
    } catch (error) {
      console.error('[SETTINGS] Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Create session after login
   */
  static async createSession(
    userId: string | mongoose.Types.ObjectId,
    refreshToken: string,
    deviceInfo: {
      deviceName?: string;
      deviceType?: 'web' | 'mobile' | 'tablet' | 'desktop';
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    try {
      const session = await Session.create({
        userId,
        refreshToken,
        deviceName: deviceInfo.deviceName || 'Unknown Device',
        deviceType: deviceInfo.deviceType || 'web',
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      });

      return {
        sessionId: session._id,
        message: 'Session created',
      };
    } catch (error) {
      console.error('[SETTINGS] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update last activity for session
   */
  static async updateSessionActivity(sessionId: string | mongoose.Types.ObjectId) {
    try {
      await Session.updateOne({ _id: sessionId }, { lastActivity: new Date() });
    } catch (error) {
      console.error('[SETTINGS] Error updating session activity:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Delete session by refresh token
   */
  static async deleteSessionByToken(refreshToken: string) {
    try {
      await Session.deleteOne({ refreshToken });
    } catch (error) {
      console.error('[SETTINGS] Error deleting session:', error);
      // Don't throw - this is non-critical
    }
  }
}

export default SettingsService;
