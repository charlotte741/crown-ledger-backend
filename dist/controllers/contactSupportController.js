"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactSupportController = void 0;
const contactSupportService_1 = __importDefault(require("../services/contactSupportService"));
class ContactSupportController {
    /**
     * Create a new support ticket
     * POST /api/support/create-ticket
     */
    static async createSupportTicket(req, res) {
        try {
            const { topic, subject, message } = req.body;
            const userId = req.userId; // From auth middleware
            // Validate required fields
            if (!topic || !subject || !message) {
                res.status(400).json({
                    success: false,
                    message: 'Topic, subject, and message are required',
                });
                return;
            }
            // Validate user is authenticated
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }
            // Validate topic
            const validTopics = ['Account', 'Billing & Payments', 'Transactions', 'Technical issue', 'Other'];
            if (!validTopics.includes(topic)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid topic selected',
                });
                return;
            }
            // Validate field lengths
            if (subject.length > 150) {
                res.status(400).json({
                    success: false,
                    message: 'Subject must be less than 150 characters',
                });
                return;
            }
            if (message.length > 5000) {
                res.status(400).json({
                    success: false,
                    message: 'Message must be less than 5000 characters',
                });
                return;
            }
            // Get user email from auth middleware (it sets req.email)
            const userEmail = req.email;
            if (!userEmail) {
                res.status(400).json({
                    success: false,
                    message: 'User email information is missing',
                });
                return;
            }
            // Use email as userName if full name not available
            const userName = userEmail;
            // Create support ticket
            const ticket = await contactSupportService_1.default.createSupportTicket(userId, userEmail, userName, topic, subject, message);
            res.status(201).json({
                success: true,
                message: 'Support ticket created successfully',
                data: ticket,
            });
        }
        catch (error) {
            const err = error;
            console.error('[SUPPORT] Error in createSupportTicket:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error creating support ticket',
            });
        }
    }
    /**
     * Get all tickets for authenticated user
     * GET /api/support/my-tickets
     */
    static async getUserTickets(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }
            const tickets = await contactSupportService_1.default.getUserTickets(userId);
            res.status(200).json({
                success: true,
                data: tickets,
            });
        }
        catch (error) {
            const err = error;
            console.error('[SUPPORT] Error in getUserTickets:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error fetching tickets',
            });
        }
    }
    /**
     * Get specific ticket details
     * GET /api/support/ticket/:ticketId
     */
    static async getTicketDetails(req, res) {
        try {
            const ticketId = req.params.ticketId;
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }
            if (!ticketId) {
                res.status(400).json({
                    success: false,
                    message: 'Ticket ID is required',
                });
                return;
            }
            const ticket = await contactSupportService_1.default.getTicketById(ticketId, userId);
            if (!ticket) {
                res.status(404).json({
                    success: false,
                    message: 'Ticket not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: ticket,
            });
        }
        catch (error) {
            const err = error;
            console.error('[SUPPORT] Error in getTicketDetails:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error fetching ticket',
            });
        }
    }
    /**
     * Get all tickets (admin only)
     * GET /api/support/admin/tickets
     */
    static async getAllTickets(req, res) {
        try {
            // Helper function to extract string from query parameter
            const getQueryParam = (param) => {
                if (Array.isArray(param)) {
                    return param[0];
                }
                if (typeof param === 'string') {
                    return param;
                }
                return undefined;
            };
            const status = getQueryParam(req.query.status);
            const topic = getQueryParam(req.query.topic);
            const skipParam = getQueryParam(req.query.skip) || '0';
            const limitParam = getQueryParam(req.query.limit) || '50';
            const tickets = await contactSupportService_1.default.getAllTickets(status, topic, parseInt(skipParam, 10), parseInt(limitParam, 10));
            res.status(200).json({
                success: true,
                data: tickets.tickets,
                total: tickets.total,
                pagination: {
                    skip: parseInt(skipParam, 10),
                    limit: parseInt(limitParam, 10),
                    total: tickets.total,
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[SUPPORT] Error in getAllTickets:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error fetching tickets',
            });
        }
    }
    /**
     * Update ticket status (admin only)
     * PATCH /api/support/admin/ticket/:ticketId/status
     */
    static async updateTicketStatus(req, res) {
        try {
            const ticketId = req.params.ticketId;
            const { status, adminNotes } = req.body;
            if (!ticketId) {
                res.status(400).json({
                    success: false,
                    message: 'Ticket ID is required',
                });
                return;
            }
            if (!status) {
                res.status(400).json({
                    success: false,
                    message: 'Status is required',
                });
                return;
            }
            const updatedTicket = await contactSupportService_1.default.updateTicketStatus(ticketId, status, adminNotes);
            if (!updatedTicket) {
                res.status(404).json({
                    success: false,
                    message: 'Ticket not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Ticket status updated successfully',
                data: updatedTicket,
            });
        }
        catch (error) {
            const err = error;
            console.error('[SUPPORT] Error in updateTicketStatus:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error updating ticket',
            });
        }
    }
    /**
     * Delete a ticket (admin only)
     * DELETE /api/support/admin/ticket/:ticketId
     */
    static async deleteTicket(req, res) {
        try {
            const ticketId = req.params.ticketId;
            if (!ticketId) {
                res.status(400).json({
                    success: false,
                    message: 'Ticket ID is required',
                });
                return;
            }
            await contactSupportService_1.default.deleteTicket(ticketId);
            res.status(200).json({
                success: true,
                message: 'Ticket deleted successfully',
            });
        }
        catch (error) {
            const err = error;
            console.error('[SUPPORT] Error in deleteTicket:', err);
            res.status(500).json({
                success: false,
                message: err.message || 'Error deleting ticket',
            });
        }
    }
}
exports.ContactSupportController = ContactSupportController;
exports.default = ContactSupportController;
