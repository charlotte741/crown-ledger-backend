import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  actionType: string;
  targetUserId: mongoose.Types.ObjectId;
  details: {
    [key: string]: any;
  };
  timestamp: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'update_savings_balance',
        'update_investment_balance',
        'credit_wallet',
        'approve_withdrawal',
        'reject_withdrawal',
        'send_custom_email',
        'view_user_details',
        'modify_user_status',
        'other',
      ],
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
  },
  { timestamps: false }
);

// Index for efficient querying
AdminAuditLogSchema.index({ adminId: 1, timestamp: -1 });
AdminAuditLogSchema.index({ targetUserId: 1, timestamp: -1 });
AdminAuditLogSchema.index({ actionType: 1, timestamp: -1 });

export default mongoose.model<IAdminAuditLog>(
  'AdminAuditLog',
  AdminAuditLogSchema
);
