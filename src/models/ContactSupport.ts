import mongoose, { Document, Schema } from 'mongoose';

export interface IContactSupport extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  topic: 'Account' | 'Billing & Payments' | 'Transactions' | 'Technical issue' | 'Other';
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSupportSchema = new Schema<IContactSupport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      enum: ['Account', 'Billing & Payments', 'Transactions', 'Technical issue', 'Other'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ContactSupportSchema.index({ userId: 1, createdAt: -1 });
ContactSupportSchema.index({ status: 1 });
ContactSupportSchema.index({ topic: 1 });

const ContactSupport = mongoose.model<IContactSupport>('ContactSupport', ContactSupportSchema);

export default ContactSupport;
