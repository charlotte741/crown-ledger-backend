"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const savingsService_1 = __importDefault(require("../services/savingsService"));
class SavingsController {
    /**
     * Deposit money into savings
     */
    async deposit(req, res) {
        try {
            const { userId, amount } = req.body;
            if (!userId || !amount) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: userId, amount',
                });
                return;
            }
            if (amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Amount must be greater than 0',
                });
                return;
            }
            const savings = await savingsService_1.default.deposit(userId, amount);
            res.status(200).json({
                success: true,
                message: `Successfully deposited $${amount}`,
                data: {
                    balance: savings.balance,
                    totalDeposited: savings.totalDeposited,
                    totalInterestEarned: savings.totalInterestEarned,
                },
            });
        }
        catch (error) {
            const err = error;
            res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
    /**
     * Withdraw money from savings
     */
    async withdraw(req, res) {
        try {
            const { userId, amount } = req.body;
            if (!userId || !amount) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: userId, amount',
                });
                return;
            }
            if (amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Amount must be greater than 0',
                });
                return;
            }
            const savings = await savingsService_1.default.withdraw(userId, amount);
            res.status(200).json({
                success: true,
                message: `Successfully withdrew $${amount}`,
                data: {
                    balance: savings.balance,
                    totalWithdrawn: savings.totalWithdrawn,
                    totalInterestEarned: savings.totalInterestEarned,
                },
            });
        }
        catch (error) {
            const err = error;
            res.status(400).json({
                success: false,
                message: err.message,
            });
        }
    }
    /**
     * Get savings balance
     */
    async getBalance(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const savingsDetails = await savingsService_1.default.getSavingsDetails(userId);
            res.status(200).json({
                success: true,
                data: {
                    balance: savingsDetails.balance,
                    apy: savingsDetails.apy,
                    monthlyInterest: savingsDetails.monthlyInterest,
                    totalInterestEarned: savingsDetails.totalInterestEarned,
                    insured: savingsDetails.insured,
                },
            });
        }
        catch (error) {
            const err = error;
            res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
    /**
     * Get full savings account details
     */
    async getDetails(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const savingsDetails = await savingsService_1.default.getSavingsDetails(userId);
            res.status(200).json({
                success: true,
                data: savingsDetails,
            });
        }
        catch (error) {
            const err = error;
            res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
    /**
     * Get transaction history
     */
    async getTransactions(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const transactions = await savingsService_1.default.getTransactionHistory(userId, limit);
            res.status(200).json({
                success: true,
                data: {
                    transactions,
                    count: transactions.length,
                },
            });
        }
        catch (error) {
            const err = error;
            res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
}
exports.default = new SavingsController();
