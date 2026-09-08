import { Router } from 'express';
import { ContactSupportController } from '../controllers/contactSupportController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateContactSupport } from '../middleware/validators';

const router = Router();

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
router.post(
  '/create-ticket',
  authenticateToken,
  validateContactSupport,
  ContactSupportController.createSupportTicket
);

/**
 * @route   GET /api/support/my-tickets
 * @desc    Get all support tickets for authenticated user
 * @private (requires JWT authentication)
 */
router.get('/my-tickets', authenticateToken, ContactSupportController.getUserTickets);

/**
 * @route   GET /api/support/ticket/:ticketId
 * @desc    Get specific ticket details
 * @private (requires JWT authentication)
 */
router.get('/ticket/:ticketId', authenticateToken, ContactSupportController.getTicketDetails);

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
router.get('/admin/tickets', authenticateToken, ContactSupportController.getAllTickets);

/**
 * @route   PATCH /api/support/admin/ticket/:ticketId/status
 * @desc    Update ticket status (admin)
 * @body    { status, adminNotes }
 * @private (requires JWT authentication + admin role)
 */
router.patch(
  '/admin/ticket/:ticketId/status',
  authenticateToken,
  ContactSupportController.updateTicketStatus
);

/**
 * @route   DELETE /api/support/admin/ticket/:ticketId
 * @desc    Delete support ticket (admin)
 * @private (requires JWT authentication + admin role)
 */
router.delete('/admin/ticket/:ticketId', authenticateToken, ContactSupportController.deleteTicket);

export default router;
