"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserInvestment_1 = __importDefault(require("../models/UserInvestment"));
const savingsPlansService_1 = __importDefault(require("./savingsPlansService"));
const InvestmentGrowth_1 = __importDefault(require("../models/InvestmentGrowth"));
const investmentService_1 = __importDefault(require("./investmentService"));
class DashboardService {
    /**
     * Get total balance (investments + savings)
     */
    async getTotalBalance(userId) {
        const investmentsBalance = await this.getInvestmentsBalance(userId);
        const savingsBalance = await this.getSavingsBalance(userId);
        return investmentsBalance + savingsBalance;
    }
    /**
     * Get total investments balance
     */
    async getInvestmentsBalance(userId) {
        try {
            const investments = await UserInvestment_1.default.find({
                userId,
                status: 'active',
            });
            // Calculate from latest monthly performance (not static currentValue)
            const totalBalance = investments.reduce((sum, inv) => {
                if (inv.monthlyPerformance && inv.monthlyPerformance.length > 0) {
                    return sum + inv.monthlyPerformance[inv.monthlyPerformance.length - 1].value;
                }
                return sum + (inv.currentValue || 0);
            }, 0);
            return totalBalance;
        }
        catch (error) {
            console.error('[DASHBOARD] Error getting investments balance:', error);
            return 0;
        }
    }
    /**
     * Get total savings balance
     */
    async getSavingsBalance(userId) {
        try {
            const savingsDetails = await savingsPlansService_1.default.getSavingsSummary(userId);
            return savingsDetails.balance;
        }
        catch (error) {
            console.error('[DASHBOARD] Error getting savings balance:', error);
            return 0;
        }
    }
    /**
     * Get daily growth summary
     */
    async getDailyGrowthSummary(userId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Get all growth records for today
            const todayGrowth = await InvestmentGrowth_1.default.find({
                userId,
                date: {
                    $gte: today,
                    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                },
            });
            const totalDailyGain = todayGrowth.reduce((sum, g) => sum + g.dailyGain, 0);
            const investmentsBalance = await this.getInvestmentsBalance(userId);
            const dailyGrowthPercentage = investmentsBalance > 0 ? (totalDailyGain / investmentsBalance) * 100 : 0;
            return {
                totalDailyGain,
                dailyGrowthPercentage,
                growthRecords: todayGrowth.length,
            };
        }
        catch (error) {
            console.error('[DASHBOARD] Error getting daily growth summary:', error);
            return {
                totalDailyGain: 0,
                dailyGrowthPercentage: 0,
                growthRecords: 0,
            };
        }
    }
    /**
     * Get complete dashboard summary
     */
    async getDashboardSummary(userId) {
        try {
            const totalBalance = await this.getTotalBalance(userId);
            const investmentsBalance = await this.getInvestmentsBalance(userId);
            const savingsBalance = await this.getSavingsBalance(userId);
            const dailyGrowth = await this.getDailyGrowthSummary(userId);
            const savingsSummary = await savingsPlansService_1.default.getSavingsSummary(userId);
            const investments = await UserInvestment_1.default.find({
                userId,
                status: 'active',
            });
            const totalInvested = investments.reduce((sum, inv) => sum + (inv.amountInvested || 0), 0);
            const totalGain = investmentsBalance - totalInvested;
            const investmentGainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
            return {
                balances: {
                    totalBalance,
                    investmentsBalance,
                    savingsBalance,
                },
                investments: {
                    totalInvested,
                    currentValue: investmentsBalance,
                    totalGain,
                    gainPercentage: investmentGainPercentage,
                    count: investments.length,
                },
                savings: {
                    balance: savingsSummary.balance,
                    monthlyInterest: savingsSummary.monthlyInterest,
                    apy: savingsSummary.apy,
                    totalInterestEarned: savingsSummary.totalInterestEarned,
                },
                dailyGrowth: {
                    totalDailyGain: dailyGrowth.totalDailyGain,
                    dailyGrowthPercentage: dailyGrowth.dailyGrowthPercentage,
                },
            };
        }
        catch (error) {
            console.error('[DASHBOARD] Error getting dashboard summary:', error);
            throw error;
        }
    }
    /**
     * Get growth history for specific investment
     */
    async getInvestmentGrowthHistory(investmentId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            return await InvestmentGrowth_1.default.find({
                investmentId,
                date: {
                    $gte: startDate,
                },
            }).sort({ date: 1 });
        }
        catch (error) {
            console.error('[DASHBOARD] Error getting growth history:', error);
            return [];
        }
    }
    /**
     * Get latest growth records
     */
    async getLatestGrowthRecords(userId, limit = 10) {
        try {
            return await InvestmentGrowth_1.default.find({ userId })
                .sort({ date: -1 })
                .limit(limit);
        }
        catch (error) {
            console.error('[DASHBOARD] Error getting latest growth records:', error);
            return [];
        }
    }
    /**
     * Get Balance Overview - Total balance breakdown
     */
    async getBalanceOverview(userId) {
        try {
            const totalBalance = await this.getTotalBalance(userId);
            const investmentsBalance = await this.getInvestmentsBalance(userId);
            const savingsBalance = await this.getSavingsBalance(userId);
            const investments = await UserInvestment_1.default.find({
                userId,
                status: 'active',
            });
            const totalInvested = investments.reduce((sum, inv) => sum + (inv.amountInvested || 0), 0);
            const totalGain = investmentsBalance - totalInvested;
            // Use weighted average: (totalGain / totalInvested) * 100
            const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
            return {
                totalBalance: Math.round(totalBalance * 100) / 100,
                breakdown: {
                    investments: Math.round(investmentsBalance * 100) / 100,
                    savings: Math.round(savingsBalance * 100) / 100,
                },
                investmentMetrics: {
                    totalInvested: Math.round(totalInvested * 100) / 100,
                    currentValue: Math.round(investmentsBalance * 100) / 100,
                    totalGain: Math.round(totalGain * 100) / 100,
                    gainPercentage: Math.round(gainPercentage * 10) / 10,
                    activeInvestments: investments.length,
                },
                lastUpdated: new Date(),
            };
        }
        catch (error) {
            console.error('[DASHBOARD] Error getting balance overview:', error);
            throw error;
        }
    }
    /**
     * Get Monthly Performance Trend - aggregated monthly data
     */
    async getMonthlyPerformanceTrend(userId) {
        try {
            const performanceData = await investmentService_1.default.getPortfolioPerformance(userId);
            // Group by month and calculate metrics
            const monthlyTrends = performanceData.map((perf) => {
                const date = new Date(perf.year, perf.month - 1, 1);
                const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                return {
                    month: perf.month,
                    year: perf.year,
                    monthName,
                    value: perf.value,
                    date: date.toISOString(),
                };
            });
            // Calculate growth percentage month-over-month using: ((current - previous) / previous) × 100
            const trendsWithGrowth = monthlyTrends.map((trend, index) => {
                let monthOverMonthGrowth = 0;
                if (index > 0) {
                    const prevValue = monthlyTrends[index - 1].value;
                    monthOverMonthGrowth = prevValue > 0 ? ((trend.value - prevValue) / prevValue) * 100 : 0;
                }
                return {
                    ...trend,
                    monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 100) / 100,
                };
            });
            // Calculate summary statistics
            const latestMonth = trendsWithGrowth[trendsWithGrowth.length - 1];
            const firstMonth = trendsWithGrowth[0];
            // Total return: ((ending - starting) / starting) × 100
            const totalReturn = firstMonth && latestMonth
                ? ((latestMonth.value - firstMonth.value) / firstMonth.value) * 100
                : 0;
            // Compound Monthly Growth Rate (CMGR): (Ending Value / Starting Value)^(1 / number of periods) - 1
            const numberOfMonths = trendsWithGrowth.length - 1;
            let compoundMonthlyGrowthRate = 0;
            if (firstMonth && latestMonth && numberOfMonths > 0 && firstMonth.value > 0) {
                compoundMonthlyGrowthRate = (Math.pow(latestMonth.value / firstMonth.value, 1 / numberOfMonths) - 1) * 100;
            }
            return {
                monthlyTrends: trendsWithGrowth,
                summary: {
                    totalMonths: trendsWithGrowth.length,
                    currentValue: latestMonth ? Math.round(latestMonth.value * 100) / 100 : 0,
                    startingValue: firstMonth ? Math.round(firstMonth.value * 100) / 100 : 0,
                    // Total return: ((ending - starting) / starting) × 100
                    totalReturnPercentage: Math.round(totalReturn * 100) / 100,
                    // Compound Monthly Growth Rate (CMGR) - average monthly growth accounting for compounding
                    compoundMonthlyGrowthRate: Math.round(compoundMonthlyGrowthRate * 100) / 100,
                    highestMonth: trendsWithGrowth.length > 0
                        ? trendsWithGrowth.reduce((max, t) => t.value > max.value ? t : max)
                        : null,
                    lowestMonth: trendsWithGrowth.length > 0
                        ? trendsWithGrowth.reduce((min, t) => t.value < min.value ? t : min)
                        : null,
                },
                lastUpdated: new Date(),
            };
        }
        catch (error) {
            console.error('[DASHBOARD] Error getting monthly performance trend:', error);
            throw error;
        }
    }
    /**
     * Get combined Balance Overview and Monthly Performance Trend
     */
    async getBalanceAndPerformance(userId) {
        try {
            const [balanceOverview, performanceTrend] = await Promise.all([
                this.getBalanceOverview(userId),
                this.getMonthlyPerformanceTrend(userId),
            ]);
            return {
                balanceOverview,
                performanceTrend,
            };
        }
        catch (error) {
            console.error('[DASHBOARD] Error getting balance and performance:', error);
            throw error;
        }
    }
}
exports.default = new DashboardService();
