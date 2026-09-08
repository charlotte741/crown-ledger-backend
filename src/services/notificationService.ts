import Notification, { INotification } from '../models/Notification';
import NotificationPreference, {
  INotificationPreference,
} from '../models/NotificationPreference';
import mongoose from 'mongoose';

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(
    userId: string | mongoose.Types.ObjectId,
    type:
      | 'signup'
      | 'login'
      | 'password_reset'
      | 'welcome'
      | 'security_alert',
    title: string,
    message: string,
    data?: any
  ): Promise<INotification | null> {
    try {
      // Check user preference for this notification type
      const preference =
        await NotificationPreference.findOne({ userId });

      // Map notification type to preference field
      const preferenceField = this.getPreferenceField(type);

      // If preference exists and user disabled this type, don't create notification
      if (
        preference &&
        preferenceField &&
        !preference[preferenceField as keyof INotificationPreference]
      ) {
        return null;
      }

      const notification = new Notification({
        userId,
        type,
        title,
        message,
        data: data || {},
        isRead: false,
      });

      return await notification.save();
    } catch (error) {
      console.error('[v0] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for a user with pagination
   */
  static async getNotifications(
    userId: string | mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    notifications: INotification[];
    total: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        Notification.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments({ userId }),
      ]);

      return {
        notifications,
        total,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('[v0] Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(
    userId: string | mongoose.Types.ObjectId
  ): Promise<number> {
    try {
      return await Notification.countDocuments({
        userId,
        isRead: false,
      });
    } catch (error) {
      console.error('[v0] Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(
    notificationId: string | mongoose.Types.ObjectId,
    userId: string | mongoose.Types.ObjectId
  ): Promise<INotification | null> {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      console.error('[v0] Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(
    userId: string | mongoose.Types.ObjectId
  ): Promise<number> {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      return result.modifiedCount;
    } catch (error) {
      console.error('[v0] Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Get or create notification preferences for a user
   */
  static async getOrCreatePreferences(
    userId: string | mongoose.Types.ObjectId
  ): Promise<INotificationPreference> {
    try {
      let preference =
        await NotificationPreference.findOne({ userId });

      if (!preference) {
        preference = new NotificationPreference({
          userId,
          signup: true,
          login: true,
          passwordReset: true,
          welcome: true,
          securityAlert: true,
        });
        await preference.save();
      }

      return preference;
    } catch (error) {
      console.error('[v0] Error getting/creating preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    userId: string | mongoose.Types.ObjectId,
    preferences: Partial<
      Omit<INotificationPreference, '_id' | 'userId' | 'createdAt' | 'updatedAt'>
    >
  ): Promise<INotificationPreference | null> {
    try {
      return await NotificationPreference.findOneAndUpdate(
        { userId },
        preferences,
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error('[v0] Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Delete old notifications (older than 30 days)
   */
  static async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const date = new Date();
      date.setDate(date.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: date },
      });
      return result.deletedCount;
    } catch (error) {
      console.error('[v0] Error deleting old notifications:', error);
      throw error;
    }
  }

  /**
   * Helper: Get preference field name from notification type
   */
  private static getPreferenceField(
    type:
      | 'signup'
      | 'login'
      | 'password_reset'
      | 'welcome'
      | 'security_alert'
  ): string {
    const fieldMap: Record<string, string> = {
      signup: 'signup',
      login: 'login',
      password_reset: 'passwordReset',
      welcome: 'welcome',
      security_alert: 'securityAlert',
    };
    return fieldMap[type];
  }
}

export default NotificationService;
