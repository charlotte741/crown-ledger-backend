"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentService = void 0;
const InvestmentPlan_1 = __importDefault(require("../models/InvestmentPlan"));
const UserInvestment_1 = __importDefault(require("../models/UserInvestment"));
const savingsService_1 = __importDefault(require("./savingsService"));
const emailService_1 = __importDefault(require("./emailService"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
class InvestmentService {
    /**
     * Get all active investment plans
     */
    async getAllPlans() {
        return await InvestmentPlan_1.default.find({ status: 'active' }).exec();
    }
    /**
     * Get a specific investment plan
     */
    async getPlanById(planId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            return null;
        }
        return await InvestmentPlan_1.default.findById(planId).exec();
    }
    /**
     * Create a new investment for a user
     */
    async createInvestment(userId, planId, amount, paymentId, actualAmount // The actual amount received (may differ from expected due to exchange rates)
    ) {
        const plan = await this.getPlanById(planId);
        if (!plan) {
            throw new Error('Investment plan not found');
        }
        // Check if user already has an active investment in this plan
        const existingActiveInvestment = await UserInvestment_1.default.findOne({
            userId,
            planId: new mongoose_1.default.Types.ObjectId(planId),
            status: 'active'
        }).exec();
        if (existingActiveInvestment) {
            throw new Error(`You already have an active investment in ${plan.name}. Please complete or cancel it before investing again.`);
        }
        // Use the verified amount when available; never let a falsy value bypass validation.
        const investmentAmount = actualAmount ?? amount;
        const minimumInvestment = Math.max(50, plan.minInvestment);
        if (!Number.isFinite(investmentAmount) || investmentAmount < minimumInvestment) {
            throw new Error(`Minimum investment for ${plan.name} is $${minimumInvestment}`);
        }
        const investmentDate = new Date();
        const maturityDate = new Date(investmentDate);
        maturityDate.setMonth(maturityDate.getMonth() + plan.duration);
        // Calculate initial monthly performance using LINEAR return (not compound)
        // If plan promises 25% over 12 months, that's 25/12 = 2.083% per month
        const monthlyPerformance = [];
        const monthlyReturnRate = plan.expectedReturn / plan.duration / 100;
        for (let i = 0; i < plan.duration; i++) {
            const perfDate = new Date(investmentDate);
            perfDate.setMonth(perfDate.getMonth() + i);
            // Use simple linear growth: investmentAmount * (1 + monthlyRate * months)
            const currentValue = investmentAmount * (1 + monthlyReturnRate * (i + 1));
            const monthlyReturn = currentValue - investmentAmount;
            monthlyPerformance.push({
                month: perfDate.getMonth() + 1,
                year: perfDate.getFullYear(),
                value: Math.round(currentValue * 100) / 100,
                return: Math.round(monthlyReturn * 100) / 100,
            });
        }
        const finalValue = monthlyPerformance.length > 0 ? monthlyPerformance[monthlyPerformance.length - 1].value : investmentAmount;
        const totalGain = finalValue - investmentAmount;
        const gainPercentage = (totalGain / investmentAmount) * 100;
        const investment = new UserInvestment_1.default({
            userId,
            planId: new mongoose_1.default.Types.ObjectId(planId),
            planName: plan.name,
            amountInvested: investmentAmount, // Store the actual amount received
            currentValue: investmentAmount, // Start with actual invested amount
            gain: 0,
            totalGain,
            gainPercentage,
            monthlyPerformance,
            transactions: [],
            investmentDate,
            maturityDate,
            status: 'pending', // Start as pending until payment is confirmed
        });
        await investment.save();
        // Add initial investment transaction
        investment.transactions.push({
            type: 'buy',
            amount: investmentAmount,
            valueBefore: 0,
            valueAfter: investmentAmount,
            description: `Investment purchase of $${investmentAmount} in ${plan.name}`,
            timestamp: new Date(),
        });
        await investment.save();
        // Add investment to user's investments array
        const user = await User_1.default.findById(userId);
        if (user) {
            if (!user.investments) {
                user.investments = [];
            }
            user.investments.push(investment._id);
            await user.save();
            console.log(`[INVESTMENT] Added investment ${investment._id} to user ${userId}'s portfolio`);
        }
        // Ensure user has savings account
        await savingsService_1.default.createSavingsAccount(userId);
        // Send investment confirmation email
        try {
            if (user && user.email) {
                const emailHtml = emailService_1.default.generateInvestmentConfirmationEmailHtml(user.firstName || 'Valued User', plan.name, amount, 'USD');
                await emailService_1.default.sendEmail({
                    to: user.email,
                    subject: 'Investment Confirmation - Crown Ledger',
                    html: emailHtml,
                });
                console.log(`[INVESTMENT] Confirmation email sent to ${user.email}`);
            }
        }
        catch (emailError) {
            console.error('[INVESTMENT] Error sending confirmation email:', emailError);
            // Don't throw - email failure shouldn't block investment creation
        }
        console.log(`[INVESTMENT] Created investment of $${amount} for user ${userId}`);
        return investment;
    }
    /**
     * Get all investments for a user
     */
    async getUserInvestments(userId) {
        return await UserInvestment_1.default.find({ userId }).exec();
    }
    /**
     * Get single investment
     */
    async getInvestmentById(investmentId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(investmentId)) {
            return null;
        }
        return await UserInvestment_1.default.findById(investmentId).exec();
    }
    /**
     * Get portfolio summary for dashboard
     */
    async getPortfolioSummary(userId) {
        const investments = await UserInvestment_1.default.find({ userId, status: 'active' }).exec();
        let totalInvested = 0;
        let portfolioValue = 0;
        // Calculate portfolio value from latest monthly performance (not from currentValue which is static)
        investments.forEach((inv) => {
            totalInvested += inv.amountInvested;
            // Get latest value from monthlyPerformance, fall back to currentValue if none exist
            if (inv.monthlyPerformance && inv.monthlyPerformance.length > 0) {
                portfolioValue += inv.monthlyPerformance[inv.monthlyPerformance.length - 1].value;
            }
            else {
                portfolioValue += inv.currentValue;
            }
        });
        const totalGains = portfolioValue - totalInvested;
        // Calculate weighted average return: (totalGains / totalInvested) * 100
        const avgReturn = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;
        return {
            totalInvested: Math.round(totalInvested * 100) / 100,
            activePlans: investments.length,
            portfolioValue: Math.round(portfolioValue * 100) / 100,
            totalGains: Math.round(totalGains * 100) / 100,
            avgReturn: Math.round(avgReturn * 10) / 10,
            lastUpdated: new Date(),
        };
    }
    /**
     * Get portfolio performance data (monthly growth)
     */
    async getPortfolioPerformance(userId) {
        const investments = await UserInvestment_1.default.find({ userId, status: 'active' }).exec();
        // Create a map to aggregate monthly values
        const performanceMap = new Map();
        investments.forEach((investment) => {
            investment.monthlyPerformance.forEach((perf) => {
                const key = `${perf.year}-${String(perf.month).padStart(2, '0')}`;
                const currentValue = performanceMap.get(key) || 0;
                performanceMap.set(key, currentValue + perf.value);
            });
        });
        // Convert to sorted array for January to December view
        const performanceData = Array.from(performanceMap.entries())
            .map(([key, value]) => {
            const [year, month] = key.split('-');
            return {
                month: parseInt(month),
                year: parseInt(year),
                value: Math.round(value * 100) / 100,
            };
        })
            .sort((a, b) => {
            if (a.year === b.year)
                return a.month - b.month;
            return a.year - b.year;
        });
        return performanceData;
    }
    /**
     * Get 12-month portfolio growth trend
     */
    async getPortfolioGrowthTrend(userId) {
        const investments = await UserInvestment_1.default.find({ userId, status: 'active' }).exec();
        // Create a map to aggregate monthly values and track initial investment
        const performanceMap = new Map();
        let totalInitialInvestment = 0;
        // Calculate total initial investment
        investments.forEach((investment) => {
            totalInitialInvestment += investment.amountInvested;
        });
        // Aggregate monthly portfolio values
        investments.forEach((investment) => {
            investment.monthlyPerformance.forEach((perf) => {
                const key = `${perf.year}-${String(perf.month).padStart(2, '0')}`;
                const existing = performanceMap.get(key) || { value: 0, totalInvested: 0 };
                existing.value += perf.value;
                existing.totalInvested = totalInitialInvestment;
                performanceMap.set(key, existing);
            });
        });
        // Convert to sorted array and limit to last 12 months
        let trendData = Array.from(performanceMap.entries())
            .map(([key, data]) => {
            const [year, month] = key.split('-');
            const currentValue = Math.round(data.value * 100) / 100;
            const monthlyGain = currentValue - data.totalInvested;
            const monthlyGainPercentage = data.totalInvested > 0
                ? (monthlyGain / data.totalInvested) * 100
                : 0;
            return {
                month: parseInt(month),
                year: parseInt(year),
                monthName: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                value: currentValue,
                gain: Math.round(monthlyGain * 100) / 100,
                gainPercentage: Math.round(monthlyGainPercentage * 100) / 100,
            };
        })
            .sort((a, b) => {
            if (a.year === b.year)
                return a.month - b.month;
            return a.year - b.year;
        });
        // Get last 12 months only
        trendData = trendData.slice(Math.max(0, trendData.length - 12));
        // Calculate summary metrics
        const firstMonth = trendData[0];
        const lastMonth = trendData[trendData.length - 1];
        const startingValue = totalInitialInvestment;
        const currentValue = lastMonth?.value || totalInitialInvestment;
        const totalGain = currentValue - startingValue;
        const totalGainPercentage = startingValue > 0 ? (totalGain / startingValue) * 100 : 0;
        // Calculate average monthly growth
        const monthlyGrowths = trendData.map(t => t.gainPercentage);
        const averageMonthlyGrowth = monthlyGrowths.length > 0
            ? monthlyGrowths.reduce((a, b) => a + b, 0) / monthlyGrowths.length
            : 0;
        return {
            trendData,
            summary: {
                startingValue: Math.round(startingValue * 100) / 100,
                currentValue: Math.round(currentValue * 100) / 100,
                totalGain: Math.round(totalGain * 100) / 100,
                totalGainPercentage: Math.round(totalGainPercentage * 100) / 100,
                averageMonthlyGrowth: Math.round(averageMonthlyGrowth * 100) / 100,
                months: trendData.length,
                highestValue: Math.round(Math.max(...trendData.map(t => t.value)) * 100) / 100,
                lowestValue: Math.round(Math.min(...trendData.map(t => t.value)) * 100) / 100,
            },
            lastUpdated: new Date(),
        };
    }
    /**
     * Get asset allocation across all user investments
     */
    async getAssetAllocation(userId) {
        const investments = await UserInvestment_1.default.find({ userId, status: 'active' }).populate('planId').exec();
        let totalEquities = 0;
        let totalRealEstate = 0;
        let totalAgriculture = 0;
        let totalBonds = 0;
        let totalInvested = 0;
        investments.forEach((investment) => {
            const plan = investment.planId;
            if (plan && plan.assetAllocation) {
                const allocation = plan.assetAllocation;
                const allocationAmount = investment.amountInvested;
                totalEquities += (allocation.equities / 100) * allocationAmount;
                totalRealEstate += (allocation.realEstate / 100) * allocationAmount;
                totalAgriculture += (allocation.agriculture / 100) * allocationAmount;
                totalBonds += (allocation.bonds / 100) * allocationAmount;
                totalInvested += allocationAmount;
            }
        });
        return {
            equities: totalInvested > 0 ? Math.round((totalEquities / totalInvested) * 100) : 0,
            realEstate: totalInvested > 0 ? Math.round((totalRealEstate / totalInvested) * 100) : 0,
            agriculture: totalInvested > 0 ? Math.round((totalAgriculture / totalInvested) * 100) : 0,
            bonds: totalInvested > 0 ? Math.round((totalBonds / totalInvested) * 100) : 0,
        };
    }
    /**
     * Update investment status
     */
    async updateInvestmentStatus(investmentId, status) {
        if (!mongoose_1.default.Types.ObjectId.isValid(investmentId)) {
            return null;
        }
        return await UserInvestment_1.default.findByIdAndUpdate(investmentId, { status }, { new: true }).exec();
    }
    /**
     * Cancel investment
     */
    async cancelInvestment(investmentId) {
        const investment = await this.getInvestmentById(investmentId);
        if (!investment) {
            return null;
        }
        const valueBefore = investment.currentValue;
        const valueAfter = 0; // After cancellation, value is 0
        // Add cancellation transaction
        investment.transactions.push({
            type: 'sell',
            amount: valueBefore,
            valueBefore,
            valueAfter,
            description: `Investment cancelled`,
            timestamp: new Date(),
        });
        await investment.save();
        return this.updateInvestmentStatus(investmentId, 'cancelled');
    }
    /**
     * Activate investment plan (when first investment is made)
     */
    async activatePlan(planId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(planId)) {
            return null;
        }
        const plan = await InvestmentPlan_1.default.findByIdAndUpdate(planId, { status: 'active' }, { new: true }).exec();
        if (plan) {
            console.log(`[INVESTMENT] Plan ${plan.name} activated after first investment`);
        }
        return plan;
    }
    /**
     * Get transaction history for an investment
     */
    async getTransactionHistory(investmentId, limit = 50) {
        try {
            const investment = await this.getInvestmentById(investmentId);
            if (!investment) {
                return [];
            }
            return investment.transactions.slice(-limit).reverse();
        }
        catch (error) {
            console.error('[INVESTMENT] Error getting transaction history:', error);
            throw error;
        }
    }
    /**
     * Get all transactions for a user across all investments
     */
    async getUserTransactionHistory(userId, limit = 50) {
        try {
            const investments = await this.getUserInvestments(userId);
            // Flatten all transactions from all investments
            const allTransactions = [];
            investments.forEach((investment) => {
                investment.transactions.forEach((transaction) => {
                    allTransactions.push({
                        ...transaction,
                        investmentId: investment._id,
                        planName: investment.planName,
                    });
                });
            });
            // Sort by timestamp descending and return limit
            return allTransactions
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
        }
        catch (error) {
            console.error('[INVESTMENT] Error getting user transaction history:', error);
            throw error;
        }
    }
    /**
     * Record a dividend or gain update transaction
     */
    async recordGainUpdate(investmentId, gainAmount) {
        try {
            const investment = await this.getInvestmentById(investmentId);
            if (!investment) {
                return null;
            }
            const valueBefore = investment.currentValue;
            const valueAfter = valueBefore + gainAmount;
            investment.transactions.push({
                type: 'gain_update',
                amount: gainAmount,
                valueBefore,
                valueAfter,
                description: `Portfolio gain update: +$${gainAmount}`,
                timestamp: new Date(),
            });
            investment.currentValue = valueAfter;
            await investment.save();
            return investment;
        }
        catch (error) {
            console.error('[INVESTMENT] Error recording gain update:', error);
            throw error;
        }
    }
    /**
     * Seed initial investment plans
     */
    async seedInvestmentPlans() {
        const plans = [
            {
                name: 'Premium Plan',
                description: 'Balanced investment portfolio with moderate risk',
                minInvestment: 50,
                duration: 3,
                riskLevel: 'Medium',
                expectedReturn: 40,
                assetAllocation: {
                    equities: 42,
                    realEstate: 28,
                    agriculture: 18,
                    bonds: 12,
                },
                status: 'active',
            },
            {
                name: 'Exclusive Plan',
                description: 'High-growth investment strategy',
                minInvestment: 50,
                duration: 3,
                riskLevel: 'High',
                expectedReturn: 45,
                assetAllocation: {
                    equities: 50,
                    realEstate: 25,
                    agriculture: 20,
                    bonds: 5,
                },
                status: 'active',
            },
            {
                name: 'Supreme Plan',
                description: 'Premium long-term wealth building',
                minInvestment: 50,
                duration: 4,
                riskLevel: 'High',
                expectedReturn: 50,
                assetAllocation: {
                    equities: 55,
                    realEstate: 30,
                    agriculture: 10,
                    bonds: 5,
                },
                status: 'active',
            },
            {
                name: 'Real Estate Plan',
                description: 'Focus on real estate investment opportunities',
                minInvestment: 50,
                duration: 4,
                riskLevel: 'Medium',
                expectedReturn: 55,
                assetAllocation: {
                    equities: 15,
                    realEstate: 70,
                    agriculture: 10,
                    bonds: 5,
                },
                status: 'active',
            },
            {
                name: 'Agricultural Plan',
                description: 'Invest in agricultural and farming ventures',
                minInvestment: 50,
                duration: 5,
                riskLevel: 'Low',
                expectedReturn: 60,
                assetAllocation: {
                    equities: 10,
                    realEstate: 15,
                    agriculture: 70,
                    bonds: 5,
                },
                status: 'active',
            },
        ];
        // Upsert configuration by plan name so existing databases receive the new rules
        // without replacing documents referenced by existing user investments.
        for (const plan of plans) {
            const existingPlan = await InvestmentPlan_1.default.findOne({ name: plan.name }).exec();
            if (existingPlan) {
                existingPlan.minInvestment = plan.minInvestment;
                existingPlan.duration = plan.duration;
                existingPlan.expectedReturn = plan.expectedReturn;
                existingPlan.status = plan.status;
                await existingPlan.save();
            }
            else {
                await InvestmentPlan_1.default.create(plan);
            }
        }
    }
}
exports.InvestmentService = InvestmentService;
exports.default = new InvestmentService();
