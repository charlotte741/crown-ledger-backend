import { Router, raw } from 'express';
import InboxController from '../controllers/inboxController';

const router = Router();

// Raw body is required here — Resend's Svix signature is computed over the
// exact bytes it sent, and JSON-parsing/re-stringifying breaks verification.
router.post('/resend/inbound', raw({ type: '*/*' }), InboxController.handleInboundWebhook);

export default router;