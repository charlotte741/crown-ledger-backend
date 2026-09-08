"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const WithdrawalRequest_1 = __importDefault(require("../models/WithdrawalRequest"));
class WalletService {
    async generateUniqueAccountNumber() {
        const MAX_ATTEMPTS = 10;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const firstDigit = crypto_1.default.randomInt(1, 10).toString();
            const rest = Array.from({ length: 9 }, () => crypto_1.default.randomInt(0, 10)).join('');
            const candidate = firstDigit + rest;
            const exists = await Wallet_1.default.exists({ accountNumber: candidate });
            if (!exists)
                return candidate;
        }
        throw new Error('Could not generate a unique account number, please retry');
    }
    async createWalletForUser(userId, currency = 'USD') {
        const existing = await Wallet_1.default.findOne({ userId });
        if (existing)
            return existing;
        const accountNumber = await this.generateUniqueAccountNumber();
        return Wallet_1.default.create({
            userId,
            accountNumber,
            balance: 0,
            currency,
            status: 'active'
        });
    }
    async getWalletByUserId(userId) {
        return Wallet_1.default.findOne({ userId });
    }
    async getWalletByAccountNumber(accountNumber) {
        return Wallet_1.default.findOne({ accountNumber });
    }
    async getPendingWithdrawalsTotal(walletId) {
        const result = await WithdrawalRequest_1.default.aggregate([
            { $match: { walletId: walletId, status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return result[0]?.total || 0;
    }
    async getAvailableBalance(wallet) {
        const pending = await this.getPendingWithdrawalsTotal(wallet._id.toString());
        return Math.max(0, wallet.balance - pending);
    }
}
exports.default = new WalletService();
