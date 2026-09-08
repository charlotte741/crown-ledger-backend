import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'signup' | 'login' | 'password_reset' | 'welcome' | 'security_alert' | 'investment_created' | 'payment_confirmed' | 'investment_matured';
  title: string;
  message: string;
  isRead: boolean;
  data?: {
    loginTime?: string;
    loginDevice?: string;
    resetTime?: string;
    investmentId?: string;
    investmentAmount?: number;
    planName?: string;
    paymentId?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['signup', 'login', 'password_reset', 'welcome', 'security_alert', 'investment_created', 'payment_confirmed', 'investment_matured'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

export default Notification;
