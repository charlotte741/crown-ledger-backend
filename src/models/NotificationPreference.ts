import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationPreference extends Document {
  userId: mongoose.Types.ObjectId;
  signup: boolean;
  login: boolean;
  passwordReset: boolean;
  welcome: boolean;
  securityAlert: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    signup: {
      type: Boolean,
      default: true,
    },
    login: {
      type: Boolean,
      default: true,
    },
    passwordReset: {
      type: Boolean,
      default: true,
    },
    welcome: {
      type: Boolean,
      default: true,
    },
    securityAlert: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);

export default NotificationPreference;