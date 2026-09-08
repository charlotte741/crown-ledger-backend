import { Request, Response } from 'express';
import investmentService from '../services/investmentService';
import dashboardService from '../services/dashboardService';
import savingsPlansService from '../services/savingsPlansService';
import UserInvestment from '../models/UserInvestment';

export class DashboardController {
  /**
   * Get complete dashboard data with balances and savings
   */
  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      // Fetch all dashboard data in parallel
      const [portfolioSummary, performance, allocation, investments, dashboardSummary] = await Promise.all([
        investmentService.getPortfolioSummary(userId),
        investmentService.getPortfolioPerformance(userId),
        investmentService.getAssetAllocation(userId),
        investmentService.getUserInvestments(userId),
        dashboardService.getDashboardSummary(userId),
      ]);

      res.status(200).json({
        success: true,
        data: {
          balances: dashboardSummary.balances,
          investments: dashboardSummary.investments,
          savings: dashboardSummary.savings,
          dailyGrowth: dashboardSummary.dailyGrowth,
          portfolioSummary,
          performance,
          allocation,
          investmentsList: investments,
        },
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Get investment details with performance history
   */
  async getInvestmentDetails(req: Request, res: Response): Promise<void> {
    try {
      const { investmentId } = req.params;

      const investment = await UserInvestment.findById(investmentId).populate('planId').exec();

      if (!investment) {
        res.status(404).json({
          success: false,
          message: 'Investment not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: investment,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Get portfolio statistics
   */
  async getPortfolioStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const investments = await UserInvestment.find({ userId, status: 'active' }).exec();

      const stats = {
        totalInvestments: investments.length,
        activeInvestments: investments.filter((inv) => inv.status === 'active').length,
        completedInvestments: investments.filter((inv) => inv.status === 'completed').length,
        cancelledInvestments: investments.filter((inv) => inv.status === 'cancelled').length,
        totalInvested: investments.reduce((sum, inv) => sum + inv.amountInvested, 0),
        totalCurrentValue: investments.reduce((sum, inv) => sum + inv.currentValue, 0),
        totalGains: investments.reduce((sum, inv) => sum + inv.totalGain, 0),
        bestPerformingPlan: investments.length > 0 
          ? investments.reduce((best, inv) => 
              inv.gainPercentage > best.gainPercentage ? inv : best
            ).planName
          : null,
        averageReturn: investments.length > 0
          ? investments.reduce((sum, inv) => sum + inv.gainPercentage, 0) / investments.length
          : 0,
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Get performance trends (monthly data for chart)
   */
  async getPerformanceTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const { year } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const investments = await UserInvestment.find({ userId, status: 'active' }).exec();

      // Create monthly aggregation
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
      const monthlyData = [];

      for (let month = 1; month <= 12; month++) {
        let totalValue = 0;
        let totalInvested = 0;

        investments.forEach((investment) => {
          const perf = investment.monthlyPerformance.find(
            (p: any) => p.month === month && p.year === currentYear
          );
          if (perf) {
            totalValue += perf.value;
            totalInvested += investment.amountInvested;
          }
        });

        const gain = totalValue - totalInvested;
        const gainPercentage = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

        monthlyData.push({
          month,
          monthName: this.getMonthName(month),
          value: Math.round(totalValue * 100) / 100,
          gain: Math.round(gain * 100) / 100,
          gainPercentage: Math.round(gainPercentage * 10) / 10,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          year: currentYear,
          data: monthlyData,
        },
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Compare investments
   */
  async compareInvestments(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const investments = await UserInvestment.find({ userId, status: 'active' })
        .populate('planId')
        .exec();

      const comparison = investments.map((inv) => ({
        id: inv._id,
        planName: inv.planName,
        amountInvested: inv.amountInvested,
        currentValue: inv.currentValue,
        totalGain: inv.totalGain,
        gainPercentage: inv.gainPercentage,
        investmentDate: inv.investmentDate,
        maturityDate: inv.maturityDate,
        daysRemaining: Math.ceil(
          (inv.maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      }));

      res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Get portfolio allocation breakdown
   */
  async getAllocationBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const allocation = await investmentService.getAssetAllocation(userId);

      const breakdown = [
        { name: 'Equities', percentage: allocation.equities, color: '#3b82f6' },
        { name: 'Real Estate', percentage: allocation.realEstate, color: '#10b981' },
        { name: 'Agriculture', percentage: allocation.agriculture, color: '#f59e0b' },
        { name: 'Bonds', percentage: allocation.bonds, color: '#6366f1' },
      ];

      res.status(200).json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Get account balance summary (investments + savings)
   */
  async getAccountBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const summary = await dashboardService.getDashboardSummary(userId);

      res.status(200).json({
        success: true,
        data: summary.balances,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Get savings account details
   */
  async getSavingsDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const savingsDetails = await savingsPlansService.getSavingsSummary(userId);

      res.status(200).json({
        success: true,
        data: savingsDetails,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Get daily growth summary
   */
  async getDailyGrowth(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const dailyGrowth = await dashboardService.getDailyGrowthSummary(userId);

      res.status(200).json({
        success: true,
        data: dailyGrowth,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  async getMonthlyPerformance(req: Request, res: Response) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      const performanceTrend = await dashboardService.getMonthlyPerformanceTrend(userId);

      res.status(200).json({
        success: true,
        message: 'Monthly performance retrieved successfully',
        data: performanceTrend,
      });
    } catch (error) {
      console.error('[DASHBOARD] Error getting monthly performance:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving monthly performance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getBalanceAndPerformance(req: Request, res: Response) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      const balanceAndPerformance = await dashboardService.getBalanceAndPerformance(userId);

      res.status(200).json({
        success: true,
        message: 'Balance and performance retrieved successfully',
        data: balanceAndPerformance,
      });
    } catch (error) {
      console.error('[DASHBOARD] Error getting balance and performance:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving balance and performance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  /**
   * Helper: Get month name
   */
  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  }
}



export default new DashboardController();
