"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import ContactSupport, { IContactSupport } from '../../models/ContactSupport';
const ContactSupport_1 = __importDefault(require("../models/ContactSupport"));
const emailService_1 = __importDefault(require("./emailService"));
const mongoose_1 = __importDefault(require("mongoose"));
class ContactSupportService {
    /**
     * Create a new support ticket
     */
    async createSupportTicket(userId, userEmail, userName, topic, subject, message) {
        try {
            // Validate topic
            const validTopics = ['Account', 'Billing & Payments', 'Transactions', 'Technical issue', 'Other'];
            if (!validTopics.includes(topic)) {
                throw new Error('Invalid topic selected');
            }
            // Create new ticket
            const ticket = new ContactSupport_1.default({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                userEmail,
                userName,
                topic,
                subject,
                message,
                status: 'open',
                priority: this.calculatePriority(topic),
            });
            await ticket.save();
            console.log(`[SUPPORT] Support ticket created: ${ticket._id} for user ${userId}`);
            // Send confirmation email to user
            await this.sendUserConfirmationEmail(userEmail, userName, subject, ticket._id.toString());
            // Send admin notification email
            await this.sendAdminNotificationEmail(ticket);
            return ticket;
        }
        catch (error) {
            console.error('[SUPPORT] Error creating support ticket:', error);
            throw error;
        }
    }
    /**
     * Get all support tickets for a user
     */
    async getUserTickets(userId) {
        try {
            const tickets = await ContactSupport_1.default.find({
                userId: new mongoose_1.default.Types.ObjectId(userId),
            }).sort({ createdAt: -1 });
            return tickets;
        }
        catch (error) {
            console.error('[SUPPORT] Error fetching user tickets:', error);
            throw error;
        }
    }
    /**
     * Get ticket details by ID
     */
    async getTicketById(ticketId, userId) {
        try {
            const ticket = await ContactSupport_1.default.findOne({
                _id: new mongoose_1.default.Types.ObjectId(ticketId),
                userId: new mongoose_1.default.Types.ObjectId(userId),
            });
            return ticket;
        }
        catch (error) {
            console.error('[SUPPORT] Error fetching ticket:', error);
            throw error;
        }
    }
    /**
     * Get all support tickets (admin)
     */
    async getAllTickets(status, topic, skip = 0, limit = 50) {
        try {
            const filter = {};
            if (status)
                filter.status = status;
            if (topic)
                filter.topic = topic;
            const total = await ContactSupport_1.default.countDocuments(filter);
            const tickets = await ContactSupport_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'email firstName lastName');
            return { tickets, total };
        }
        catch (error) {
            console.error('[SUPPORT] Error fetching all tickets:', error);
            throw error;
        }
    }
    /**
     * Update ticket status (admin)
     */
    async updateTicketStatus(ticketId, status, adminNotes) {
        try {
            const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid status');
            }
            const ticket = await ContactSupport_1.default.findByIdAndUpdate(ticketId, {
                status,
                adminNotes: adminNotes || undefined,
            }, { new: true });
            if (ticket) {
                console.log(`[SUPPORT] Ticket ${ticketId} status updated to ${status}`);
                // Send status update email to user
                await this.sendStatusUpdateEmail(ticket, status);
            }
            return ticket;
        }
        catch (error) {
            console.error('[SUPPORT] Error updating ticket:', error);
            throw error;
        }
    }
    /**
     * Calculate priority based on topic
     */
    calculatePriority(topic) {
        const highPriorityTopics = ['Technical issue', 'Billing & Payments'];
        const mediumPriorityTopics = ['Transactions', 'Account'];
        const lowPriorityTopics = ['Other'];
        if (highPriorityTopics.includes(topic))
            return 'high';
        if (mediumPriorityTopics.includes(topic))
            return 'medium';
        if (lowPriorityTopics.includes(topic))
            return 'low';
        return 'medium';
    }
    /**
     * Send confirmation email to user
     */
    async sendUserConfirmationEmail(userEmail, userName, subject, ticketId) {
        try {
            const html = emailService_1.default.generateSupportTicketConfirmationEmailHtml(userName, subject, ticketId);
            await emailService_1.default.sendEmail({
                to: userEmail,
                subject: `Support Ticket Received - Ticket #${ticketId}`,
                html,
            });
            console.log(`[SUPPORT] Confirmation email sent to ${userEmail}`);
        }
        catch (error) {
            console.error('[SUPPORT] Error sending confirmation email:', error);
            // Don't throw - email failure shouldn't block ticket creation
        }
    }
    /**
     * Send admin notification email
     */
    async sendAdminNotificationEmail(ticket) {
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'okwolig60@gmail.com';
            const html = emailService_1.default.generateSupportTicketAdminEmailHtml(ticket);
            await emailService_1.default.sendEmail({
                to: adminEmail,
                subject: `[${ticket.priority.toUpperCase()}] New Support Ticket: ${ticket.subject}`,
                html,
            });
            console.log(`[SUPPORT] Admin notification sent to ${adminEmail}`);
        }
        catch (error) {
            console.error('[SUPPORT] Error sending admin notification:', error);
            // Don't throw - email failure shouldn't block ticket creation
        }
    }
    /**
     * Send status update email to user
     */
    async sendStatusUpdateEmail(ticket, newStatus) {
        try {
            const html = emailService_1.default.generateSupportTicketStatusUpdateEmailHtml(ticket.userName, ticket.subject, ticket._id.toString(), newStatus);
            await emailService_1.default.sendEmail({
                to: ticket.userEmail,
                subject: `Support Ticket Update - Ticket #${ticket._id}`,
                html,
            });
            console.log(`[SUPPORT] Status update email sent to ${ticket.userEmail}`);
        }
        catch (error) {
            console.error('[SUPPORT] Error sending status update email:', error);
            // Don't throw - email failure shouldn't block status update
        }
    }
    /**
     * Delete a support ticket (admin only)
     */
    async deleteTicket(ticketId) {
        try {
            await ContactSupport_1.default.findByIdAndDelete(ticketId);
            console.log(`[SUPPORT] Ticket ${ticketId} deleted`);
        }
        catch (error) {
            console.error('[SUPPORT] Error deleting ticket:', error);
            throw error;
        }
    }
}
exports.default = new ContactSupportService();
