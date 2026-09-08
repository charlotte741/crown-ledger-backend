"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const savingsController_1 = __importDefault(require("../controllers/savingsController"));
const router = (0, express_1.Router)();
/**
 * POST /api/savings/deposit
 * Deposit money into savings account
 */
router.post('/deposit', (req, res) => savingsController_1.default.deposit(req, res));
/**
 * POST /api/savings/withdraw
 * Withdraw money from savings account
 */
router.post('/withdraw', (req, res) => savingsController_1.default.withdraw(req, res));
/**
 * GET /api/savings/:userId/balance
 * Get savings account balance
 */
router.get('/:userId/balance', (req, res) => savingsController_1.default.getBalance(req, res));
/**
 * GET /api/savings/:userId/details
 * Get full savings account details
 */
router.get('/:userId/details', (req, res) => savingsController_1.default.getDetails(req, res));
/**
 * GET /api/savings/:userId/transactions
 * Get savings transaction history
 */
router.get('/:userId/transactions', (req, res) => savingsController_1.default.getTransactions(req, res));
exports.default = router;
