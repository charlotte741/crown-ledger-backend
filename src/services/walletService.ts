import crypto from 'crypto';
import Wallet, {IWallet} from "../models/Wallet";
import WithdrawalRequest from '../models/WithdrawalRequest';
import { walletobjects } from 'googleapis/build/src/apis/walletobjects';

class WalletService {
    private async generateUniqueAccountNumber(): Promise<string> {
        const MAX_ATTEMPTS = 10;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const firstDigit = crypto.randomInt(1, 10).toString();
            const rest = Array.from({length: 9}, () => crypto.randomInt(0, 10)).join('');
            const candidate = firstDigit + rest;

            const exists = await Wallet.exists({accountNumber: candidate});
            if(!exists) return candidate;
        }

        throw new Error('Could not generate a unique account number, please retry')
    }


    async createWalletForUser(userId: string, currency: string = 'USD'): Promise<IWallet> {
        const existing = await Wallet.findOne({userId});
        if (existing) return existing;

        const accountNumber = await this.generateUniqueAccountNumber();

        return Wallet.create({
            userId,
            accountNumber,
            balance: 0,
            currency,
            status: 'active'
        });
    }

    async getWalletByUserId(userId: string): Promise<IWallet | null> {
        return Wallet.findOne({userId});
    }

    async getWalletByAccountNumber(accountNumber: string): Promise<IWallet | null> {
        return Wallet.findOne({accountNumber})
    }

    async getPendingWithdrawalsTotal(walletId: string): Promise<number> {
        const result = await WithdrawalRequest.aggregate([
            {$match: {walletId: walletId, status: 'pending'}},
            {$group: {_id: null, total: {$sum: '$amount'}}},
        ]);
        return result[0]?.total || 0
    }

    async getAvailableBalance(wallet: IWallet): Promise<number> {
        const pending = await this.getPendingWithdrawalsTotal(wallet._id.toString());
        return Math.max(0, wallet.balance - pending)
    }
}

export default new WalletService();