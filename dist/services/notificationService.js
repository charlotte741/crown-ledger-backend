"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const NotificationPreference_1 = __importDefault(require("../models/NotificationPreference"));
class NotificationService {
    /**
     * Create a new notification for a user
     */
    static async createNotification(userId, type, title, message, data) {
        try {
            // Check user preference for this notification type
            const preference = await NotificationPreference_1.default.findOne({ userId });
            // Map notification type to preference field
            const preferenceField = this.getPreferenceField(type);
            // If preference exists and user disabled this type, don't create notification
            if (preference &&
                preferenceField &&
                !preference[preferenceField]) {
                return null;
            }
            const notification = new Notification_1.default({
                userId,
                type,
                title,
                message,
                data: data || {},
                isRead: false,
            });
            return await notification.save();
        }
        catch (error) {
            console.error('[v0] Error creating notification:', error);
            throw error;
        }
    }
    /**
     * Get all notifications for a user with pagination
     */
    static async getNotifications(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [notifications, total] = await Promise.all([
                Notification_1.default.find({ userId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Notification_1.default.countDocuments({ userId }),
            ]);
            return {
                notifications,
                total,
                pages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            console.error('[v0] Error fetching notifications:', error);
            throw error;
        }
    }
    /**
     * Get unread notification count
     */
    static async getUnreadCount(userId) {
        try {
            return await Notification_1.default.countDocuments({
                userId,
                isRead: false,
            });
        }
        catch (error) {
            console.error('[v0] Error getting unread count:', error);
            throw error;
        }
    }
    /**
     * Mark a notification as read
     */
    static async markAsRead(notificationId, userId) {
        try {
            return await Notification_1.default.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true }, { new: true });
        }
        catch (error) {
            console.error('[v0] Error marking notification as read:', error);
            throw error;
        }
    }
    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId) {
        try {
            const result = await Notification_1.default.updateMany({ userId, isRead: false }, { isRead: true });
            return result.modifiedCount;
        }
        catch (error) {
            console.error('[v0] Error marking all as read:', error);
            throw error;
        }
    }
    /**
     * Get or create notification preferences for a user
     */
    static async getOrCreatePreferences(userId) {
        try {
            let preference = await NotificationPreference_1.default.findOne({ userId });
            if (!preference) {
                preference = new NotificationPreference_1.default({
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
        }
        catch (error) {
            console.error('[v0] Error getting/creating preferences:', error);
            throw error;
        }
    }
    /**
     * Update notification preferences
     */
    static async updatePreferences(userId, preferences) {
        try {
            return await NotificationPreference_1.default.findOneAndUpdate({ userId }, preferences, { new: true, upsert: true });
        }
        catch (error) {
            console.error('[v0] Error updating preferences:', error);
            throw error;
        }
    }
    /**
     * Delete old notifications (older than 30 days)
     */
    static async deleteOldNotifications(daysOld = 30) {
        try {
            const date = new Date();
            date.setDate(date.getDate() - daysOld);
            const result = await Notification_1.default.deleteMany({
                createdAt: { $lt: date },
            });
            return result.deletedCount;
        }
        catch (error) {
            console.error('[v0] Error deleting old notifications:', error);
            throw error;
        }
    }
    /**
     * Helper: Get preference field name from notification type
     */
    static getPreferenceField(type) {
        const fieldMap = {
            signup: 'signup',
            login: 'login',
            password_reset: 'passwordReset',
            welcome: 'welcome',
            security_alert: 'securityAlert',
        };
        return fieldMap[type];
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
