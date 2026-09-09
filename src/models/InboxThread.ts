import mongoose, { Schema, Document } from 'mongoose';

export interface IInboxThread extends Document {
  participantEmail: string;
  participantName?: string;
  subject: string;
  status: 'open' | 'closed';
  lastMessageAt: Date;
  lastMessageSnippet: string;
  lastMessageDirection: 'inbound' | 'outbound';
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const InboxThreadSchema = new Schema<IInboxThread>(
  {
    participantEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    participantName: { type: String },
    subject: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    lastMessageAt: { type: Date, default: () => new Date(), index: true },
    lastMessageSnippet: { type: String, default: '' },
    lastMessageDirection: { type: String, enum: ['inbound', 'outbound'], default: 'inbound' },
    unreadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

InboxThreadSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.model<IInboxThread>('InboxThread', InboxThreadSchema);