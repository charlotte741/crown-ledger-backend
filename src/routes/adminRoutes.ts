import { Router } from 'express';
import AdminController from '../controllers/adminController';
import { authenticateToken } from '../middleware/authMiddleware';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware';


const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(adminAuthMiddleware);

/**
 * @route   GET /api/admin/users-balances
 * @desc    Get all users with their investment and savings balances
 * @query   page, limit, searchQuery
 * @private (requires JWT + Admin role)
 */
router.get('/users-balances', AdminController.getAllUsersBalances);

/**
 * @route   GET /api/admin/user/:userId/balance-details
 * @desc    Get detailed balance information for a specific user
 * @params  userId
 * @private (requires JWT + Admin role)
 */
router.get('/user/:userId/balance-details', AdminController.getUserBalanceDetails);

/**
 * @route   PUT /api/admin/user/:userId/update-savings-balance
 * @desc    Update a user's savings balance
 * @params  userId
 * @body    amount (number), reason (string - optional)
 * @private (requires JWT + Admin role)
 */
router.put(
  '/user/:userId/update-savings-balance',
  AdminController.updateUserSavingsBalance
);

/**
 * @route   PUT /api/admin/user/:userId/update-investment-balance
 * @desc    Update a user's investment current value and notify them by email
 * @params  userId
 * @body    amount (number), investmentId (string - optional), reason (string - optional)
 * @private (requires JWT + Admin role)
 */
router.put(
  '/user/:userId/update-investment-balance',
  AdminController.updateUserInvestmentBalance
);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get admin audit logs of all admin actions
 * @query   page, limit, actionType, userId
 * @private (requires JWT + Admin role)
 */
router.get('/audit-logs', AdminController.getAuditLogs);

/**
 * @route   GET /api/admin/dashboard-summary
 * @desc    Get admin dashboard summary with key metrics
 * @private (requires JWT + Admin role)
 */
router.get('/dashboard-summary', AdminController.getDashboardSummary);

router.put('/wallet/credit', AdminController.creditWalletByAccountNumber);
router.get('/withdrawals', AdminController.getWithdrawalRequests);
router.put('/withdrawals/:withdrawalId/review', AdminController.reviewWithdrawalRequest);

router.get('/wallet/lookup/:accountNumber', AdminController.lookupWalletByAccountNumber);

router.post('/user/:userId/send-email', AdminController.sendCustomEmailToUser);

export default router;
