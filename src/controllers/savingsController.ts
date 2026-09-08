import { Request, Response } from 'express';
import savingsService from '../services/savingsService';

class SavingsController {
  /**
   * Deposit money into savings
   */
  async deposit(req: Request, res: Response): Promise<void> {
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

      const savings = await savingsService.deposit(userId, amount);

      res.status(200).json({
        success: true,
        message: `Successfully deposited $${amount}`,
        data: {
          balance: savings.balance,
          totalDeposited: savings.totalDeposited,
          totalInterestEarned: savings.totalInterestEarned,
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
   * Withdraw money from savings
   */
  async withdraw(req: Request, res: Response): Promise<void> {
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

      const savings = await savingsService.withdraw(userId, amount);

      res.status(200).json({
        success: true,
        message: `Successfully withdrew $${amount}`,
        data: {
          balance: savings.balance,
          totalWithdrawn: savings.totalWithdrawn,
          totalInterestEarned: savings.totalInterestEarned,
        },
      });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Get savings balance
   */
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const savingsDetails = await savingsService.getSavingsDetails(userId);

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
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Get full savings account details
   */
  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const savingsDetails = await savingsService.getSavingsDetails(userId);

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
   * Get transaction history
   */
  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const transactions = await savingsService.getTransactionHistory(userId, limit);

      res.status(200).json({
        success: true,
        data: {
          transactions,
          count: transactions.length,
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
}

export default new SavingsController();
