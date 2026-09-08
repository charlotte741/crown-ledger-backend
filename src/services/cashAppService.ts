import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/Payment';
import mongoose from 'mongoose';

export class CashAppService {
  private readonly CASHAPP_TAG = '$davechar1997';

  /**
   * Generate unique payment reference for Cash App
   */
  generatePaymentReference(): string {
    return `INV-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;
  }

  /**
   * Create payment request
   */
 async createPaymentRequest(
  userId: string,
  investmentId?: string,
  amount?: number,
  planName?: string
) {
  const paymentReference = this.generatePaymentReference();

  const paymentData: any = {
    userId,
    amount,
    currency: 'USD',
    paymentReference,
    cashAppTag: this.CASHAPP_TAG,
    status: 'pending',
    paymentMethod: 'cashapp',
  };

  // Only add investmentId if it exists
  if (investmentId) {
    paymentData.investmentId = new mongoose.Types.ObjectId(investmentId);
  }

  const payment = new Payment(paymentData);

  await payment.save();

  return {
    paymentId: payment._id,
    paymentReference,
    cashAppTag: this.CASHAPP_TAG,
    amount,
    planName,
    instructions: `Send $${amount} to ${this.CASHAPP_TAG} with payment reference: ${paymentReference}`,
  };
}

  /**
   * Verify payment with transaction ID
   */
  async verifyPayment(
    paymentId: string,
    cashAppTransactionId: string,
    verificationNotes?: string
  ) {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        cashAppTransactionId,
        status: 'completed',
        verifiedAt: new Date(),
        verificationNotes: verificationNotes || 'Payment verified with Cash App transaction ID',
      },
      { new: true }
    );

    if (!payment) {
      throw new Error('Payment record not found');
    }

    return payment;
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string) {
    const payment = await Payment.findById(paymentId).populate('investmentId');

    if (!payment) {
      throw new Error('Payment not found');
    }

    return {
      paymentId: payment._id,
      paymentReference: payment.paymentReference,
      amount: payment.amount,
      status: payment.status,
      cashAppTag: payment.cashAppTag,
      verifiedAt: payment.verifiedAt,
      createdAt: payment.createdAt,
    };
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string, reason?: string) {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: 'cancelled',
        verificationNotes: reason || 'Payment cancelled by user',
      },
      { new: true }
    );

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  /**
   * Get user's payment history
   */
  async getUserPaymentHistory(userId: string, limit: number = 50, skip: number = 0) {
    const payments = await Payment.find({ userId })
      .populate('investmentId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Payment.countDocuments({ userId });

    return {
      payments,
      total,
      page: Math.floor(skip / limit) + 1,
      pageSize: limit,
    };
  }

  /**
   * Get payment by reference
   */
  async getPaymentByReference(paymentReference: string) {
    const payment = await Payment.findOne({ paymentReference }).populate('investmentId');

    if (!payment) {
      throw new Error('Payment reference not found');
    }

    return payment;
  }

  /**
   * Resend payment instructions
   */
  async resendPaymentInstructions(paymentId: string) {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'pending') {
      throw new Error('Can only resend instructions for pending payments');
    }

    return {
      paymentReference: payment.paymentReference,
      cashAppTag: this.CASHAPP_TAG,
      amount: payment.amount,
      instructions: `Send $${payment.amount} to ${this.CASHAPP_TAG} with reference: ${payment.paymentReference}`,
    };
  }
}

export default new CashAppService();
