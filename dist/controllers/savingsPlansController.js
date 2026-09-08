"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const savingsPlansService_1 = __importDefault(require("../services/savingsPlansService"));
class SavingsPlansController {
    /**
     * Get default savings plans
     */
    async getDefaultPlans(req, res) {
        try {
            const defaultPlans = savingsPlansService_1.default.getDefaultPlans();
            res.status(200).json({
                success: true,
                data: defaultPlans,
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
     * Create a new savings plan (initial creation with just name)
     * Other fields can be added via updatePlan endpoint
     */
    // controllers/savingsPlanController.ts
    async createPlan(req, res) {
        try {
            const { userId, planName, description, category, targetAmount, duration, frequency, earnInterest } = req.body;
            // Validate required fields
            if (!userId || !planName) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: userId and planName are required',
                });
                return;
            }
            // If partial fields are provided, validate them
            if (category && !['business', 'personal', 'rent', 'school_fees', 'birthday', 'emergency', 'gadget', 'eid', 'real_estate', 'summer_holiday', 'travel', 'automobile', 'christmas', 'detty_december', 'new_year', 'other'].includes(category)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid category',
                });
                return;
            }
            if (targetAmount !== undefined && targetAmount < 0) {
                res.status(400).json({
                    success: false,
                    message: 'Target amount must be greater than or equal to 0',
                });
                return;
            }
            const plan = await savingsPlansService_1.default.createPlan(userId, planName, description, category, targetAmount, earnInterest || false, duration, frequency);
            res.status(201).json({
                success: true,
                message: 'Plan created successfully',
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
     * Update plan configuration (step-by-step)
     */
    async updatePlan(req, res) {
        try {
            const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
            const updates = req.body;
            if (!planId) {
                res.status(400).json({
                    success: false,
                    message: 'Plan ID is required',
                });
                return;
            }
            const plan = await savingsPlansService_1.default.updatePlan(planId, updates);
            res.status(200).json({
                success: true,
                message: 'Plan updated successfully',
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
     * Get all plans for a user
     */
    async getUserPlans(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            const status = req.query.status;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            const plans = await savingsPlansService_1.default.getUserPlans(userId, status);
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
     * Get single plan
     */
    async getPlan(req, res) {
        try {
            const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
            if (!planId) {
                res.status(400).json({
                    success: false,
                    message: 'Plan ID is required',
                });
                return;
            }
            const plan = await savingsPlansService_1.default.getPlanById(planId);
            if (!plan) {
                res.status(404).json({
                    success: false,
                    message: 'Plan not found',
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
     * Get plan summary at a glance
     */
    async getPlanSummary(req, res) {
        try {
            const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
            if (!planId) {
                res.status(400).json({
                    success: false,
                    message: 'Plan ID is required',
                });
                return;
            }
            const summary = await savingsPlansService_1.default.getPlanSummary(planId);
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
     * Get plan transactions
     */
    async getPlanTransactions(req, res) {
        try {
            const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
            const limit = parseInt(req.query.limit) || 50;
            if (!planId) {
                res.status(400).json({
                    success: false,
                    message: 'Plan ID is required',
                });
                return;
            }
            const transactions = await savingsPlansService_1.default.getPlanTransactions(planId, limit);
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
     * Pause a plan
     */
    async pausePlan(req, res) {
        try {
            const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
            if (!planId) {
                res.status(400).json({
                    success: false,
                    message: 'Plan ID is required',
                });
                return;
            }
            const plan = await savingsPlansService_1.default.pausePlan(planId);
            res.status(200).json({
                success: true,
                message: 'Plan paused successfully',
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
     * Resume a plan
     */
    async resumePlan(req, res) {
        try {
            const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
            if (!planId) {
                res.status(400).json({
                    success: false,
                    message: 'Plan ID is required',
                });
                return;
            }
            const plan = await savingsPlansService_1.default.resumePlan(planId);
            res.status(200).json({
                success: true,
                message: 'Plan resumed successfully',
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
     * Cancel a plan
     */
    async cancelPlan(req, res) {
        try {
            const planId = Array.isArray(req.params.planId) ? req.params.planId[0] : req.params.planId;
            if (!planId) {
                res.status(400).json({
                    success: false,
                    message: 'Plan ID is required',
                });
                return;
            }
            const plan = await savingsPlansService_1.default.cancelPlan(planId);
            res.status(200).json({
                success: true,
                message: 'Plan cancelled successfully',
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
     * Calculate amount per frequency
     */
    async calculateAmountPerFrequency(req, res) {
        try {
            const { targetAmount, duration, frequency } = req.query;
            if (!targetAmount || !duration || !frequency) {
                res.status(400).json({
                    success: false,
                    message: 'Missing required query parameters: targetAmount, duration, frequency',
                });
                return;
            }
            const amount = savingsPlansService_1.default.calculateAmountPerFrequency(Number(targetAmount), Number(duration), frequency);
            res.status(200).json({
                success: true,
                data: {
                    targetAmount: Number(targetAmount),
                    duration: Number(duration),
                    frequency,
                    amountPerFrequency: amount.toFixed(2),
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
}
exports.default = new SavingsPlansController();
