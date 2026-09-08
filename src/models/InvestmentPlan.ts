import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestmentPlan extends Document {
  name: string;
  description: string;
  minInvestment: number;
  duration: number; // in months
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedReturn: number; // percentage
  assetAllocation: {
    equities: number;
    realEstate: number;
    agriculture: number;
    bonds: number;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const investmentPlanSchema = new Schema<IInvestmentPlan>(
  {
    name: {
      type: String,
      required: true,
      enum: ['Premium Plan', 'Exclusive Plan', 'Supreme Plan', 'Real Estate Plan', 'Agricultural Plan'],
    },
    description: {
      type: String,
      required: true,
    },
    minInvestment: {
      type: Number,
      required: true,
      min: 50,
    },
    duration: {
      type: Number,
      required: true,
      min: 3,
      max: 5,
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High'],
    },
    expectedReturn: {
      type: Number,
      required: true,
      min: 40,
      max: 60,
    },
    assetAllocation: {
      equities: {
        type: Number,
        required: true,
        default: 0,
      },
      realEstate: {
        type: Number,
        required: true,
        default: 0,
      },
      agriculture: {
        type: Number,
        required: true,
        default: 0,
      },
      bonds: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
  },
  { timestamps: true }
);

export default mongoose.models.InvestmentPlan ||
  mongoose.model<IInvestmentPlan>('InvestmentPlan', investmentPlanSchema);
