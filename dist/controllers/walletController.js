"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const Wallet_1 = __importDefault(require("../models/Wallet"));
const WithdrawalRequest_1 = __importDefault(require("../models/WithdrawalRequest"));
const walletService_1 = __importDefault(require("../services/walletService"));
const emailService_1 = __importDefault(require("../services/emailService"));
const User_1 = __importDefault(require("../models/User"));
const BTC_ADDRESS_REGEX = /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{25,90})$/;
class WalletController {
    /**
     * @route GET /api/wallet/me
     * @access Private
     */
    static async getMyWallet(req, res) {
        try {
            const userId = req.userId;
            const wallet = await Wallet_1.default.findOne({ userId });
            if (!wallet) {
                res.status(404).json({ success: false, message: 'Wallet not found for this user' });
                return;
            }
            const availableBalance = await walletService_1.default.getAvailableBalance(wallet);
            res.status(200).json({
                success: true,
                data: {
                    walletId: wallet._id,
                    accountNumber: wallet.accountNumber,
                    balance: wallet.balance,
                    availableBalance,
                    currency: wallet.currency,
                    status: wallet.status,
                },
            });
        }
        catch (error) {
            console.error('[WALLET] Error fetching wallet:', error);
            res.status(500).json({ success: false, message: error.message || 'Error fetching wallet' });
        }
    }
    /**
     * @route POST /api/wallet/withdraw
     * @body amount, bitcoinAddress
     * @access Private
     */
    static async requestWithdrawal(req, res) {
        try {
            const userId = req.userId;
            const { amount, bitcoinAddress } = req.body;
            if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
                res.status(400).json({ success: false, message: 'A valid withdrawal amount is required' });
                return;
            }
            if (!bitcoinAddress || typeof bitcoinAddress !== 'string') {
                res.status(400).json({ success: false, message: 'Bitcoin wallet address is required' });
                return;
            }
            if (!BTC_ADDRESS_REGEX.test(bitcoinAddress.trim())) {
                res.status(400).json({ success: false, message: 'Please provide a valid Bitcoin wallet address' });
                return;
            }
            const wallet = await Wallet_1.default.findOne({ userId });
            if (!wallet) {
                res.status(404).json({ success: false, message: 'Wallet not found for this user' });
                return;
            }
            if (wallet.status !== 'active') {
                res.status(403).json({ success: false, message: 'This wallet is not currently active' });
                return;
            }
            const availableBalance = await walletService_1.default.getAvailableBalance(wallet);
            if (amount > availableBalance) {
                res.status(400).json({
                    success: false,
                    message: `Insufficient available balance. Available: ${availableBalance} ${wallet.currency}`,
                });
                return;
            }
            const withdrawalRequest = await WithdrawalRequest_1.default.create({
                userId,
                walletId: wallet._id,
                amount,
                bitcoinAddress: bitcoinAddress.trim(),
                status: 'pending',
            });
            // Notify admin(s) — wire up an admin distribution list/env var as needed
            try {
                const user = await User_1.default.findById(userId);
                if (process.env.ADMIN_NOTIFICATION_EMAIL) {
                    const html = emailService_1.default.generateWithdrawalRequestAdminEmailHtml(`${user?.firstName} ${user?.lastName}`, wallet.accountNumber, amount, bitcoinAddress.trim());
                    await emailService_1.default.sendEmail({
                        to: process.env.ADMIN_NOTIFICATION_EMAIL,
                        subject: 'New Withdrawal Request Pending Review - Crown Ledger',
                        html,
                    });
                }
            }
            catch (emailError) {
                console.error('[WALLET] Error sending admin withdrawal notification:', emailError);
            }
            res.status(201).json({
                success: true,
                message: 'Withdrawal request submitted and pending admin review',
                data: withdrawalRequest,
            });
        }
        catch (error) {
            console.error('[WALLET] Error creating withdrawal request:', error);
            res.status(500).json({ success: false, message: error.message || 'Error creating withdrawal request' });
        }
    }
    /**
     * @route GET /api/wallet/withdrawals
     * @access Private
     */
    static async getMyWithdrawals(req, res) {
        try {
            const userId = req.userId;
            const withdrawals = await WithdrawalRequest_1.default.find({ userId }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: withdrawals });
        }
        catch (error) {
            console.error('[WALLET] Error fetching withdrawal history:', error);
            res.status(500).json({ success: false, message: error.message || 'Error fetching withdrawal history' });
        }
    }
}
exports.WalletController = WalletController;
