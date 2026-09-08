import { Router } from 'express';
import savingsPlansController from '../controllers/savingsPlansController';
import savingsPaymentController from '../controllers/savingsPaymentController';

const router = Router();

/**
 * Plan Management Routes
 */

// Get default plans
router.get('/defaults', savingsPlansController.getDefaultPlans.bind(savingsPlansController));

// Create a new savings plan
router.post('/create', savingsPlansController.createPlan.bind(savingsPlansController));

// Get all plans for a user
router.get('/user/:userId', savingsPlansController.getUserPlans.bind(savingsPlansController));

// Get single plan
router.get('/plan/:planId', savingsPlansController.getPlan.bind(savingsPlansController));

// Update plan (step-by-step configuration)
router.put('/plan/:planId', savingsPlansController.updatePlan.bind(savingsPlansController));

// Get plan summary at a glance
router.get('/plan/:planId/summary', savingsPlansController.getPlanSummary.bind(savingsPlansController));

// Get plan transactions
router.get('/plan/:planId/transactions', savingsPlansController.getPlanTransactions.bind(savingsPlansController));

// Pause a plan
router.post('/plan/:planId/pause', savingsPlansController.pausePlan.bind(savingsPlansController));

// Resume a plan
router.post('/plan/:planId/resume', savingsPlansController.resumePlan.bind(savingsPlansController));

// Cancel a plan
router.post('/plan/:planId/cancel', savingsPlansController.cancelPlan.bind(savingsPlansController));

// Calculate amount per frequency
router.get('/calculate/frequency', savingsPlansController.calculateAmountPerFrequency.bind(savingsPlansController));

/**
 * Payment Routes
 */

// Initialize Bitcoin payment for savings plan
router.post('/payment/initialize', savingsPaymentController.initializePayment.bind(savingsPaymentController));

// Verify Bitcoin payment
router.post('/payment/verify', savingsPaymentController.verifyPayment.bind(savingsPaymentController));

// Confirm payment and complete deposit
router.post('/payment/confirm', savingsPaymentController.confirmPayment.bind(savingsPaymentController));

// Get payment details
router.get('/payment/:paymentId', savingsPaymentController.getPaymentDetails.bind(savingsPaymentController));

export default router;
