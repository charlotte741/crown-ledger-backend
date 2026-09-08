"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const savingsPlansController_1 = __importDefault(require("../controllers/savingsPlansController"));
const savingsPaymentController_1 = __importDefault(require("../controllers/savingsPaymentController"));
const router = (0, express_1.Router)();
/**
 * Plan Management Routes
 */
// Get default plans
router.get('/defaults', savingsPlansController_1.default.getDefaultPlans.bind(savingsPlansController_1.default));
// Create a new savings plan
router.post('/create', savingsPlansController_1.default.createPlan.bind(savingsPlansController_1.default));
// Get all plans for a user
router.get('/user/:userId', savingsPlansController_1.default.getUserPlans.bind(savingsPlansController_1.default));
// Get single plan
router.get('/plan/:planId', savingsPlansController_1.default.getPlan.bind(savingsPlansController_1.default));
// Update plan (step-by-step configuration)
router.put('/plan/:planId', savingsPlansController_1.default.updatePlan.bind(savingsPlansController_1.default));
// Get plan summary at a glance
router.get('/plan/:planId/summary', savingsPlansController_1.default.getPlanSummary.bind(savingsPlansController_1.default));
// Get plan transactions
router.get('/plan/:planId/transactions', savingsPlansController_1.default.getPlanTransactions.bind(savingsPlansController_1.default));
// Pause a plan
router.post('/plan/:planId/pause', savingsPlansController_1.default.pausePlan.bind(savingsPlansController_1.default));
// Resume a plan
router.post('/plan/:planId/resume', savingsPlansController_1.default.resumePlan.bind(savingsPlansController_1.default));
// Cancel a plan
router.post('/plan/:planId/cancel', savingsPlansController_1.default.cancelPlan.bind(savingsPlansController_1.default));
// Calculate amount per frequency
router.get('/calculate/frequency', savingsPlansController_1.default.calculateAmountPerFrequency.bind(savingsPlansController_1.default));
/**
 * Payment Routes
 */
// Initialize Bitcoin payment for savings plan
router.post('/payment/initialize', savingsPaymentController_1.default.initializePayment.bind(savingsPaymentController_1.default));
// Verify Bitcoin payment
router.post('/payment/verify', savingsPaymentController_1.default.verifyPayment.bind(savingsPaymentController_1.default));
// Confirm payment and complete deposit
router.post('/payment/confirm', savingsPaymentController_1.default.confirmPayment.bind(savingsPaymentController_1.default));
// Get payment details
router.get('/payment/:paymentId', savingsPaymentController_1.default.getPaymentDetails.bind(savingsPaymentController_1.default));
exports.default = router;
