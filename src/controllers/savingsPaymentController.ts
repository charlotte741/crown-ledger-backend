import { Request, Response } from 'express';
import bitcoinService from '../services/bitcoinService';
import savingsPlansService from '../services/savingsPlansService';
import Payment from '../models/Payment';

class SavingsPaymentController {
  /**
   * Initialize Bitcoin payment for savings plan deposit
   */
  async initializePayment(req: Request, res: Response): Promise<void> {
    try {
      const { userId, savingsPlanId, amount } = req.body;

      if (!userId || !savingsPlanId || !amount) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, savingsPlanId, amount',
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

      // Get plan details
      const plan = await savingsPlansService.getPlanById(savingsPlanId);
      if (!plan) {
        res.status(404).json({
          success: false,
          message: 'Savings plan not found',
        });
        return;
      }

      // Create Bitcoin payment request
      const paymentRequest = await bitcoinService.createPaymentRequest(
        userId,
        undefined, // No planId for savings (undefined tells service it's a savings deposit)
        amount,
        plan.planName
      );

      // Update payment record with savings plan reference
      const payment = await Payment.findByIdAndUpdate(
        paymentRequest.paymentId,
        {
          planId: savingsPlanId, // This is the SAVINGS plan ID, not investment plan
          type: 'savings',
        },
        { returnDocument: 'after' }
      );

      res.status(200).json({
        success: true,
        data: {
          paymentId: paymentRequest.paymentId,
          paymentReference: paymentRequest.paymentReference,
          savingsPlanId,
          planName: paymentRequest.planName,
          bitcoinAddress: paymentRequest.bitcoinAddress,
          amountUSD: paymentRequest.amountUSD,
          amountBTC: paymentRequest.amountBTC,
          instructions: paymentRequest.instructions,
          message: paymentRequest.message,
          exchangeRate: paymentRequest.exchangeRate,
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
   * Verify Bitcoin payment by reference
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentReference, bitcoinTransactionHash, confirmations } = req.body;

      if (!paymentReference || !bitcoinTransactionHash) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: paymentReference, bitcoinTransactionHash',
        });
        return;
      }

      // Verify using BitcoinService
      const verifiedPayment = await bitcoinService.verifyPaymentByReference(
        paymentReference,
        bitcoinTransactionHash,
        confirmations || 1
      );

      res.status(200).json({
        success: true,
        message: 'Bitcoin payment verified successfully',
        data: {
          paymentId: verifiedPayment._id,
          paymentReference: verifiedPayment.paymentReference,
          status: verifiedPayment.status,
          amountUSD: verifiedPayment.bitcoinAmountUSD,
          amountBTC: verifiedPayment.bitcoinAmountBTC,
          transactionHash: verifiedPayment.bitcoinTransactionHash,
          confirmations: verifiedPayment.bitcoinConfirmations,
          verifiedAt: verifiedPayment.verifiedAt,
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
   * Confirm payment and complete savings deposit
   */
  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentReference } = req.body;

      if (!paymentReference) {
        res.status(400).json({
          success: false,
          message: 'paymentReference is required',
        });
        return;
      }

      // Find payment
      const payment = await Payment.findOne({ paymentReference });
      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
        return;
      }

      if (payment.status !== 'completed') {
        res.status(400).json({
          success: false,
          message: 'Payment must be verified before confirmation',
        });
        return;
      }

      // Get savings plan ID from payment record
      const savingsPlanId = payment.planId?.toString();
      if (!savingsPlanId) {
        res.status(400).json({
          success: false,
          message: 'Payment does not have an associated savings plan',
        });
        return;
      }

      // Complete deposit to savings plan
      const depositResult = await savingsPlansService.depositToPlan(
        savingsPlanId,
        payment.bitcoinAmountUSD,
        payment._id.toString(),
        paymentReference,
        payment.bitcoinTransactionHash || ''
      );

      res.status(200).json({
        success: true,
        message: 'Savings deposit completed successfully',
        data: {
          planId: depositResult.planId,
          amountDeposited: depositResult.amountDeposited,
          newBalance: depositResult.newBalance,
          progressPercentage: depositResult.progressPercentage,
          planStatus: depositResult.planStatus,
          transactionId: depositResult.transactionId,
          paymentReference,
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
   * Get payment details
   */
  async getPaymentDetails(req: Request, res: Response): Promise<void> {
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
}

export default new SavingsPaymentController();
