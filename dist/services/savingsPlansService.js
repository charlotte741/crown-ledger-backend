"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SavingsPlan_1 = __importDefault(require("../models/SavingsPlan"));
const SavingsTransaction_1 = __importDefault(require("../models/SavingsTransaction"));
const emailService_1 = __importDefault(require("./emailService"));
const mongoose_1 = __importDefault(require("mongoose"));
class SavingsPlansService {
    constructor() {
        /**
         * Default savings plans
         */
        this.defaultPlans = [
            {
                planName: 'Save for Rainy Days',
                category: 'emergency',
                description: 'Emergency fund for unexpected expenses',
            },
            {
                planName: 'Detty December Funds',
                category: 'detty_december',
                description: 'Save for December celebrations and festivities',
            },
            {
                planName: 'Mark the Big Milestone',
                category: 'personal',
                description: 'Save for important life milestones',
            },
            {
                planName: 'Travel More Stress Less',
                category: 'travel',
                description: 'Save for your dream vacation',
            },
        ];
    }
    /**
     * Create a new savings plan (step-by-step creation - other fields optional)
     */
    async createPlan(userId, planName, description, category, targetAmount, earnInterest = false, duration, frequency) {
        try {
            const startDate = new Date();
            let endDate;
            let nextDepositDueDate;
            let expectedInterest = 0;
            // Only calculate dates and interest if duration and frequency are provided
            if (duration) {
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + duration);
                nextDepositDueDate = frequency ? this.calculateNextDepositDate(startDate, frequency) : startDate;
            }
            // Calculate expected interest only if target amount is provided
            if (targetAmount && earnInterest) {
                expectedInterest = (targetAmount * 12) / 100; // 12% APY
            }
            const plan = new SavingsPlan_1.default({
                userId,
                planName,
                description: description || '',
                category: category || null,
                targetAmount: targetAmount || 0,
                currentAmount: 0,
                earnInterest,
                interestRate: 12,
                duration: duration || null,
                frequency: frequency || null,
                startDate,
                endDate: endDate || null,
                nextDepositDueDate: nextDepositDueDate || null,
                status: 'pending', // Set to pending until all required fields are configured
                expectedInterest,
                totalInterestEarned: 0,
                progressPercentage: 0,
                isDefault: false,
            });
            await plan.save();
            console.log(`[SAVINGS] Created plan: ${planName} for user ${userId}`);
            // Send plan creation email (if all required fields are provided)
            if (category && targetAmount && duration && frequency) {
                try {
                    // Get user from database to retrieve email - adjust based on your User model
                    // This assumes you have access to user email via userId
                    const User = require('../models/User'); // Adjust path as needed
                    const user = await User.findById(userId).select('email fullName');
                    if (user && user.email) {
                        const emailHtml = emailService_1.default.generateSavingsPlanCreatedEmailHtml(user.fullName || 'User', planName, targetAmount, duration, frequency);
                        await emailService_1.default.sendEmail({
                            to: user.email,
                            subject: `Your Savings Plan "${planName}" Has Been Created`,
                            html: emailHtml,
                        });
                        console.log(`[EMAIL] Savings plan creation email sent to ${user.email}`);
                    }
                }
                catch (emailError) {
                    console.error('[EMAIL] Error sending plan creation email:', emailError);
                    // Don't throw - email failure shouldn't block plan creation
                }
            }
            return plan;
        }
        catch (error) {
            console.error('[SAVINGS] Error creating plan:', error);
            throw error;
        }
    }
    /**
     * Get all plans for a user
     */
    async getUserPlans(userId, status) {
        try {
            const query = { userId };
            if (status) {
                query.status = status;
            }
            const plans = await SavingsPlan_1.default.find(query).sort({ createdAt: -1 });
            return plans;
        }
        catch (error) {
            console.error('[SAVINGS] Error fetching user plans:', error);
            throw error;
        }
    }
    /**
     * Get single plan by ID
     */
    async getPlanById(planId) {
        try {
            const plan = await SavingsPlan_1.default.findById(planId).populate('transactions');
            return plan;
        }
        catch (error) {
            console.error('[SAVINGS] Error fetching plan:', error);
            throw error;
        }
    }
    /**
     * Get plan summary at a glance
     */
    async getPlanSummary(planId) {
        try {
            const plan = await this.getPlanById(planId);
            if (!plan)
                throw new Error('Plan not found');
            return {
                planId: plan._id,
                savingName: plan.planName,
                savingTowards: plan.category,
                targetAmount: plan.targetAmount,
                currentAmount: plan.currentAmount,
                remainingAmount: Math.max(0, plan.targetAmount - plan.currentAmount),
                interestEarned: plan.totalInterestEarned,
                expectedInterest: plan.expectedInterest,
                duration: `${plan.duration} months`,
                frequency: plan.frequency,
                progressPercentage: plan.progressPercentage,
                startDate: plan.startDate,
                endDate: plan.endDate,
                nextDepositDue: plan.nextDepositDueDate,
                status: plan.status,
            };
        }
        catch (error) {
            console.error('[SAVINGS] Error getting plan summary:', error);
            throw error;
        }
    }
    /**
     * Update plan step-by-step configuration
     */
    async updatePlan(planId, updates) {
        try {
            const plan = await SavingsPlan_1.default.findById(planId);
            if (!plan)
                throw new Error('Plan not found');
            // Update fields
            if (updates.earnsInterest !== undefined) {
                plan.earnInterest = updates.earnsInterest;
            }
            if (updates.apy !== undefined) {
                plan.interestRate = updates.apy;
            }
            if (updates.category !== undefined) {
                plan.category = updates.category;
            }
            if (updates.targetAmount !== undefined) {
                plan.targetAmount = updates.targetAmount;
                // Recalculate expected interest
                if (plan.earnInterest) {
                    plan.expectedInterest = (updates.targetAmount * plan.interestRate) / 100;
                }
            }
            if (updates.duration !== undefined) {
                plan.duration = updates.duration;
                // Recalculate end date
                const endDate = new Date(plan.startDate);
                endDate.setMonth(endDate.getMonth() + updates.duration);
                plan.endDate = endDate;
            }
            if (updates.saveFrequency !== undefined) {
                plan.frequency = updates.saveFrequency;
                // Recalculate next deposit date
                plan.nextDepositDueDate = this.calculateNextDepositDate(plan.startDate, updates.saveFrequency);
            }
            // Check if all required fields are now set
            if (plan.category &&
                plan.targetAmount > 0 &&
                plan.duration &&
                plan.frequency) {
                plan.status = 'active'; // Mark as active once all config is complete
            }
            await plan.save();
            console.log(`[SAVINGS] Updated plan: ${planId}`);
            return plan;
        }
        catch (error) {
            console.error('[SAVINGS] Error updating plan:', error);
            throw error;
        }
    }
    /**
     * Deposit to a savings plan via Bitcoin payment
     */
    async depositToPlan(planId, amount, paymentId, paymentReference, bitcoinTransactionHash) {
        try {
            const plan = await this.getPlanById(planId);
            if (!plan)
                throw new Error('Plan not found');
            if (plan.status === 'completed' || plan.status === 'cancelled') {
                throw new Error(`Cannot deposit to ${plan.status} plan`);
            }
            const balanceBefore = plan.currentAmount;
            const newBalance = balanceBefore + amount;
            // Update plan balance
            plan.currentAmount = newBalance;
            plan.progressPercentage = Math.min(100, (newBalance / plan.targetAmount) * 100);
            // Check if plan is completed
            if (newBalance >= plan.targetAmount) {
                plan.status = 'completed';
            }
            // Update next deposit due date
            plan.nextDepositDueDate = this.calculateNextDepositDate(new Date(), plan.frequency);
            await plan.save();
            // Create transaction record
            const transaction = new SavingsTransaction_1.default({
                savingsPlanId: new mongoose_1.default.Types.ObjectId(planId),
                userId: plan.userId,
                type: 'deposit',
                amount,
                description: `Bitcoin deposit via ${paymentReference}`,
                paymentId,
                paymentReference,
                bitcoinTransactionHash,
                status: 'completed',
                balanceBefore,
                balanceAfter: newBalance,
            });
            await transaction.save();
            // Add transaction to plan
            plan.transactions.push(transaction._id);
            await plan.save();
            console.log(`[SAVINGS] Deposited $${amount} to plan ${planId}. New balance: $${newBalance}`);
            // Send deposit confirmation email
            try {
                const User = require('../models/User'); // Adjust path as needed
                const user = await User.findById(plan.userId).select('email fullName');
                if (user && user.email) {
                    // Calculate monthly interest for display
                    const monthlyInterest = plan.earnInterest
                        ? (newBalance * plan.interestRate) / 12 / 100
                        : 0;
                    const emailHtml = emailService_1.default.generateSavingsDepositConfirmationEmailHtml(user.fullName || 'User', amount, newBalance, monthlyInterest, plan.planName, newBalance, plan.targetAmount, plan.progressPercentage);
                    await emailService_1.default.sendEmail({
                        to: user.email,
                        subject: `Deposit Confirmed for "${plan.planName}" - $${amount.toFixed(2)}`,
                        html: emailHtml,
                    });
                    console.log(`[EMAIL] Deposit confirmation email sent to ${user.email}`);
                }
            }
            catch (emailError) {
                console.error('[EMAIL] Error sending deposit confirmation email:', emailError);
                // Don't throw - email failure shouldn't block deposit completion
            }
            return {
                planId: plan._id,
                amountDeposited: amount,
                newBalance,
                progressPercentage: plan.progressPercentage,
                planStatus: plan.status,
                transactionId: transaction._id,
            };
        }
        catch (error) {
            console.error('[SAVINGS] Error depositing to plan:', error);
            throw error;
        }
    }
    /**
     * Apply daily interest to plan
     */
    async applyDailyInterest(planId) {
        try {
            const plan = await this.getPlanById(planId);
            if (!plan)
                throw new Error('Plan not found');
            if (!plan.earnInterest || plan.status !== 'active') {
                return null;
            }
            // Calculate daily interest: APY / 365
            const dailyRate = plan.interestRate / 365 / 100;
            const dailyInterest = plan.currentAmount * dailyRate;
            if (dailyInterest <= 0) {
                return null;
            }
            const balanceBefore = plan.currentAmount;
            plan.currentAmount += dailyInterest;
            plan.totalInterestEarned += dailyInterest;
            await plan.save();
            // Create interest transaction record
            const transaction = new SavingsTransaction_1.default({
                savingsPlanId: new mongoose_1.default.Types.ObjectId(planId),
                userId: plan.userId,
                type: 'interest',
                amount: dailyInterest,
                description: `Daily interest (${plan.interestRate}% APY)`,
                status: 'completed',
                balanceBefore,
                balanceAfter: plan.currentAmount,
            });
            await transaction.save();
            return {
                planId: plan._id,
                dailyInterest: dailyInterest.toFixed(2),
                newBalance: plan.currentAmount,
                totalInterestEarned: plan.totalInterestEarned,
            };
        }
        catch (error) {
            console.error('[SAVINGS] Error applying daily interest:', error);
            throw error;
        }
    }
    /**
     * Get plan transactions
     */
    async getPlanTransactions(planId, limit = 50) {
        try {
            const transactions = await SavingsTransaction_1.default.find({ savingsPlanId: planId })
                .sort({ timestamp: -1 })
                .limit(limit);
            return transactions;
        }
        catch (error) {
            console.error('[SAVINGS] Error fetching transactions:', error);
            throw error;
        }
    }
    /**
     * Calculate next deposit due date based on frequency
     */
    calculateNextDepositDate(fromDate, frequency) {
        const nextDate = new Date(fromDate);
        switch (frequency) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
        }
        return nextDate;
    }
    /**
     * Get all active plans for interest calculation
     */
    async getActivePlansForInterest() {
        try {
            const plans = await SavingsPlan_1.default.find({
                status: 'active',
                earnInterest: true,
            });
            return plans;
        }
        catch (error) {
            console.error('[SAVINGS] Error fetching active plans:', error);
            throw error;
        }
    }
    /**
     * Calculate expected amount to save per frequency
     */
    calculateAmountPerFrequency(targetAmount, duration, frequency) {
        let depositsNeeded = 0;
        switch (frequency) {
            case 'daily':
                depositsNeeded = duration * 30; // Roughly 30 days per month
                break;
            case 'weekly':
                depositsNeeded = (duration * 30) / 7; // Roughly 4 weeks per month
                break;
            case 'monthly':
                depositsNeeded = duration;
                break;
        }
        return depositsNeeded > 0 ? targetAmount / depositsNeeded : 0;
    }
    /**
     * Pause a plan
     */
    async pausePlan(planId) {
        try {
            const plan = await SavingsPlan_1.default.findByIdAndUpdate(planId, { status: 'paused' }, { returnDocument: 'after' });
            if (!plan)
                throw new Error('Plan not found');
            console.log(`[SAVINGS] Paused plan: ${plan.planName}`);
            return plan;
        }
        catch (error) {
            console.error('[SAVINGS] Error pausing plan:', error);
            throw error;
        }
    }
    /**
     * Resume a plan
     */
    async resumePlan(planId) {
        try {
            const plan = await SavingsPlan_1.default.findByIdAndUpdate(planId, { status: 'active' }, { returnDocument: 'after' });
            if (!plan)
                throw new Error('Plan not found');
            console.log(`[SAVINGS] Resumed plan: ${plan.planName}`);
            return plan;
        }
        catch (error) {
            console.error('[SAVINGS] Error resuming plan:', error);
            throw error;
        }
    }
    /**
     * Cancel a plan
     */
    async cancelPlan(planId) {
        try {
            const plan = await SavingsPlan_1.default.findByIdAndUpdate(planId, { status: 'cancelled' }, { returnDocument: 'after' });
            if (!plan)
                throw new Error('Plan not found');
            console.log(`[SAVINGS] Cancelled plan: ${plan.planName}`);
            return plan;
        }
        catch (error) {
            console.error('[SAVINGS] Error cancelling plan:', error);
            throw error;
        }
    }
    /**
     * Send deposit reminders for plans with due dates
     * This should be called by a scheduled job (cron) regularly
     */
    async sendDepositReminders() {
        try {
            const now = new Date();
            const User = require('../models/User'); // Adjust path as needed
            // Find all active plans with a nextDepositDueDate that is today or overdue
            const plans = await SavingsPlan_1.default.find({
                status: 'active',
                nextDepositDueDate: { $lte: now },
                earnInterest: true,
            });
            console.log(`[SAVINGS] Found ${plans.length} plans with due deposits`);
            for (const plan of plans) {
                try {
                    const user = await User.findById(plan.userId).select('email fullName');
                    if (user && user.email) {
                        // Calculate suggested deposit amount
                        const suggestedAmount = this.calculateAmountPerFrequency(plan.targetAmount, plan.duration || 12, plan.frequency || 'monthly');
                        const emailHtml = emailService_1.default.generateDepositReminderEmailHtml(user.fullName || 'User', plan.planName, suggestedAmount, plan.nextDepositDueDate.toISOString());
                        await emailService_1.default.sendEmail({
                            to: user.email,
                            subject: `Deposit Reminder: It's Time to Save for "${plan.planName}"`,
                            html: emailHtml,
                        });
                        console.log(`[EMAIL] Deposit reminder sent to ${user.email} for plan ${plan.planName}`);
                    }
                }
                catch (planError) {
                    console.error(`[EMAIL] Error sending reminder for plan ${plan._id}:`, planError);
                    // Continue with next plan
                }
            }
        }
        catch (error) {
            console.error('[SAVINGS] Error in sendDepositReminders:', error);
            throw error;
        }
    }
    /**
     * Get total balance from all savings plans for a user
     */
    async getTotalSavingsBalance(userId) {
        try {
            const plans = await this.getUserPlans(userId);
            const totalBalance = plans.reduce((sum, plan) => sum + plan.currentAmount, 0);
            return totalBalance;
        }
        catch (error) {
            console.error('[SAVINGS] Error calculating total balance:', error);
            return 0;
        }
    }
    /**
     * Get savings summary for dashboard
     */
    async getSavingsSummary(userId) {
        try {
            const plans = await this.getUserPlans(userId);
            const totalBalance = plans.reduce((sum, plan) => sum + plan.currentAmount, 0);
            const totalTargetAmount = plans.reduce((sum, plan) => sum + plan.targetAmount, 0);
            const totalInterestEarned = plans.reduce((sum, plan) => sum + plan.totalInterestEarned, 0);
            const activePlans = plans.filter(p => p.status === 'active').length;
            const completedPlans = plans.filter(p => p.status === 'completed').length;
            // Calculate average APY across all plans with interest enabled
            const interestPlans = plans.filter(p => p.earnInterest);
            const averageAPY = interestPlans.length > 0
                ? interestPlans.reduce((sum, plan) => sum + plan.interestRate, 0) / interestPlans.length
                : 0;
            // Calculate estimated monthly interest
            const monthlyInterest = (totalBalance * averageAPY) / 12 / 100;
            return {
                balance: totalBalance,
                targetAmount: totalTargetAmount,
                totalInterestEarned,
                monthlyInterest,
                apy: Math.round(averageAPY * 10) / 10,
                activePlans,
                completedPlans,
                totalPlans: plans.length,
                plans,
            };
        }
        catch (error) {
            console.error('[SAVINGS] Error getting savings summary:', error);
            return {
                balance: 0,
                targetAmount: 0,
                totalInterestEarned: 0,
                monthlyInterest: 0,
                apy: 0,
                activePlans: 0,
                completedPlans: 0,
                totalPlans: 0,
                plans: [],
            };
        }
    }
    /**
     * Get default plans (for display to users)
     */
    getDefaultPlans() {
        return this.defaultPlans;
    }
}
exports.default = new SavingsPlansService();
