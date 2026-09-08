import mongoose, { Document, Schema } from 'mongoose';

export interface ISavingsPlan extends Document {
  userId: string;
  planName: string;
  category: 'business' | 'personal' | 'rent' | 'school_fees' | 'birthday' | 'emergency' | 'gadget' | 'eid' | 'real_estate' | 'summer_holiday' | 'travel' | 'automobile' | 'christmas' | 'detty_december' | 'new_year' | 'other';
  targetAmount: number;
  currentAmount: number;
  earnInterest: boolean;
  interestRate: number; // 12% APY
  duration: 3 | 6 | 9 | 12; // months
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  nextDepositDueDate: Date;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  totalInterestEarned: number;
  progressPercentage: number;
  expectedInterest: number; // Total expected interest for the plan
  isDefault: boolean; // Whether it's a default plan template
  transactions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SavingsPlanSchema = new Schema<ISavingsPlan>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    planName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'business',
        'personal',
        'rent',
        'school_fees',
        'birthday',
        'emergency',
        'gadget',
        'eid',
        'real_estate',
        'summer_holiday',
        'travel',
        'automobile',
        'christmas',
        'detty_december',
        'new_year',
        'other',
      ],
      required: false,  // ✅ Make optional
      default: null,
    },
    targetAmount: {
      type: Number,
      required: false,  // ✅ Make optional
      default: 0,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    earnInterest: {
      type: Boolean,
      default: true,
    },
    interestRate: {
      type: Number,
      default: 12, // 12% APY
    },
    duration: {
      type: Number,
      enum: [3, 6, 9, 12],
      required: false,
      default: null
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: false,
      default: null
    },
    startDate: {
      type: Date,
      default: () => new Date(),
    },
    endDate: {
      type: Date,
      required: false,
      default: null
    },
    nextDepositDueDate: {
      type: Date,
      required: false,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'paused', 'completed', 'cancelled'],  // ✅ Add 'pending' to enum
      default: 'pending',
    },
    totalInterestEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    expectedInterest: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    transactions: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'SavingsTransaction',
      default: [],
    },
  },
  { timestamps: true }
);

// Index for finding user's plans
SavingsPlanSchema.index({ userId: 1, status: 1 });

const SavingsPlan = mongoose.model<ISavingsPlan>('SavingsPlan', SavingsPlanSchema);
export default SavingsPlan;
