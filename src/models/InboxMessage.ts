import mongoose, { Schema, Document } from 'mongoose';

export interface IInboxAttachment {
  filename: string;
  contentType: string;
  size?: number;
  resendAttachmentId?: string;
}

export interface IInboxMessage extends Document {
  threadId: mongoose.Types.ObjectId;
  direction: 'inbound' | 'outbound';
  resendEmailId?: string;
  messageId?: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  subject: string;
  text?: string;
  html?: string;
  attachments: IInboxAttachment[];
  sentByAdminId?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const InboxAttachmentSchema = new Schema<IInboxAttachment>(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number },
    resendAttachmentId: { type: String },
  },
  { _id: false }
);

const InboxMessageSchema = new Schema<IInboxMessage>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: 'InboxThread', required: true, index: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    // sparse+unique so retried webhook deliveries (Resend sends at-least-once)
    // can be deduped by Resend's own email id, without colliding across
    // inbound/outbound docs that don't set it.
    resendEmailId: { type: String, index: true, sparse: true, unique: true },
    messageId: { type: String },
    fromEmail: { type: String, required: true },
    fromName: { type: String },
    toEmail: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String },
    html: { type: String },
    attachments: { type: [InboxAttachmentSchema], default: [] },
    sentByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

InboxMessageSchema.index({ threadId: 1, createdAt: 1 });

export default mongoose.model<IInboxMessage>('InboxMessage', InboxMessageSchema);