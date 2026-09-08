import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestmentTransaction extends Document {
  type: 'buy' | 'sell' | 'dividend' | 'gain_update';
  amount: number;
  valueBefore: number;
  valueAfter: number;
  description?: string;
  timestamp: Date;
}

const InvestmentTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['buy', 'sell', 'dividend', 'gain_update'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  valueBefore: {
    type: Number,
    required: true,
  },
  valueAfter: {
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

export default InvestmentTransactionSchema;
