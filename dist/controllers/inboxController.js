"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxController = void 0;
const InboxThread_1 = __importDefault(require("../models/InboxThread"));
const InboxMessage_1 = __importDefault(require("../models/InboxMessage"));
const emailService_1 = __importDefault(require("../services/emailService"));
function snippet(text, html, max = 140) {
    const raw = (text || html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return raw.length > max ? `${raw.slice(0, max)}…` : raw;
}
function parseEmailAddress(raw) {
    if (!raw)
        return { email: '' };
    const match = raw.match(/^(.*)<(.+)>$/);
    if (match) {
        return {
            email: match[2].trim().toLowerCase(),
            name: match[1].trim().replace(/"/g, '') || undefined,
        };
    }
    return { email: raw.trim().toLowerCase() };
}
class InboxController {
    /**
     * Public webhook hit by Resend when an inbound email arrives. This route
     * must be mounted with a raw-body parser (see routes file) so the Svix
     * signature can be checked against the exact bytes Resend sent.
     * @route POST /api/webhooks/resend/inbound
     * @access Public (authenticity comes from the Svix signature, not a session)
     */
    async handleInboundWebhook(req, res) {
        try {
            const svixId = req.headers['svix-id'];
            const svixTimestamp = req.headers['svix-timestamp'];
            const svixSignature = req.headers['svix-signature'];
            if (!svixId || !svixTimestamp || !svixSignature) {
                res.status(400).json({ success: false, message: 'Missing webhook signature headers' });
                return;
            }
            const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
            let event;
            try {
                event = emailService_1.default.verifyInboundWebhook(rawBody, {
                    id: svixId,
                    timestamp: svixTimestamp,
                    signature: svixSignature,
                });
            }
            catch (verifyError) {
                console.error('[INBOX] Webhook signature verification failed:', verifyError);
                res.status(401).json({ success: false, message: 'Invalid webhook signature' });
                return;
            }
            if (event?.type !== 'email.received') {
                res.status(200).json({ success: true, ignored: true });
                return;
            }
            const emailId = event?.data?.email_id;
            if (!emailId) {
                res.status(200).json({ success: true, ignored: true });
                return;
            }
            // Resend delivers at-least-once — dedupe on its own email id.
            const existing = await InboxMessage_1.default.findOne({ resendEmailId: emailId });
            if (existing) {
                res.status(200).json({ success: true, duplicate: true });
                return;
            }
            const full = await emailService_1.default.getReceivedEmail(emailId);
            const { email: fromEmail, name: fromName } = parseEmailAddress(full.from);
            const subject = full.subject || '(no subject)';
            let thread = await InboxThread_1.default.findOne({ participantEmail: fromEmail, status: { $ne: 'closed' } });
            if (!thread) {
                thread = await InboxThread_1.default.create({
                    participantEmail: fromEmail,
                    participantName: fromName,
                    subject,
                    status: 'open',
                });
            }
            else if (fromName && !thread.participantName) {
                thread.participantName = fromName;
            }
            const attachments = Array.isArray(full.attachments)
                ? full.attachments.map((a) => ({
                    filename: a.filename,
                    contentType: a.content_type || a.contentType,
                    size: a.size,
                    resendAttachmentId: a.id,
                }))
                : [];
            await InboxMessage_1.default.create({
                threadId: thread._id,
                direction: 'inbound',
                resendEmailId: emailId,
                messageId: full.headers?.['message-id'],
                fromEmail,
                fromName,
                toEmail: Array.isArray(full.to) ? full.to[0] : full.to,
                subject,
                text: full.text,
                html: full.html,
                attachments,
                read: false,
            });
            thread.status = 'open';
            thread.lastMessageAt = new Date();
            thread.lastMessageSnippet = snippet(full.text, full.html);
            thread.lastMessageDirection = 'inbound';
            thread.unreadCount += 1;
            await thread.save();
            res.status(200).json({ success: true });
        }
        catch (error) {
            const err = error;
            console.error('[INBOX] Error handling inbound webhook:', error);
            // Still 200: a 5xx here just makes Resend retry a payload that will
            // fail the same way again. The error is logged for investigation.
            res.status(200).json({ success: false, message: err.message || 'Error processing inbound email' });
        }
    }
    /** @route GET /api/admin/inbox */
    async listThreads(req, res) {
        try {
            const { page = 1, limit = 20, status = 'open', searchQuery = '' } = req.query;
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            const skip = (pageNum - 1) * limitNum;
            const query = {};
            if (status && status !== 'all')
                query.status = status;
            if (searchQuery) {
                query.$or = [
                    { participantEmail: { $regex: searchQuery, $options: 'i' } },
                    { participantName: { $regex: searchQuery, $options: 'i' } },
                    { subject: { $regex: searchQuery, $options: 'i' } },
                ];
            }
            const total = await InboxThread_1.default.countDocuments(query);
            const threads = await InboxThread_1.default.find(query).sort({ lastMessageAt: -1 }).skip(skip).limit(limitNum);
            res.status(200).json({
                success: true,
                data: threads,
                pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
            });
        }
        catch (error) {
            const err = error;
            console.error('[INBOX] Error listing threads:', error);
            res.status(500).json({ success: false, message: err.message || 'Error listing threads' });
        }
    }
    /** @route GET /api/admin/inbox/:threadId */
    async getThread(req, res) {
        try {
            const threadId = Array.isArray(req.params.threadId) ? req.params.threadId[0] : req.params.threadId;
            const thread = await InboxThread_1.default.findById(threadId);
            if (!thread) {
                res.status(404).json({ success: false, message: 'Thread not found' });
                return;
            }
            const messages = await InboxMessage_1.default.find({ threadId }).sort({ createdAt: 1 });
            await InboxMessage_1.default.updateMany({ threadId, direction: 'inbound', read: false }, { $set: { read: true } });
            if (thread.unreadCount !== 0) {
                thread.unreadCount = 0;
                await thread.save();
            }
            res.status(200).json({ success: true, data: { thread, messages } });
        }
        catch (error) {
            const err = error;
            console.error('[INBOX] Error fetching thread:', error);
            res.status(500).json({ success: false, message: err.message || 'Error fetching thread' });
        }
    }
    /**
     * @route POST /api/admin/inbox/:threadId/reply
     * @body message: string, subject?: string
     */
    async replyToThread(req, res) {
        try {
            const threadId = Array.isArray(req.params.threadId) ? req.params.threadId[0] : req.params.threadId;
            const { message, subject } = req.body;
            const adminId = req.userId;
            if (!message || typeof message !== 'string' || !message.trim()) {
                res.status(400).json({ success: false, message: 'Message is required' });
                return;
            }
            const thread = await InboxThread_1.default.findById(threadId);
            if (!thread) {
                res.status(404).json({ success: false, message: 'Thread not found' });
                return;
            }
            const lastInbound = await InboxMessage_1.default.findOne({ threadId, direction: 'inbound' }).sort({ createdAt: -1 });
            const replySubject = subject?.trim() || (thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`);
            const ticketId = threadId.toString().slice(-8).toUpperCase();
            const html = emailService_1.default.generateAdminCustomEmailHtml(thread.participantName || 'there', replySubject, message.trim(), ticketId);
            const headers = {};
            if (lastInbound?.messageId) {
                headers['In-Reply-To'] = lastInbound.messageId;
                headers['References'] = lastInbound.messageId;
            }
            await emailService_1.default.sendEmail({
                to: thread.participantEmail,
                subject: replySubject,
                html,
                headers,
            });
            await InboxMessage_1.default.create({
                threadId: thread._id,
                direction: 'outbound',
                fromEmail: process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
                toEmail: thread.participantEmail,
                subject: replySubject,
                text: message.trim(),
                html,
                sentByAdminId: adminId,
                read: true,
            });
            thread.status = 'open';
            thread.lastMessageAt = new Date();
            thread.lastMessageSnippet = snippet(message.trim());
            thread.lastMessageDirection = 'outbound';
            await thread.save();
            res.status(200).json({ success: true, message: 'Reply sent successfully' });
        }
        catch (error) {
            const err = error;
            console.error('[INBOX] Error replying to thread:', error);
            res.status(500).json({ success: false, message: err.message || 'Error sending reply' });
        }
    }
    /**
   * Returns a fresh signed download URL for one attachment on a message.
   * @route GET /api/admin/inbox/messages/:messageId/attachments/:attachmentId
   * @access Private (Admin only)
   */
    async getMessageAttachmentUrl(req, res) {
        try {
            const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
            const attachmentId = Array.isArray(req.params.attachmentId) ? req.params.attachmentId[0] : req.params.attachmentId;
            const message = await InboxMessage_1.default.findById(messageId);
            if (!message || !message.resendEmailId) {
                res.status(404).json({ success: false, message: 'Message or attachment not found' });
                return;
            }
            const attachmentMeta = message.attachments.find((a) => a.resendAttachmentId === attachmentId);
            if (!attachmentMeta) {
                res.status(404).json({ success: false, message: 'Attachment not found on this message' });
                return;
            }
            const attachment = await emailService_1.default.getReceivedAttachment(message.resendEmailId, attachmentId);
            res.status(200).json({
                success: true,
                data: {
                    filename: attachment.filename,
                    contentType: attachment.content_type,
                    downloadUrl: attachment.download_url,
                    expiresAt: attachment.expires_at,
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[INBOX] Error fetching attachment:', error);
            res.status(500).json({ success: false, message: err.message || 'Error fetching attachment' });
        }
    }
    /**
     * @route PUT /api/admin/inbox/:threadId/status
     * @body status: 'open' | 'closed'
     */
    async updateThreadStatus(req, res) {
        try {
            const threadId = Array.isArray(req.params.threadId) ? req.params.threadId[0] : req.params.threadId;
            const { status } = req.body;
            if (status !== 'open' && status !== 'closed') {
                res.status(400).json({ success: false, message: "Status must be 'open' or 'closed'" });
                return;
            }
            const thread = await InboxThread_1.default.findByIdAndUpdate(threadId, { status }, { new: true });
            if (!thread) {
                res.status(404).json({ success: false, message: 'Thread not found' });
                return;
            }
            res.status(200).json({ success: true, data: thread });
        }
        catch (error) {
            const err = error;
            console.error('[INBOX] Error updating thread status:', error);
            res.status(500).json({ success: false, message: err.message || 'Error updating thread status' });
        }
    }
}
exports.InboxController = InboxController;
exports.default = new InboxController();
