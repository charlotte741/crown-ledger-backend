"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboardController_1 = __importDefault(require("../controllers/dashboardController"));
const router = express_1.default.Router();
/**
 * Dashboard endpoints
 * Note: Specific routes must come BEFORE generic :userId routes
 */
// Specific investment routes (must be first)
router.get('/investment/:investmentId/details', dashboardController_1.default.getInvestmentDetails.bind(dashboardController_1.default));
// Generic userId routes (must be after specific routes)
// Root endpoint - returns dashboard overview
router.get('/:userId', dashboardController_1.default.getDashboardData.bind(dashboardController_1.default));
// Detailed endpoints
router.get('/:userId/overview', dashboardController_1.default.getDashboardData.bind(dashboardController_1.default));
router.get('/:userId/stats', dashboardController_1.default.getPortfolioStats.bind(dashboardController_1.default));
router.get('/:userId/trends', dashboardController_1.default.getPerformanceTrends.bind(dashboardController_1.default));
router.get('/:userId/compare', dashboardController_1.default.compareInvestments.bind(dashboardController_1.default));
router.get('/:userId/allocation', dashboardController_1.default.getAllocationBreakdown.bind(dashboardController_1.default));
// Balance and Performance endpoints
// router.get('/:userId/balance-overview', dashboardController.getBalanceOverview.bind(dashboardController));
router.get('/:userId/monthly-performance', dashboardController_1.default.getMonthlyPerformance.bind(dashboardController_1.default));
router.get('/:userId/balance-performance', dashboardController_1.default.getBalanceAndPerformance.bind(dashboardController_1.default));
exports.default = router;
