import { Router } from 'express';
import savingsController from '../controllers/savingsController';

const router = Router();

/**
 * POST /api/savings/deposit
 * Deposit money into savings account
 */
router.post('/deposit', (req, res) => savingsController.deposit(req, res));

/**
 * POST /api/savings/withdraw
 * Withdraw money from savings account
 */
router.post('/withdraw', (req, res) => savingsController.withdraw(req, res));

/**
 * GET /api/savings/:userId/balance
 * Get savings account balance
 */
router.get('/:userId/balance', (req, res) => savingsController.getBalance(req, res));

/**
 * GET /api/savings/:userId/details
 * Get full savings account details
 */
router.get('/:userId/details', (req, res) => savingsController.getDetails(req, res));

/**
 * GET /api/savings/:userId/transactions
 * Get savings transaction history
 */
router.get('/:userId/transactions', (req, res) => savingsController.getTransactions(req, res));

export default router;
