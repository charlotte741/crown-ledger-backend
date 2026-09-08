"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contactSupportController_1 = require("../controllers/contactSupportController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validators_1 = require("../middleware/validators");
const router = (0, express_1.Router)();
/**
 * ═══════════════════════════════════════════════════════════════
 * USER ROUTES (Protected)
 * ═══════════════════════════════════════════════════════════════
 */
/**
 * @route   POST /api/support/create-ticket
 * @desc    Create a new support ticket
 * @body    { topic, subject, message }
 * @private (requires JWT authentication)
 */
router.post('/create-ticket', authMiddleware_1.authenticateToken, validators_1.validateContactSupport, contactSupportController_1.ContactSupportController.createSupportTicket);
/**
 * @route   GET /api/support/my-tickets
 * @desc    Get all support tickets for authenticated user
 * @private (requires JWT authentication)
 */
router.get('/my-tickets', authMiddleware_1.authenticateToken, contactSupportController_1.ContactSupportController.getUserTickets);
/**
 * @route   GET /api/support/ticket/:ticketId
 * @desc    Get specific ticket details
 * @private (requires JWT authentication)
 */
router.get('/ticket/:ticketId', authMiddleware_1.authenticateToken, contactSupportController_1.ContactSupportController.getTicketDetails);
/**
 * ═══════════════════════════════════════════════════════════════
 * ADMIN ROUTES (Protected with admin role - optional)
 * ═══════════════════════════════════════════════════════════════
 */
/**
 * @route   GET /api/support/admin/tickets
 * @desc    Get all support tickets (admin)
 * @query   status, topic, skip, limit
 * @private (requires JWT authentication + admin role)
 */
router.get('/admin/tickets', authMiddleware_1.authenticateToken, contactSupportController_1.ContactSupportController.getAllTickets);
/**
 * @route   PATCH /api/support/admin/ticket/:ticketId/status
 * @desc    Update ticket status (admin)
 * @body    { status, adminNotes }
 * @private (requires JWT authentication + admin role)
 */
router.patch('/admin/ticket/:ticketId/status', authMiddleware_1.authenticateToken, contactSupportController_1.ContactSupportController.updateTicketStatus);
/**
 * @route   DELETE /api/support/admin/ticket/:ticketId
 * @desc    Delete support ticket (admin)
 * @private (requires JWT authentication + admin role)
 */
router.delete('/admin/ticket/:ticketId', authMiddleware_1.authenticateToken, contactSupportController_1.ContactSupportController.deleteTicket);
exports.default = router;
