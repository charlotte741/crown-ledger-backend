"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Savings_1 = __importDefault(require("../models/Savings"));
const emailService_1 = __importDefault(require("./emailService"));
const User_1 = __importDefault(require("../models/User"));
class SavingsService {
    /**
     * Create savings account for new user
     */
    async createSavingsAccount(userId) {
        try {
            const existingSavings = await Savings_1.default.findOne({ userId });
            if (existingSavings) {
                console.log(`[SAVINGS] Savings account already exists for user ${userId}`);
                return existingSavings;
            }
            const savings = new Savings_1.default({
                userId,
                balance: 0,
                apy: 15, // 15% APY
                totalDeposited: 0,
                totalWithdrawn: 0,
                totalInterestEarned: 0,
            });
            await savings.save();
            // Send savings account welcome email
            try {
                const user = await User_1.default.findById(userId);
                if (user && user.email) {
                    const emailHtml = emailService_1.default.generateSavingsWelcomeEmailHtml(user.firstName || 'Valued User', savings.apy);
                    await emailService_1.default.sendEmail({
                        to: user.email,
                        subject: `Welcome to Crown Ledger Savings - ${savings.apy}% APY`,
                        html: emailHtml,
                    });
                    console.log(`[SAVINGS] Welcome email sent to ${user.email}`);
                }
            }
            catch (emailError) {
                console.error('[SAVINGS] Error sending welcome email:', emailError);
                // Don't throw - email failure shouldn't block savings account creation
            }
            console.log(`[SAVINGS] Created savings account for user ${userId}`);
            return savings;
        }
        catch (error) {
            console.error('[SAVINGS] Error creating savings account:', error);
            throw error;
        }
    }
    /**
     * Get savings account for user
     */
    async getSavingsAccount(userId) {
        try {
            return await Savings_1.default.findOne({ userId });
        }
        catch (error) {
            console.error('[SAVINGS] Error getting savings account:', error);
            throw error;
        }
    }
    /**
     * Deposit money into savings
     */
    async deposit(userId, amount) {
        try {
            if (amount <= 0) {
                throw new Error('Deposit amount must be greater than 0');
            }
            let savings = await this.getSavingsAccount(userId);
            if (!savings) {
                savings = await this.createSavingsAccount(userId);
            }
            const balanceBefore = savings.balance;
            const balanceAfter = balanceBefore + amount;
            // Add transaction record
            savings.transactions.push({
                type: 'deposit',
                amount,
                balanceBefore,
                balanceAfter,
                description: `Deposit of $${amount}`,
                timestamp: new Date(),
            });
            savings.balance = balanceAfter;
            savings.totalDeposited = (savings.totalDeposited || 0) + amount;
            await savings.save();
            console.log(`[SAVINGS] Deposited $${amount} for user ${userId}. New balance: $${balanceAfter}`);
            return savings;
        }
        catch (error) {
            console.error('[SAVINGS] Error depositing:', error);
            throw error;
        }
    }
    /**
     * Withdraw money from savings
     */
    async withdraw(userId, amount) {
        try {
            if (amount <= 0) {
                throw new Error('Withdrawal amount must be greater than 0');
            }
            let savings = await this.getSavingsAccount(userId);
            if (!savings) {
                throw new Error('Savings account not found');
            }
            if (savings.balance < amount) {
                throw new Error(`Insufficient balance. Current balance: $${savings.balance}, Requested: $${amount}`);
            }
            const balanceBefore = savings.balance;
            const balanceAfter = balanceBefore - amount;
            // Add transaction record
            savings.transactions.push({
                type: 'withdrawal',
                amount,
                balanceBefore,
                balanceAfter,
                description: `Withdrawal of $${amount}`,
                timestamp: new Date(),
            });
            savings.balance = balanceAfter;
            savings.totalWithdrawn = (savings.totalWithdrawn || 0) + amount;
            await savings.save();
            console.log(`[SAVINGS] Withdrew $${amount} for user ${userId}. New balance: $${balanceAfter}`);
            return savings;
        }
        catch (error) {
            console.error('[SAVINGS] Error withdrawing:', error);
            throw error;
        }
    }
    /**
     * Calculate and apply daily interest
     */
    async calculateDailyInterest(userId) {
        try {
            let savings = await this.getSavingsAccount(userId);
            if (!savings) {
                return 0;
            }
            // Calculate daily interest: balance * (APY / 365 / 100)
            const dailyInterestRate = (savings.apy / 365) / 100;
            const dailyInterest = savings.balance * dailyInterestRate;
            if (dailyInterest > 0) {
                const balanceBefore = savings.balance;
                const balanceAfter = balanceBefore + dailyInterest;
                // Add interest transaction
                savings.transactions.push({
                    type: 'interest',
                    amount: dailyInterest,
                    balanceBefore,
                    balanceAfter,
                    description: `Daily interest (${savings.apy}% APY)`,
                    timestamp: new Date(),
                });
                savings.balance = balanceAfter;
                savings.totalInterestEarned = (savings.totalInterestEarned || 0) + dailyInterest;
                savings.lastInterestCalculated = new Date();
                savings.lastInterestAmount = dailyInterest;
                await savings.save();
                console.log(`[SAVINGS] User ${userId} - Balance: $${balanceBefore.toFixed(2)}, Daily Interest Rate: ${((savings.apy / 365 / 100) * 100).toFixed(6)}%, Interest Earned: $${dailyInterest.toFixed(8)}`);
            }
            return dailyInterest;
        }
        catch (error) {
            console.error('[SAVINGS] Error calculating interest:', error);
            throw error;
        }
    }
    /**
     * Get savings details with calculated interest
     */
    async getSavingsDetails(userId) {
        try {
            const savings = await this.getSavingsAccount(userId);
            if (!savings) {
                return {
                    userId,
                    balance: 0,
                    totalDeposited: 0,
                    totalWithdrawn: 0,
                    totalInterestEarned: 0,
                    apy: 2.5,
                    maxInsured: 250000,
                    monthlyInterest: 0,
                    annualInterest: 0,
                    insured: true,
                    createdAt: new Date(),
                };
            }
            const monthlyInterest = (savings.balance * (savings.apy / 12)) / 100;
            const annualInterest = (savings.balance * savings.apy) / 100;
            return {
                userId: savings.userId,
                balance: savings.balance,
                totalDeposited: savings.totalDeposited,
                totalWithdrawn: savings.totalWithdrawn,
                totalInterestEarned: savings.totalInterestEarned,
                apy: savings.apy,
                maxInsured: savings.maxInsured,
                monthlyInterest: parseFloat(monthlyInterest.toFixed(2)),
                annualInterest: parseFloat(annualInterest.toFixed(2)),
                insured: savings.balance <= savings.maxInsured,
                lastInterestCalculated: savings.lastInterestCalculated,
                lastInterestAmount: savings.lastInterestAmount,
                createdAt: savings.createdAt,
                updatedAt: savings.updatedAt,
            };
        }
        catch (error) {
            console.error('[SAVINGS] Error getting savings details:', error);
            throw error;
        }
    }
    /**
     * Get transaction history
     */
    async getTransactionHistory(userId, limit = 50) {
        try {
            const savings = await this.getSavingsAccount(userId);
            if (!savings) {
                return [];
            }
            return savings.transactions.slice(-limit).reverse();
        }
        catch (error) {
            console.error('[SAVINGS] Error getting transaction history:', error);
            throw error;
        }
    }
    /**
     * Get savings summary
     */
    async getSavingsSummary(userId) {
        try {
            const savings = await this.getSavingsAccount(userId);
            if (!savings) {
                return {
                    balance: 0,
                    monthlyInterest: 0,
                    apy: 2.5,
                };
            }
            const monthlyInterest = (savings.balance * (savings.apy / 12)) / 100;
            return {
                balance: savings.balance,
                monthlyInterest: parseFloat(monthlyInterest.toFixed(2)),
                apy: savings.apy,
                totalInterestEarned: savings.totalInterestEarned,
            };
        }
        catch (error) {
            console.error('[SAVINGS] Error getting savings summary:', error);
            throw error;
        }
    }
    /**
     * Calculate all user savings interest (for daily job)
     */
    async calculateAllUserInterest() {
        try {
            const allSavingsAccounts = await Savings_1.default.find({});
            let totalInterestApplied = 0;
            for (const account of allSavingsAccounts) {
                const interest = await this.calculateDailyInterest(account.userId);
                totalInterestApplied += interest;
            }
            console.log(`[SAVINGS] Applied total daily interest to ${allSavingsAccounts.length} accounts: $${totalInterestApplied.toFixed(8)}`);
            return totalInterestApplied;
        }
        catch (error) {
            console.error('[SAVINGS] Error calculating all user interest:', error);
            throw error;
        }
    }
    /**
     * Mark savings deposit as completed after payment verification
     * This is called after Bitcoin payment is verified
     */
    async completeSavingsDeposit(userId, amount, paymentId) {
        try {
            if (amount <= 0) {
                throw new Error('Deposit amount must be greater than 0');
            }
            let savings = await this.getSavingsAccount(userId);
            if (!savings) {
                savings = await this.createSavingsAccount(userId);
            }
            const balanceBefore = savings.balance;
            const balanceAfter = balanceBefore + amount;
            // Add deposit transaction with payment reference
            savings.transactions.push({
                type: 'deposit',
                amount,
                balanceBefore,
                balanceAfter,
                description: `Savings deposit of $${amount} via Bitcoin payment`,
                paymentId,
                timestamp: new Date(),
            });
            savings.balance = balanceAfter;
            savings.totalDeposited = (savings.totalDeposited || 0) + amount;
            await savings.save();
            // Send deposit confirmation email
            try {
                const user = await User_1.default.findById(userId);
                if (user && user.email) {
                    const monthlyInterest = (balanceAfter * (savings.apy / 12)) / 100;
                    const emailHtml = emailService_1.default.generateSavingsDepositConfirmationEmailHtml(user.firstName || 'Valued User', amount, balanceAfter, monthlyInterest);
                    await emailService_1.default.sendEmail({
                        to: user.email,
                        subject: 'Savings Deposit Confirmed - Crown Ledger',
                        html: emailHtml,
                    });
                    console.log(`[SAVINGS] Deposit confirmation email sent to ${user.email}`);
                }
            }
            catch (emailError) {
                console.error('[SAVINGS] Error sending deposit confirmation email:', emailError);
            }
            console.log(`[SAVINGS] Completed savings deposit of $${amount} for user ${userId}. New balance: $${balanceAfter}`);
            return savings;
        }
        catch (error) {
            console.error('[SAVINGS] Error completing savings deposit:', error);
            throw error;
        }
    }
}
exports.default = new SavingsService();
