"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = __importDefault(require("../controllers/paymentController"));
const router = express_1.default.Router();
/**
 * GET /api/payments/:paymentId
 * Get payment status
 */
router.get('/:paymentId', (req, res) => paymentController_1.default.getPaymentStatus(req, res));
/**
 * GET /api/payments/reference/:paymentReference
 * Get payment by reference
 */
router.get('/reference/:paymentReference', (req, res) => paymentController_1.default.getPaymentByReference(req, res));
/**
 * POST /api/payments/verify
 * Verify Cash App payment with transaction ID
 */
router.post('/verify', (req, res) => paymentController_1.default.verifyPayment(req, res));
/**
 * POST /api/payments/verify-bitcoin
 * Verify Bitcoin payment with transaction hash
 */
router.post('/verify-bitcoin', (req, res) => paymentController_1.default.verifyBitcoinPayment(req, res));
/**
 * POST /api/payments/verify-bitcoin-reference
 * Verify Bitcoin payment using reference number and transaction hash
 * NEW: User sends BTC without memo, then confirms with reference + tx hash
 */
router.post('/verify-bitcoin-reference', (req, res) => paymentController_1.default.verifyBitcoinPaymentByReference(req, res));
/**
 * GET /api/payments/bitcoin/:paymentId
 * Get Bitcoin payment details
 */
router.get('/bitcoin/:paymentId', (req, res) => paymentController_1.default.getBitcoinPaymentDetails(req, res));
/**
 * GET /api/payments/bitcoin/:paymentId/address
 * Get Bitcoin address for payment
 */
router.get('/bitcoin/:paymentId/address', (req, res) => paymentController_1.default.getBitcoinAddress(req, res));
/**
 * POST /api/payments/:paymentId/cancel
 * Cancel pending payment
 */
router.post('/:paymentId/cancel', (req, res) => paymentController_1.default.cancelPayment(req, res));
/**
 * GET /api/payments/user/:userId
 * Get user's payment history
 */
router.get('/user/:userId/history', (req, res) => paymentController_1.default.getUserPaymentHistory(req, res));
/**
 * POST /api/payments/:paymentId/resend-instructions
 * Resend Cash App payment instructions
 */
router.post('/:paymentId/resend-instructions', (req, res) => paymentController_1.default.resendPaymentInstructions(req, res));
/**
 * POST /api/payments/complete-bitcoin-payment
 * Complete Bitcoin payment and create investment
 * Call this after verifying the payment with /verify-bitcoin-reference
 */
router.post('/complete-bitcoin-payment', (req, res) => paymentController_1.default.completeBitcoinPayment(req, res));
/**
 * POST /api/payments/complete-bitcoin-savings
 * Complete Bitcoin payment and deposit to savings
 * Call this after verifying the payment with /verify-bitcoin-reference
 */
router.post('/complete-bitcoin-savings', (req, res) => paymentController_1.default.completeBitcoinPaymentSavings(req, res));
exports.default = router;
