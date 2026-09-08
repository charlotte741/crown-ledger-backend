"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = __importDefault(require("../controllers/adminController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminAuthMiddleware_1 = require("../middleware/adminAuthMiddleware");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(authMiddleware_1.authenticateToken);
router.use(adminAuthMiddleware_1.adminAuthMiddleware);
/**
 * @route   GET /api/admin/users-balances
 * @desc    Get all users with their investment and savings balances
 * @query   page, limit, searchQuery
 * @private (requires JWT + Admin role)
 */
router.get('/users-balances', adminController_1.default.getAllUsersBalances);
/**
 * @route   GET /api/admin/user/:userId/balance-details
 * @desc    Get detailed balance information for a specific user
 * @params  userId
 * @private (requires JWT + Admin role)
 */
router.get('/user/:userId/balance-details', adminController_1.default.getUserBalanceDetails);
/**
 * @route   PUT /api/admin/user/:userId/update-savings-balance
 * @desc    Update a user's savings balance
 * @params  userId
 * @body    amount (number), reason (string - optional)
 * @private (requires JWT + Admin role)
 */
router.put('/user/:userId/update-savings-balance', adminController_1.default.updateUserSavingsBalance);
/**
 * @route   PUT /api/admin/user/:userId/update-investment-balance
 * @desc    Update a user's investment current value and notify them by email
 * @params  userId
 * @body    amount (number), investmentId (string - optional), reason (string - optional)
 * @private (requires JWT + Admin role)
 */
router.put('/user/:userId/update-investment-balance', adminController_1.default.updateUserInvestmentBalance);
/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get admin audit logs of all admin actions
 * @query   page, limit, actionType, userId
 * @private (requires JWT + Admin role)
 */
router.get('/audit-logs', adminController_1.default.getAuditLogs);
/**
 * @route   GET /api/admin/dashboard-summary
 * @desc    Get admin dashboard summary with key metrics
 * @private (requires JWT + Admin role)
 */
router.get('/dashboard-summary', adminController_1.default.getDashboardSummary);
router.put('/wallet/credit', adminController_1.default.creditWalletByAccountNumber);
router.get('/withdrawals', adminController_1.default.getWithdrawalRequests);
router.put('/withdrawals/:withdrawalId/review', adminController_1.default.reviewWithdrawalRequest);
router.get('/wallet/lookup/:accountNumber', adminController_1.default.lookupWalletByAccountNumber);
router.post('/user/:userId/send-email', adminController_1.default.sendCustomEmailToUser);
exports.default = router;
