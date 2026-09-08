"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashAppService = void 0;
const uuid_1 = require("uuid");
const Payment_1 = __importDefault(require("../models/Payment"));
const mongoose_1 = __importDefault(require("mongoose"));
class CashAppService {
    constructor() {
        this.CASHAPP_TAG = '$davechar1997';
    }
    /**
     * Generate unique payment reference for Cash App
     */
    generatePaymentReference() {
        return `INV-${Date.now()}-${(0, uuid_1.v4)().split('-')[0].toUpperCase()}`;
    }
    /**
     * Create payment request
     */
    async createPaymentRequest(userId, investmentId, amount, planName) {
        const paymentReference = this.generatePaymentReference();
        const paymentData = {
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
            paymentData.investmentId = new mongoose_1.default.Types.ObjectId(investmentId);
        }
        const payment = new Payment_1.default(paymentData);
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
    async verifyPayment(paymentId, cashAppTransactionId, verificationNotes) {
        const payment = await Payment_1.default.findByIdAndUpdate(paymentId, {
            cashAppTransactionId,
            status: 'completed',
            verifiedAt: new Date(),
            verificationNotes: verificationNotes || 'Payment verified with Cash App transaction ID',
        }, { new: true });
        if (!payment) {
            throw new Error('Payment record not found');
        }
        return payment;
    }
    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId) {
        const payment = await Payment_1.default.findById(paymentId).populate('investmentId');
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
    async cancelPayment(paymentId, reason) {
        const payment = await Payment_1.default.findByIdAndUpdate(paymentId, {
            status: 'cancelled',
            verificationNotes: reason || 'Payment cancelled by user',
        }, { new: true });
        if (!payment) {
            throw new Error('Payment not found');
        }
        return payment;
    }
    /**
     * Get user's payment history
     */
    async getUserPaymentHistory(userId, limit = 50, skip = 0) {
        const payments = await Payment_1.default.find({ userId })
            .populate('investmentId')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
        const total = await Payment_1.default.countDocuments({ userId });
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
    async getPaymentByReference(paymentReference) {
        const payment = await Payment_1.default.findOne({ paymentReference }).populate('investmentId');
        if (!payment) {
            throw new Error('Payment reference not found');
        }
        return payment;
    }
    /**
     * Resend payment instructions
     */
    async resendPaymentInstructions(paymentId) {
        const payment = await Payment_1.default.findById(paymentId);
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
exports.CashAppService = CashAppService;
exports.default = new CashAppService();
