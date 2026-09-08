import mongoose, { Schema, Document } from 'mongoose';
import InvestmentTransactionSchema, { IInvestmentTransaction } from './InvestmentTransaction';

export interface IMonthlyPerformance {
  month: number; // 1-12
  year: number;
  value: number;
  return: number;
}

export interface IUserInvestment extends Document {
  userId: string;
  planId: mongoose.Types.ObjectId;
  planName: string;
  amountInvested: number;
  currentValue: number;
  totalGain: number;
  gainPercentage: number;
  monthlyPerformance: IMonthlyPerformance[];
  transactions: IInvestmentTransaction[];
  investmentDate: Date;
  maturityDate: Date;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  stripePaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const monthlyPerformanceSchema = new Schema<IMonthlyPerformance>({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  return: {
    type: Number,
    required: true,
  },
});

const userInvestmentSchema = new Schema<IUserInvestment>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentPlan',
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    amountInvested: {
      type: Number,
      required: true,
    },
    currentValue: {
      type: Number,
      required: true,
    },
    totalGain: {
      type: Number,
      required: true,
      default: 0,
    },
    gainPercentage: {
      type: Number,
      required: true,
      default: 0,
    },
    monthlyPerformance: [monthlyPerformanceSchema],
    transactions: [InvestmentTransactionSchema],
    investmentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    maturityDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'active',
    },
    stripePaymentId: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.UserInvestment ||
  mongoose.model<IUserInvestment>('UserInvestment', userInvestmentSchema);
