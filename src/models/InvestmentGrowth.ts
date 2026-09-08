import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestmentGrowth extends Document {
  investmentId: mongoose.Types.ObjectId;
  userId: string;
  planId: string;
  date: Date;
  dayNumber: number;
  growthPercentage: number;
  previousValue: number;
  newValue: number;
  dailyGain: number;
  cumulativeGain: number;
  cumulativeGainPercentage: number;
  createdAt: Date;
}

const InvestmentGrowthSchema = new Schema(
  {
    investmentId: {
      type: Schema.Types.ObjectId,
      ref: 'UserInvestment',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    planId: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    dayNumber: {
      type: Number,
      required: true,
    },
    growthPercentage: {
      type: Number,
      required: true,
    },
    previousValue: {
      type: Number,
      required: true,
    },
    newValue: {
      type: Number,
      required: true,
    },
    dailyGain: {
      type: Number,
      required: true,
    },
    cumulativeGain: {
      type: Number,
      required: true,
    },
    cumulativeGainPercentage: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.model<IInvestmentGrowth>('InvestmentGrowth', InvestmentGrowthSchema);
