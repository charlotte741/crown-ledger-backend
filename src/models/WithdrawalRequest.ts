import mongoose, {Schema, Document} from 'mongoose';

export interface IWithdrawalRequest extends Document {
    userId: mongoose.Types.ObjectId;
    walletId: mongoose.Types.ObjectId;
    amount: number;
    bitcoinAddress: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: mongoose.Types.ObjectId;
    reviewNote?: string;
    reviewedAt?: Date;
    balanceBefore?: number;
    balanceAfter?: number;
    createdAt: Date;
    updatedAt: Date;
}

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        walletId: {
            type: Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
        },
        amount: {
            type: Number,
            required: [true, 'Withdrawal amount is required'],
            min: [0.00000001, 'Amount must be greater than zero'],
        },
        bitcoinAddress: {
            type: String,
            required: [true, 'Bitcoin wallet address is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewNote: {
            type: String,
        },
        reviewedAt: {
            type: Date,
        },
        balanceBefore: Number,
        balanceAfter: Number
    },
    {timestamps: true}
);

withdrawalRequestSchema.index({userId: 1, status: 1});
withdrawalRequestSchema.index({status: 1, createdAt: -1});

export default mongoose.model<IWithdrawalRequest>('WithdrawalRequest', withdrawalRequestSchema)