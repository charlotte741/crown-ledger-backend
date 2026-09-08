"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentController = void 0;
const investmentService_1 = __importDefault(require("../services/investmentService"));
const cashAppService_1 = __importDefault(require("../services/cashAppService"));
const bitcoinService_1 = __importDefault(require("../services/bitcoinService"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Notification_1 = __importDefault(require("../models/Notification"));
const emailService_1 = __importDefault(require("../services/emailService"));
const User_1 = __importDefault(require("../models/User"));
const MIN_INVESTMENT_AMOUNT = 50;
function parseAmount(value) {
    if (value === null || value === undefined || value === '')
        return null;
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}
class InvestmentController {
    /**
     * Get all investment plans
     */
    async getAllPlans(req, res) {
        try {
            const plans = await investmentService_1.default.getAllPlans();
            res.status(200).json({
                success: true,
                data: plans,
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
     * Get investment plan by ID
     */
    async getPlanById(req, res) {
        try {
            const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
            const plan = await investmentService_1.default.getPlanById(planId);
            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Investment plan not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: plan,
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
     * Initialize investment or savings payment with Cash App or Bitcoin
     * For investments: provide userId, planId, amount, paymentMethod
     * For savings: provide userId, amount, paymentMethod (planId is optional)
     */
    async initializePayment(req, res) {
        try {
            const { userId, planId, amount, paymentMethod = 'bitcoin' } = req.body;
            const numericAmount = parseAmount(amount);
            // Validate required fields and reject NaN, Infinity, zero, and negative values.
            if (!userId || numericAmount === null) {
                res.status(400).json({
                    success: false,
                    message: 'userId and a valid positive amount are required',
                });
                return;
            }
            // Validate payment method
            if (!['cashapp', 'bitcoin'].includes(paymentMethod)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid payment method. Must be either "cashapp" or "bitcoin"',
                });
                return;
            }
            // Verify user exists
            const user = await User_1.default.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            // If planId is provided, verify it's a valid investment plan
            let plan = null;
            let paymentType = 'savings';
            if (planId) {
                plan = await investmentService_1.default.getPlanById(planId);
                if (!plan) {
                    res.status(404).json({
                        success: false,
                        message: 'Investment plan not found',
                    });
                    return;
                }
                // Every investment plan now accepts custom amounts from $50 upward.
                const minimumInvestment = Math.max(MIN_INVESTMENT_AMOUNT, plan.minInvestment);
                if (numericAmount < minimumInvestment) {
                    res.status(400).json({
                        success: false,
                        message: `Minimum investment for ${plan.name} is $${minimumInvestment}`,
                    });
                    return;
                }
                paymentType = 'investment';
            }
            else {
                // For savings, validate minimum deposit
                if (amount < 1) {
                    res.status(400).json({
                        success: false,
                        message: 'Minimum savings deposit is $1',
                    });
                    return;
                }
            }
            // Create payment request based on payment method
            let paymentRequest;
            const planName = plan ? plan.name : 'Savings Deposit';
            if (paymentMethod === 'bitcoin') {
                paymentRequest = await bitcoinService_1.default.createPaymentRequest(userId, planId, numericAmount, planName);
                res.status(200).json({
                    success: true,
                    data: {
                        paymentId: paymentRequest.paymentId,
                        paymentReference: paymentRequest.paymentReference,
                        paymentMethod: 'bitcoin',
                        paymentType: paymentRequest.type,
                        bitcoinAddress: paymentRequest.bitcoinAddress,
                        amountUSD: paymentRequest.amountUSD,
                        amountBTC: paymentRequest.amountBTC,
                        exchangeRate: paymentRequest.exchangeRate,
                        planName: paymentRequest.planName,
                        instructions: paymentRequest.instructions,
                        message: paymentRequest.message,
                    },
                });
            }
            else {
                // Cash App payment
                const planName = plan ? plan.name : 'Savings Deposit';
                paymentRequest = await cashAppService_1.default.createPaymentRequest(userId, planId, numericAmount, planName);
                res.status(200).json({
                    success: true,
                    data: {
                        paymentId: paymentRequest.paymentId,
                        paymentReference: paymentRequest.paymentReference,
                        paymentMethod: 'cashapp',
                        paymentType,
                        cashAppTag: paymentRequest.cashAppTag,
                        amount: paymentRequest.amount,
                        planName: paymentRequest.planName,
                        instructions: paymentRequest.instructions,
                        message: `Send payment to ${paymentRequest.cashAppTag} and provide the payment reference: ${paymentRequest.paymentReference}`,
                    },
                });
            }
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
     * Initialize savings payment with Cash App or Bitcoin
     * For savings only - no investment plan needed
     */
    async initializeSavingsPayment(req, res) {
        try {
            const { userId, amount, paymentMethod = 'bitcoin' } = req.body;
            const numericAmount = parseAmount(amount);
            // Validate required fields
            if (!userId || numericAmount === null) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: userId, amount',
                });
                return;
            }
            // Validate payment method
            if (!['cashapp', 'bitcoin'].includes(paymentMethod)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid payment method. Must be either "cashapp" or "bitcoin"',
                });
                return;
            }
            // Validate minimum deposit
            if (numericAmount < 1) {
                res.status(400).json({
                    success: false,
                    message: 'Minimum savings deposit is $1',
                });
                return;
            }
            // Verify user exists
            const user = await User_1.default.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            // Create payment request based on payment method
            let paymentRequest;
            if (paymentMethod === 'bitcoin') {
                paymentRequest = await bitcoinService_1.default.createPaymentRequest(userId, undefined, // No planId for savings
                numericAmount, paymentMethod);
                res.status(200).json({
                    success: true,
                    data: {
                        paymentId: paymentRequest.paymentId,
                        paymentReference: paymentRequest.paymentReference,
                        paymentMethod: 'bitcoin',
                        paymentType: 'savings',
                        bitcoinAddress: paymentRequest.bitcoinAddress,
                        amountUSD: paymentRequest.amountUSD,
                        amountBTC: paymentRequest.amountBTC,
                        exchangeRate: paymentRequest.exchangeRate,
                        planName: 'Savings Deposit',
                        instructions: paymentRequest.instructions,
                        message: paymentRequest.message,
                    },
                });
            }
            else {
                // Cash App payment
                paymentRequest = await cashAppService_1.default.createPaymentRequest(userId, undefined, // No planId for savings
                numericAmount, 'Savings Deposit');
                res.status(200).json({
                    success: true,
                    data: {
                        paymentId: paymentRequest.paymentId,
                        paymentReference: paymentRequest.paymentReference,
                        paymentMethod: 'cashapp',
                        paymentType: 'savings',
                        cashAppTag: paymentRequest.cashAppTag,
                        amount: paymentRequest.amount,
                        planName: 'Savings Deposit',
                        instructions: paymentRequest.instructions,
                        message: `Send payment to ${paymentRequest.cashAppTag} and provide the payment reference: ${paymentRequest.paymentReference}`,
                    },
                });
            }
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
     * Verify payment (Cash App or Bitcoin) and create investment
     */
    async confirmInvestment(req, res) {
        try {
            const { paymentId, planId, cashAppTransactionId, bitcoinTransactionHash } = req.body;
            if (!paymentId) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required field: paymentId',
                });
                return;
            }
            // Get payment record
            const payment = await Payment_1.default.findById(paymentId).populate('investmentId');
            if (!payment) {
                res.status(404).json({
                    success: false,
                    message: 'Payment not found',
                });
                return;
            }
            if (payment.status !== 'pending') {
                res.status(400).json({
                    success: false,
                    message: 'Payment has already been processed',
                });
                return;
            }
            // Validate based on payment method
            if (payment.paymentMethod === 'cashapp' && !cashAppTransactionId) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required field for Cash App payment: cashAppTransactionId',
                });
                return;
            }
            if (payment.paymentMethod === 'bitcoin' && !bitcoinTransactionHash) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required field for Bitcoin payment: bitcoinTransactionHash',
                });
                return;
            }
            // Extract investment details from payment
            const userId = payment.userId;
            const finalPlanId = planId || payment.investmentId?.planId;
            if (!finalPlanId) {
                res.status(400).json({
                    success: false,
                    message: 'Plan ID is required',
                });
                return;
            }
            // Verify plan exists
            const plan = await investmentService_1.default.getPlanById(finalPlanId);
            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Investment plan not found',
                });
                return;
            }
            // Verify payment based on method first to get actual amount
            let actualAmount = payment.amount;
            if (payment.paymentMethod === 'bitcoin') {
                const verifiedPayment = await bitcoinService_1.default.verifyPayment(paymentId, bitcoinTransactionHash, 1);
                // Extract actual amount from verified payment
                if (verifiedPayment && verifiedPayment.amount) {
                    actualAmount = verifiedPayment.amount;
                }
            }
            else {
                await cashAppService_1.default.verifyPayment(paymentId, cashAppTransactionId, 'Payment verified via transaction ID');
            }
            const minimumInvestment = Math.max(MIN_INVESTMENT_AMOUNT, plan.minInvestment);
            if (!Number.isFinite(actualAmount) || actualAmount < minimumInvestment) {
                res.status(400).json({
                    success: false,
                    message: `Minimum investment for ${plan.name} is $${minimumInvestment}`,
                });
                return;
            }
            // Create investment with actual amount received
            const investment = await investmentService_1.default.createInvestment(userId, finalPlanId, payment.amount, paymentId.toString(), actualAmount // Pass the actual amount received
            );
            // Update investment status to active after payment verification
            await investmentService_1.default.updateInvestmentStatus(investment._id.toString(), 'active');
            // Activate the plan if this is the first investment in it
            await investmentService_1.default.activatePlan(finalPlanId);
            // Update payment record
            const updatedInvestment = await investmentService_1.default.getInvestmentById(investment._id.toString());
            await Payment_1.default.findByIdAndUpdate(paymentId, {
                investmentId: investment._id,
            }, { new: true });
            // Get user and plan details for notification
            const user = await User_1.default.findById(userId);
            // Create in-app notification
            if (user) {
                await Notification_1.default.create({
                    userId,
                    type: 'payment_confirmed',
                    title: 'Investment Confirmed',
                    message: `Your investment of $${payment.amount} in ${plan.name} has been successfully confirmed.`,
                    data: {
                        investmentId: investment._id.toString(),
                        investmentAmount: payment.amount,
                        planName: plan.name,
                        paymentId: paymentId.toString(),
                    },
                });
                // Send confirmation email
                try {
                    const fullName = `${user.firstName} ${user.lastName}`;
                    const emailHtml = emailService_1.default.generateInvestmentConfirmationEmailHtml(fullName, plan.name, payment.amount, user.currency || 'USD');
                    await emailService_1.default.sendEmail({
                        to: user.email,
                        subject: `Investment Confirmed - Crown Ledger ${plan.name}`,
                        html: emailHtml,
                    });
                }
                catch (emailError) {
                    console.error('[INVESTMENT] Error sending confirmation email:', emailError);
                    // Continue even if email fails
                }
            }
            res.status(201).json({
                success: true,
                message: 'Investment created successfully after payment verification',
                data: {
                    investment: updatedInvestment,
                    payment: {
                        paymentId: payment._id,
                        expectedAmount: payment.amount,
                        actualAmount: actualAmount,
                        status: 'completed',
                    },
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
     * Get user's investments
     */
    async getUserInvestments(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const investments = await investmentService_1.default.getUserInvestments(userId);
            res.status(200).json({
                success: true,
                data: investments,
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
     * Get single investment
     */
    async getInvestment(req, res) {
        try {
            const investmentId = Array.isArray(req.params.investmentId) ? req.params.investmentId[0] : req.params.investmentId;
            const investment = await investmentService_1.default.getInvestmentById(investmentId);
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
     * Get investment transaction history
     */
    async getInvestmentTransactions(req, res) {
        try {
            const investmentId = Array.isArray(req.params.investmentId) ? req.params.investmentId[0] : req.params.investmentId;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            if (!investmentId) {
                res.status(400).json({
                    success: false,
                    message: 'Investment ID is required',
                });
                return;
            }
            const transactions = await investmentService_1.default.getTransactionHistory(investmentId, limit);
            res.status(200).json({
                success: true,
                data: {
                    transactions,
                    count: transactions.length,
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
     * Get all user investment transactions across all investments
     */
    async getUserInvestmentTransactions(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const transactions = await investmentService_1.default.getUserTransactionHistory(userId, limit);
            res.status(200).json({
                success: true,
                data: {
                    transactions,
                    count: transactions.length,
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
     * Get portfolio summary
     */
    async getPortfolioSummary(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const summary = await investmentService_1.default.getPortfolioSummary(userId);
            res.status(200).json({
                success: true,
                data: summary,
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
     * Get portfolio performance data
     */
    async getPortfolioPerformance(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const performance = await investmentService_1.default.getPortfolioPerformance(userId);
            res.status(200).json({
                success: true,
                data: performance,
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
     * Get asset allocation
     */
    async getAssetAllocation(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const allocation = await investmentService_1.default.getAssetAllocation(userId);
            res.status(200).json({
                success: true,
                data: allocation,
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
     * Get 12-month portfolio growth trend
     */
    async getPortfolioGrowthTrend(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const growthTrend = await investmentService_1.default.getPortfolioGrowthTrend(userId);
            res.status(200).json({
                success: true,
                data: growthTrend,
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
     * Cancel investment
     */
    async cancelInvestment(req, res) {
        try {
            const investmentId = Array.isArray(req.params.investmentId) ? req.params.investmentId[0] : req.params.investmentId;
            const investment = await investmentService_1.default.cancelInvestment(investmentId);
            if (!investment) {
                res.status(404).json({
                    success: false,
                    message: 'Investment not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Investment cancelled successfully',
                data: investment,
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
exports.InvestmentController = InvestmentController;
exports.default = new InvestmentController();
