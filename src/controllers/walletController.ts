import { Request, Response } from 'express';
import Wallet from '../models/Wallet';
import WithdrawalRequest from '../models/WithdrawalRequest';
import walletService from '../services/walletService';
import emailService from '../services/emailService';
import User from '../models/User';

const BTC_ADDRESS_REGEX =
  /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{25,90})$/;

export class WalletController {
  /**
   * @route GET /api/wallet/me
   * @access Private
   */
  static async getMyWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        res.status(404).json({ success: false, message: 'Wallet not found for this user' });
        return;
      }

      const availableBalance = await walletService.getAvailableBalance(wallet);

      res.status(200).json({
        success: true,
        data: {
          walletId: wallet._id,
          accountNumber: wallet.accountNumber,
          balance: wallet.balance,
          availableBalance,
          currency: wallet.currency,
          status: wallet.status,
        },
      });
    } catch (error: any) {
      console.error('[WALLET] Error fetching wallet:', error);
      res.status(500).json({ success: false, message: error.message || 'Error fetching wallet' });
    }
  }

  /**
   * @route POST /api/wallet/withdraw
   * @body amount, bitcoinAddress
   * @access Private
   */
  static async requestWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { amount, bitcoinAddress } = req.body;

      if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ success: false, message: 'A valid withdrawal amount is required' });
        return;
      }

      if (!bitcoinAddress || typeof bitcoinAddress !== 'string') {
        res.status(400).json({ success: false, message: 'Bitcoin wallet address is required' });
        return;
      }

      if (!BTC_ADDRESS_REGEX.test(bitcoinAddress.trim())) {
        res.status(400).json({ success: false, message: 'Please provide a valid Bitcoin wallet address' });
        return;
      }

      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        res.status(404).json({ success: false, message: 'Wallet not found for this user' });
        return;
      }

      if (wallet.status !== 'active') {
        res.status(403).json({ success: false, message: 'This wallet is not currently active' });
        return;
      }

      const availableBalance = await walletService.getAvailableBalance(wallet);
      if (amount > availableBalance) {
        res.status(400).json({
          success: false,
          message: `Insufficient available balance. Available: ${availableBalance} ${wallet.currency}`,
        });
        return;
      }

      const withdrawalRequest = await WithdrawalRequest.create({
        userId,
        walletId: wallet._id,
        amount,
        bitcoinAddress: bitcoinAddress.trim(),
        status: 'pending',
      });

      // Notify admin(s) — wire up an admin distribution list/env var as needed
      try {
        const user = await User.findById(userId);
        if (process.env.ADMIN_NOTIFICATION_EMAIL) {
          const html = emailService.generateWithdrawalRequestAdminEmailHtml(
            `${user?.firstName} ${user?.lastName}`,
            wallet.accountNumber,
            amount,
            bitcoinAddress.trim()
          );
          await emailService.sendEmail({
            to: process.env.ADMIN_NOTIFICATION_EMAIL,
            subject: 'New Withdrawal Request Pending Review - Crown Ledger',
            html,
          });
        }
      } catch (emailError) {
        console.error('[WALLET] Error sending admin withdrawal notification:', emailError);
      }

      res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted and pending admin review',
        data: withdrawalRequest,
      });
    } catch (error: any) {
      console.error('[WALLET] Error creating withdrawal request:', error);
      res.status(500).json({ success: false, message: error.message || 'Error creating withdrawal request' });
    }
  }

  /**
   * @route GET /api/wallet/withdrawals
   * @access Private
   */
  static async getMyWithdrawals(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const withdrawals = await WithdrawalRequest.find({ userId }).sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: withdrawals });
    } catch (error: any) {
      console.error('[WALLET] Error fetching withdrawal history:', error);
      res.status(500).json({ success: false, message: error.message || 'Error fetching withdrawal history' });
    }
  }
}