// import ContactSupport, { IContactSupport } from '../../models/ContactSupport';
import ContactSupport, { IContactSupport }  from '../models/ContactSupport';
import emailService from './emailService';
import mongoose from 'mongoose';

class ContactSupportService {
  /**
   * Create a new support ticket
   */
  async createSupportTicket(
    userId: string,
    userEmail: string,
    userName: string,
    topic: string,
    subject: string,
    message: string
  ): Promise<IContactSupport> {
    try {
      // Validate topic
      const validTopics = ['Account', 'Billing & Payments', 'Transactions', 'Technical issue', 'Other'];
      if (!validTopics.includes(topic)) {
        throw new Error('Invalid topic selected');
      }

      // Create new ticket
      const ticket = new ContactSupport({
        userId: new mongoose.Types.ObjectId(userId),
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
    } catch (error) {
      console.error('[SUPPORT] Error creating support ticket:', error);
      throw error;
    }
  }

  /**
   * Get all support tickets for a user
   */
  async getUserTickets(userId: string): Promise<IContactSupport[]> {
    try {
      const tickets = await ContactSupport.find({
        userId: new mongoose.Types.ObjectId(userId),
      }).sort({ createdAt: -1 });

      return tickets;
    } catch (error) {
      console.error('[SUPPORT] Error fetching user tickets:', error);
      throw error;
    }
  }

  /**
   * Get ticket details by ID
   */
  async getTicketById(ticketId: string, userId: string): Promise<IContactSupport | null> {
    try {
      const ticket = await ContactSupport.findOne({
        _id: new mongoose.Types.ObjectId(ticketId),
        userId: new mongoose.Types.ObjectId(userId),
      });

      return ticket;
    } catch (error) {
      console.error('[SUPPORT] Error fetching ticket:', error);
      throw error;
    }
  }

  /**
   * Get all support tickets (admin)
   */
  async getAllTickets(
    status?: string,
    topic?: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<{ tickets: IContactSupport[]; total: number }> {
    try {
      const filter: any = {};

      if (status) filter.status = status;
      if (topic) filter.topic = topic;

      const total = await ContactSupport.countDocuments(filter);
      const tickets = await ContactSupport.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email firstName lastName');

      return { tickets, total };
    } catch (error) {
      console.error('[SUPPORT] Error fetching all tickets:', error);
      throw error;
    }
  }

  /**
   * Update ticket status (admin)
   */
  async updateTicketStatus(ticketId: string, status: string, adminNotes?: string): Promise<IContactSupport | null> {
    try {
      const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      const ticket = await ContactSupport.findByIdAndUpdate(
        ticketId,
        {
          status,
          adminNotes: adminNotes || undefined,
        },
        { new: true }
      );

      if (ticket) {
        console.log(`[SUPPORT] Ticket ${ticketId} status updated to ${status}`);

        // Send status update email to user
        await this.sendStatusUpdateEmail(ticket, status);
      }

      return ticket;
    } catch (error) {
      console.error('[SUPPORT] Error updating ticket:', error);
      throw error;
    }
  }

  /**
   * Calculate priority based on topic
   */
  private calculatePriority(topic: string): 'low' | 'medium' | 'high' {
    const highPriorityTopics = ['Technical issue', 'Billing & Payments'];
    const mediumPriorityTopics = ['Transactions', 'Account'];
    const lowPriorityTopics = ['Other'];

    if (highPriorityTopics.includes(topic)) return 'high';
    if (mediumPriorityTopics.includes(topic)) return 'medium';
    if (lowPriorityTopics.includes(topic)) return 'low';

    return 'medium';
  }

  /**
   * Send confirmation email to user
   */
  private async sendUserConfirmationEmail(
    userEmail: string,
    userName: string,
    subject: string,
    ticketId: string
  ): Promise<void> {
    try {
      const html = emailService.generateSupportTicketConfirmationEmailHtml(userName, subject, ticketId);

      await emailService.sendEmail({
        to: userEmail,
        subject: `Support Ticket Received - Ticket #${ticketId}`,
        html,
      });

      console.log(`[SUPPORT] Confirmation email sent to ${userEmail}`);
    } catch (error) {
      console.error('[SUPPORT] Error sending confirmation email:', error);
      // Don't throw - email failure shouldn't block ticket creation
    }
  }

  /**
   * Send admin notification email
   */
  private async sendAdminNotificationEmail(ticket: IContactSupport): Promise<void> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'okwolig60@gmail.com';
      const html = emailService.generateSupportTicketAdminEmailHtml(ticket);

      await emailService.sendEmail({
        to: adminEmail,
        subject: `[${ticket.priority.toUpperCase()}] New Support Ticket: ${ticket.subject}`,
        html,
      });

      console.log(`[SUPPORT] Admin notification sent to ${adminEmail}`);
    } catch (error) {
      console.error('[SUPPORT] Error sending admin notification:', error);
      // Don't throw - email failure shouldn't block ticket creation
    }
  }

  /**
   * Send status update email to user
   */
  private async sendStatusUpdateEmail(ticket: IContactSupport, newStatus: string): Promise<void> {
    try {
      const html = emailService.generateSupportTicketStatusUpdateEmailHtml(
        ticket.userName,
        ticket.subject,
        ticket._id.toString(),
        newStatus
      );

      await emailService.sendEmail({
        to: ticket.userEmail,
        subject: `Support Ticket Update - Ticket #${ticket._id}`,
        html,
      });

      console.log(`[SUPPORT] Status update email sent to ${ticket.userEmail}`);
    } catch (error) {
      console.error('[SUPPORT] Error sending status update email:', error);
      // Don't throw - email failure shouldn't block status update
    }
  }

  /**
   * Delete a support ticket (admin only)
   */
  async deleteTicket(ticketId: string): Promise<void> {
    try {
      await ContactSupport.findByIdAndDelete(ticketId);
      console.log(`[SUPPORT] Ticket ${ticketId} deleted`);
    } catch (error) {
      console.error('[SUPPORT] Error deleting ticket:', error);
      throw error;
    }
  }
}

export default new ContactSupportService();
