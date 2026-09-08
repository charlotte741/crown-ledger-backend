import mongoose, { Document, Schema } from 'mongoose';

export interface ISavingsTransaction extends Document {
  savingsPlanId: mongoose.Types.ObjectId;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'interest';
  amount: number;
  description: string;
  paymentId?: string; // For Bitcoin payments
  paymentReference?: string; // Bitcoin payment reference
  bitcoinTransactionHash?: string;
  status: 'completed' | 'pending' | 'failed';
  balanceBefore: number;
  balanceAfter: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsTransactionSchema = new Schema<ISavingsTransaction>(
  {
    savingsPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsPlan',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'interest'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      sparse: true,
    },
    paymentReference: {
      type: String,
      sparse: true,
    },
    bitcoinTransactionHash: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'pending',
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

// Index for querying transactions
SavingsTransactionSchema.index({ savingsPlanId: 1, timestamp: -1 });
SavingsTransactionSchema.index({ userId: 1, timestamp: -1 });

const SavingsTransaction = mongoose.model<ISavingsTransaction>(
  'SavingsTransaction',
  SavingsTransactionSchema
);
export default SavingsTransaction;
