"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bitcoinService_1 = __importDefault(require("../services/bitcoinService"));
const savingsPlansService_1 = __importDefault(require("../services/savingsPlansService"));
const Payment_1 = __importDefault(require("../models/Payment"));
class SavingsPaymentController {
    /**
     * Initialize Bitcoin payment for savings plan deposit
     */
    async initializePayment(req, res) {
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
            const plan = await savingsPlansService_1.default.getPlanById(savingsPlanId);
            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Savings plan not found',
                });
                return;
            }
            // Create Bitcoin payment request
            const paymentRequest = await bitcoinService_1.default.createPaymentRequest(userId, undefined, // No planId for savings (undefined tells service it's a savings deposit)
            amount, plan.planName);
            // Update payment record with savings plan reference
            const payment = await Payment_1.default.findByIdAndUpdate(paymentRequest.paymentId, {
                planId: savingsPlanId, // This is the SAVINGS plan ID, not investment plan
                type: 'savings',
            }, { returnDocument: 'after' });
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
        }
        catch (error) {
            const err = error;
            res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
    /**
     * Verify Bitcoin payment by reference
     */
    async verifyPayment(req, res) {
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
            const verifiedPayment = await bitcoinService_1.default.verifyPaymentByReference(paymentReference, bitcoinTransactionHash, confirmations || 1);
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
        }
        catch (error) {
            const err = error;
            res.status(400).json({
                success: false,
                message: err.message,
            });
        }
    }
    /**
     * Confirm payment and complete savings deposit
     */
    async confirmPayment(req, res) {
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
            const payment = await Payment_1.default.findOne({ paymentReference });
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
            const depositResult = await savingsPlansService_1.default.depositToPlan(savingsPlanId, payment.bitcoinAmountUSD, payment._id.toString(), paymentReference, payment.bitcoinTransactionHash || '');
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
        }
        catch (error) {
            const err = error;
            res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
    /**
     * Get payment details
     */
    async getPaymentDetails(req, res) {
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
            const paymentDetails = await bitcoinService_1.default.getPaymentDetails(paymentId);
            res.status(200).json({
                success: true,
                data: paymentDetails,
            });
        }
        catch (error) {
            const err = error;
            res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
}
exports.default = new SavingsPaymentController();
