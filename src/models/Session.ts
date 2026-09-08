import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  deviceName: string;
  deviceType: 'web' | 'mobile' | 'tablet' | 'desktop';
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    deviceName: {
      type: String,
      default: 'Unknown Device',
    },
    deviceType: {
      type: String,
      enum: ['web', 'mobile', 'tablet', 'desktop'],
      default: 'web',
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expires: 0 }, // Auto-delete expired sessions
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;
