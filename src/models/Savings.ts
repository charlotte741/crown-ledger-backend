import mongoose, { Schema, Document } from 'mongoose';

export interface ISavingsTransaction extends Document {
  type: 'deposit' | 'withdrawal' | 'interest';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  timestamp: Date;
}

export interface ISavings extends Document {
  userId: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalInterestEarned: number;
  apy: number; // Annual Percentage Yield (default 2.5%)
  minBalance: number;
  maxInsured: number; // FDIC insurance limit ($250K)
  lastInterestCalculated: Date;
  lastInterestAmount?: number;
  transactions: ISavingsTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const SavingsTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'interest'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const SavingsSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeposited: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    totalInterestEarned: {
      type: Number,
      default: 0,
    },
    apy: {
      type: Number,
      default: 2.5, // 2.5% APY
      min: 0,
    },
    minBalance: {
      type: Number,
      default: 0,
    },
    maxInsured: {
      type: Number,
      default: 250000, // FDIC insurance limit
    },
    lastInterestCalculated: {
      type: Date,
      default: Date.now,
    },
    lastInterestAmount: {
      type: Number,
      default: 0,
    },
    transactions: [SavingsTransactionSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISavings>('Savings', SavingsSchema);
