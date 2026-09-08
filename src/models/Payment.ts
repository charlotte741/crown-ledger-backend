import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: string;
  planId?: mongoose.Types.ObjectId; // Investment plan ID (optional for savings)
  investmentId?: mongoose.Types.ObjectId;
  savingsPlanId?: string; // Savings plan ID (for plan-specific deposits)
  savingsPlanName?: string; // Savings plan name (for reference)
  amount: number;
  currency: string;
  paymentReference: string; // Unique reference for payment
  paymentMethod: 'cashapp' | 'bitcoin';
  
  // Cash App fields
  cashAppTransactionId?: string;
  cashAppTag?: string;
  
  // Bitcoin fields
  bitcoinAddress?: string;
  bitcoinAmountUSD?: number;
  bitcoinAmountBTC?: number;
  bitcoinTransactionHash?: string;
  bitcoinConfirmations?: number;
  
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  verifiedAt?: Date;
  verificationNotes?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentPlan',
      required: false,
      default: null,
    },
    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserInvestment',
      default: null,
      required: false,
    },
    savingsPlanId: {
      type: String,
      required: false,
      default: null,
      index: true,
    },
    savingsPlanName: {
      type: String,
      required: false,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cashapp', 'bitcoin'],
      default: 'bitcoin',
    },
    // Cash App fields
    cashAppTransactionId: {
      type: String,
    },
    cashAppTag: {
      type: String,
      default: '$davechar1997',
    },
    // Bitcoin fields
    bitcoinAddress: {
      type: String,
    },
    bitcoinAmountUSD: {
      type: Number,
    },
    bitcoinAmountBTC: {
      type: Number,
    },
    bitcoinTransactionHash: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      index: true,
    },
    bitcoinConfirmations: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
    },
    verificationNotes: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment ||
  mongoose.model<IPayment>('Payment', paymentSchema);
