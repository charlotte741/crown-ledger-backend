import mongoose, {Schema, Document} from 'mongoose';

export interface IWallet extends Document {
    userId: mongoose.Types.ObjectId;
    accountNumber: string;
    balance: number;
    currency: string;
    status: 'active' | 'frozen';
    createdAt: Date;
    updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        accountNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        balance: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'Balance cannot be negative'],
        },
        currency: {
            type: String,
            required: true,
            default: 'USD',
        },
        status: {
            type: String,
            enum: ['active', 'frozen'],
            default: 'active',
        },
    },
    {timestamps: true}
);

export default mongoose.model<IWallet>('Wallet', walletSchema);