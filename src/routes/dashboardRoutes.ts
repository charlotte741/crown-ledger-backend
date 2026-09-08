import express from 'express';
import dashboardController from '../controllers/dashboardController';

const router = express.Router();

/**
 * Dashboard endpoints
 * Note: Specific routes must come BEFORE generic :userId routes
 */

// Specific investment routes (must be first)
router.get('/investment/:investmentId/details', dashboardController.getInvestmentDetails.bind(dashboardController));

// Generic userId routes (must be after specific routes)
// Root endpoint - returns dashboard overview
router.get('/:userId', dashboardController.getDashboardData.bind(dashboardController));

// Detailed endpoints
router.get('/:userId/overview', dashboardController.getDashboardData.bind(dashboardController));
router.get('/:userId/stats', dashboardController.getPortfolioStats.bind(dashboardController));
router.get('/:userId/trends', dashboardController.getPerformanceTrends.bind(dashboardController));
router.get('/:userId/compare', dashboardController.compareInvestments.bind(dashboardController));
router.get('/:userId/allocation', dashboardController.getAllocationBreakdown.bind(dashboardController));

// Balance and Performance endpoints
// router.get('/:userId/balance-overview', dashboardController.getBalanceOverview.bind(dashboardController));
router.get('/:userId/monthly-performance', dashboardController.getMonthlyPerformance.bind(dashboardController));
router.get('/:userId/balance-performance', dashboardController.getBalanceAndPerformance.bind(dashboardController));

export default router;
