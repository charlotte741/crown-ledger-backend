import express from 'express';
import investmentController from '../controllers/investmentController';

const router = express.Router();

/**
 * Exact Match Routes (must come BEFORE parameter routes)
 */

// Investment Plans - exact matches first
router.get('/plans', investmentController.getAllPlans.bind(investmentController));
router.get('/plans/:planId', investmentController.getPlanById.bind(investmentController));

// Payment Routes - exact matches for payment endpoints
router.post('/payment/initialize', investmentController.initializePayment.bind(investmentController));
router.post('/payment/confirm', investmentController.confirmInvestment.bind(investmentController));

// Payment - Savings (MUST be before dynamic routes)
router.post('/savings/payment/initialize', investmentController.initializeSavingsPayment.bind(investmentController));

/**
 * Specific Non-Parameter Routes
 */
router.get('/investment/:investmentId', investmentController.getInvestment.bind(investmentController));

/**
 * Transaction History Routes
 */
router.get('/:investmentId/transactions', investmentController.getInvestmentTransactions.bind(investmentController));

/**
 * Dynamic Routes (parameter-based routes go LAST)
 */

// Investments
router.get('/:userId/investments', investmentController.getUserInvestments.bind(investmentController));
router.post('/:investmentId/cancel', investmentController.cancelInvestment.bind(investmentController));

// Transaction History
router.get('/:userId/investment-transactions', investmentController.getUserInvestmentTransactions.bind(investmentController));

// Dashboard & Portfolio
router.get('/:userId/portfolio/summary', investmentController.getPortfolioSummary.bind(investmentController));
router.get('/:userId/portfolio/performance', investmentController.getPortfolioPerformance.bind(investmentController));
router.get('/:userId/portfolio/allocation', investmentController.getAssetAllocation.bind(investmentController));
router.get('/:userId/portfolio/growth-trend', investmentController.getPortfolioGrowthTrend.bind(investmentController));

export default router;
