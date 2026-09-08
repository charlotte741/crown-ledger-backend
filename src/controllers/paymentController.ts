import { Request, Response } from 'express';
import cashAppService from '../services/cashAppService';
import bitcoinService from '../services/bitcoinService';
import investmentService from '../services/investmentService';
import savingsService from '../services/savingsService';
import Payment from '../models/Payment';

export class PaymentController {
  /**
   * Get payment status
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const paymentId = Array.isArray(req.params.paymentId)
        ? req.params.paymentId[0]
        : req.params.paymentId;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
        return;
      }

      const payment = await cashAppService.getPaymentStatus(paymentId);

      res.status(200).json({
        success: true,
        data: payment,
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
   * Get payment by reference
   */
  async getPaymentByReference(req: Request, res: Response): Promise<void> {
    try {
      const paymentReference = Array.isArray(req.params.paymentReference)
        ? req.params.paymentReference[0]
        : req.params.paymentReference;

      if (!paymentReference) {
        res.status(400).json({
          success: false,
          message: 'Payment reference is required',
        });
        return;
      }

      const payment = await cashAppService.getPaymentByReference(paymentReference);

      res.status(200).json({
        success: true,
        data: payment,
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
   * Verify Cash App payment
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId, cashAppTransactionId, verificationNotes } = req.body;

      if (!paymentId || !cashAppTransactionId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: paymentId, cashAppTransactionId',
        });
        return;
      }

      const payment = await cashAppService.verifyPayment(
        paymentId,
        cashAppTransactionId,
        verificationNotes
      );

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: payment,
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
   * Cancel payment
   */
  async cancelPayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentId = Array.isArray(req.params.paymentId)
        ? req.params.paymentId[0]
        : req.params.paymentId;
      const { reason } = req.body;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
        return;
      }

      const payment = await cashAppService.cancelPayment(paymentId, reason);

      res.status(200).json({
        success: true,
        message: 'Payment cancelled successfully',
        data: payment,
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
   * Get user's payment history
   */
  async getUserPaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;
      const { limit = 50, skip = 0 } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const history = await cashAppService.getUserPaymentHistory(
        userId,
        parseInt(limit as string),
        parseInt(skip as string)
      );

      res.status(200).json({
        success: true,
        data: history,
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
   * Resend payment instructions
   */
  async resendPaymentInstructions(req: Request, res: Response): Promise<void> {
    try {
      const paymentId = Array.isArray(req.params.paymentId)
        ? req.params.paymentId[0]
        : req.params.paymentId;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
        return;
      }

      const instructions = await cashAppService.resendPaymentInstructions(paymentId);

      res.status(200).json({
        success: true,
        data: instructions,
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
   * Verify Bitcoin payment with transaction hash
   */
  async verifyBitcoinPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId, bitcoinTransactionHash, confirmations = 1 } = req.body;

      if (!paymentId || !bitcoinTransactionHash) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: paymentId, bitcoinTransactionHash',
        });
        return;
      }

      // Verify payment
      await bitcoinService.verifyPayment(paymentId, bitcoinTransactionHash, confirmations);

      const payment = await Payment.findById(paymentId);

      res.status(200).json({
        success: true,
        message: 'Bitcoin payment verified successfully',
        data: {
          paymentId: payment?._id,
          status: payment?.status,
          transactionHash: bitcoinTransactionHash,
          confirmations,
          verifiedAt: payment?.verifiedAt,
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
   * Get Bitcoin payment details
   */
  async getBitcoinPaymentDetails(req: Request, res: Response): Promise<void> {
    try {
      const paymentId = Array.isArray(req.params.paymentId)
        ? req.params.paymentId[0]
        : req.params.paymentId;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
        return;
      }

      const paymentDetails = await bitcoinService.getPaymentDetails(paymentId);

      res.status(200).json({
        success: true,
        data: paymentDetails,
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
   * Get Bitcoin address for payment
   */
  async getBitcoinAddress(req: Request, res: Response): Promise<void> {
    try {
      const paymentId = Array.isArray(req.params.paymentId)
        ? req.params.paymentId[0]
        : req.params.paymentId;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required',
        });
        return;
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
        return;
      }

      if (payment.paymentMethod !== 'bitcoin') {
        res.status(400).json({
          success: false,
          message: 'This payment is not a Bitcoin payment',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          bitcoinAddress: payment.bitcoinAddress,
          amount: payment.bitcoinAmountBTC,
          amountUSD: payment.bitcoinAmountUSD,
          paymentReference: payment.paymentReference,
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
   * Verify Bitcoin payment by reference and transaction hash
   * New approach: User provides reference + tx hash after sending Bitcoin
   */
  async verifyBitcoinPaymentByReference(req: Request, res: Response): Promise<void> {
    try {
      const { paymentReference, bitcoinTransactionHash, confirmations = 1 } = req.body;

      if (!paymentReference || !bitcoinTransactionHash) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: paymentReference, bitcoinTransactionHash',
        });
        return;
      }

      // Verify payment using reference - queries blockchain to verify actual amount
      const payment = await bitcoinService.verifyPaymentByReference(
        paymentReference,
        bitcoinTransactionHash,
        confirmations
      );

      res.status(200).json({
        success: true,
        message: 'Bitcoin payment verified successfully via reference',
        data: {
          paymentId: payment._id,
          paymentReference: payment.paymentReference,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          transactionHash: bitcoinTransactionHash,
          confirmations,
          verifiedAt: payment.verifiedAt,
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
   * Complete Bitcoin payment and create investment
   * Call this after verifying the Bitcoin payment to finalize the investment
   */
  async completeBitcoinPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentReference } = req.body;

      if (!paymentReference) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: paymentReference',
        });
        return;
      }

      // Complete payment and create investment
      const investment = await bitcoinService.completePaymentAndCreateInvestment(
        paymentReference,
        investmentService
      );

      res.status(201).json({
        success: true,
        message: 'Investment created successfully after Bitcoin payment verification',
        data: {
          investmentId: investment._id,
          planName: investment.planName,
          amountInvested: investment.amountInvested,
          status: investment.status,
          maturityDate: investment.maturityDate,
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
   * Complete Bitcoin payment and deposit to savings
   * Call this after verifying the Bitcoin payment to finalize the savings deposit
   */
  async completeBitcoinPaymentSavings(req: Request, res: Response): Promise<void> {
    try {
      const { paymentReference } = req.body;

      if (!paymentReference) {
        res.status(400).json({
          success: false,
          message: 'Missing required field: paymentReference',
        });
        return;
      }

      // Complete payment and deposit to savings
      const savings = await bitcoinService.completePaymentAndDepositSavings(
        paymentReference,
        savingsService
      );

      res.status(201).json({
        success: true,
        message: 'Savings deposit completed successfully after Bitcoin payment verification',
        data: {
          savingsId: savings._id,
          balance: savings.balance,
          amountDeposited: savings.totalDeposited,
          apy: savings.apy,
          monthlyInterest: ((savings.balance * (savings.apy / 12)) / 100).toFixed(2),
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

export default new PaymentController();
