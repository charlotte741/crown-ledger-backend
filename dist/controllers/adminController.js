"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const User_1 = __importDefault(require("../models/User"));
const UserInvestment_1 = __importDefault(require("../models/UserInvestment"));
const InvestmentPlan_1 = __importDefault(require("../models/InvestmentPlan"));
const SavingsPlan_1 = __importDefault(require("../models/SavingsPlan"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const WithdrawalRequest_1 = __importDefault(require("../models/WithdrawalRequest"));
const AdminAuditLog_1 = __importDefault(require("../models/AdminAuditLog"));
const investmentService_1 = __importDefault(require("../services/investmentService"));
const savingsPlansService_1 = __importDefault(require("../services/savingsPlansService"));
const emailService_1 = __importDefault(require("../services/emailService"));
class AdminController {
    /**
     * Get all users with their investment and savings balances
     * @route GET /api/admin/users-balances
     * @access Private (Admin only)
     */
    async getAllUsersBalances(req, res) {
        try {
            const { page = 1, limit = 20, searchQuery = '' } = req.query;
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            const skip = (pageNum - 1) * limitNum;
            // Build search query
            let query = {};
            if (searchQuery) {
                query = {
                    $or: [
                        { email: { $regex: searchQuery, $options: 'i' } },
                        { username: { $regex: searchQuery, $options: 'i' } },
                        { firstName: { $regex: searchQuery, $options: 'i' } },
                        { lastName: { $regex: searchQuery, $options: 'i' } },
                    ],
                };
            }
            // Get total count
            const totalUsers = await User_1.default.countDocuments(query);
            // Fetch users with pagination
            const users = await User_1.default.find(query)
                .select('_id firstName lastName email username createdAt')
                .skip(skip)
                .limit(limitNum)
                .sort({ createdAt: -1 });
            // Enrich each user with investment and savings balances
            const usersWithBalances = await Promise.all(users.map(async (user) => {
                // Get investment balance
                const investmentSummary = await investmentService_1.default.getPortfolioSummary(user._id.toString());
                // Get savings balance
                const savingsSummary = await savingsPlansService_1.default.getSavingsSummary(user._id.toString());
                return {
                    userId: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    username: user.username,
                    createdAt: user.createdAt,
                    investmentBalance: {
                        totalInvested: investmentSummary.totalInvested,
                        portfolioValue: investmentSummary.portfolioValue,
                        totalGains: investmentSummary.totalGains,
                        avgReturn: investmentSummary.avgReturn,
                        activePlans: investmentSummary.activePlans,
                    },
                    savingsBalance: {
                        balance: savingsSummary.balance,
                        targetAmount: savingsSummary.targetAmount,
                        totalInterestEarned: savingsSummary.totalInterestEarned,
                        monthlyInterest: savingsSummary.monthlyInterest,
                        activePlans: savingsSummary.activePlans,
                        completedPlans: savingsSummary.completedPlans,
                    },
                    totalBalance: investmentSummary.portfolioValue + savingsSummary.balance,
                };
            }));
            res.status(200).json({
                success: true,
                data: usersWithBalances,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalUsers,
                    pages: Math.ceil(totalUsers / limitNum),
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error fetching users balances:', error);
            res.status(500).json({
                success: false,
                message: err.message || 'Error fetching users balances',
            });
        }
    }
    /**
     * Get detailed balance for a specific user
     * @route GET /api/admin/user/:userId/balance-details
     * @access Private (Admin only)
     */
    async getUserBalanceDetails(req, res) {
        try {
            const userId = Array.isArray(req.params.userId)
                ? req.params.userId[0]
                : req.params.userId;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            // Get user
            const user = await User_1.default.findById(userId).select('firstName lastName email username accountType currency createdAt');
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            // Get detailed investment data
            const investments = await UserInvestment_1.default.find({ userId });
            const investmentSummary = await investmentService_1.default.getPortfolioSummary(userId);
            // Get detailed savings data
            const savingsPlans = await SavingsPlan_1.default.find({ userId });
            const savingsSummary = await savingsPlansService_1.default.getSavingsSummary(userId);
            // Get wallet
            const wallet = await Wallet_1.default.findOne({ userId });
            res.status(200).json({
                success: true,
                data: {
                    user: {
                        userId: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        username: user.username,
                        accountType: user.accountType,
                        currency: user.currency,
                        createdAt: user.createdAt,
                    },
                    wallet: wallet
                        ? {
                            walletId: wallet._id,
                            accountNumber: wallet.accountNumber,
                            balance: wallet.balance,
                            currency: wallet.currency,
                            status: wallet.status,
                        }
                        : null,
                    investments: {
                        summary: investmentSummary,
                        count: investments.length,
                        details: investments.map((inv) => ({
                            investmentId: inv._id,
                            planName: inv.planName,
                            amountInvested: inv.amountInvested,
                            currentValue: inv.currentValue,
                            totalGain: inv.totalGain,
                            status: inv.status,
                            investmentDate: inv.investmentDate,
                            maturityDate: inv.maturityDate,
                        })),
                    },
                    savings: {
                        summary: savingsSummary,
                        count: savingsPlans.length,
                        details: savingsPlans.map((plan) => ({
                            planId: plan._id,
                            planName: plan.planName,
                            targetAmount: plan.targetAmount,
                            currentAmount: plan.currentAmount,
                            status: plan.status,
                            earnInterest: plan.earnInterest,
                            totalInterestEarned: plan.totalInterestEarned,
                        })),
                    },
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error fetching user balance details:', error);
            res.status(500).json({
                success: false,
                message: err.message || 'Error fetching user balance details',
            });
        }
    }
    /**
     * Update user's savings balance (increase/decrease)
     * @route PUT /api/admin/user/:userId/update-savings-balance
     * @access Private (Admin only)
     * @body amount: number (positive to increase, negative to decrease), reason: string
     */
    async updateUserSavingsBalance(req, res) {
        try {
            const userId = Array.isArray(req.params.userId)
                ? req.params.userId[0]
                : req.params.userId;
            const { amount, reason } = req.body;
            const adminId = req.userId; // From JWT middleware
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
                return;
            }
            if (amount === undefined || amount === null) {
                res.status(400).json({
                    success: false,
                    message: 'Amount is required',
                });
                return;
            }
            if (typeof amount !== 'number' || amount === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Amount must be a non-zero number',
                });
                return;
            }
            // Get user
            const user = await User_1.default.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            // Get user's active savings plans
            const savingsPlans = await SavingsPlan_1.default.find({ userId, status: 'active' });
            if (savingsPlans.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'User has no active savings plans',
                });
                return;
            }
            // Update the first active savings plan (or distribute across plans)
            // For simplicity, we'll update the one with the highest balance
            const targetPlan = savingsPlans.reduce((prev, current) => prev.currentAmount > current.currentAmount ? prev : current);
            const balanceBefore = targetPlan.currentAmount;
            const balanceAfter = Math.max(0, balanceBefore + amount);
            // Update plan balance
            targetPlan.currentAmount = balanceAfter;
            targetPlan.progressPercentage = Math.min(100, (balanceAfter / targetPlan.targetAmount) * 100);
            // Check if plan is completed
            if (balanceAfter >= targetPlan.targetAmount && balanceAfter > 0) {
                targetPlan.status = 'completed';
            }
            await targetPlan.save();
            // Notify the user after the balance is persisted. Email failure must not
            // roll back a successful admin balance update.
            try {
                if (user.email) {
                    const emailHtml = emailService_1.default.generateAdminSavingsBalanceUpdateEmailHtml(user.firstName || 'Valued User', amount, balanceBefore, balanceAfter, targetPlan.planName, reason || 'Manual admin adjustment');
                    await emailService_1.default.sendEmail({
                        to: user.email,
                        subject: 'Your Savings Balance Was Updated - Crown Ledger',
                        html: emailHtml,
                    });
                }
            }
            catch (emailError) {
                console.error('[ADMIN] Error sending savings balance update email:', emailError);
            }
            // Log this admin action
            try {
                await AdminAuditLog_1.default.create({
                    adminId,
                    actionType: 'update_savings_balance',
                    targetUserId: userId,
                    details: {
                        planId: targetPlan._id,
                        planName: targetPlan.planName,
                        amountChanged: amount,
                        balanceBefore,
                        balanceAfter,
                        reason: reason || 'No reason provided',
                    },
                    timestamp: new Date(),
                });
            }
            catch (auditError) {
                console.error('[ADMIN] Error creating audit log:', auditError);
                // Don't fail the update if audit logging fails
            }
            res.status(200).json({
                success: true,
                message: 'Savings balance updated successfully',
                data: {
                    userId,
                    planId: targetPlan._id,
                    planName: targetPlan.planName,
                    amountChanged: amount,
                    balanceBefore,
                    balanceAfter,
                    status: targetPlan.status,
                    progressPercentage: targetPlan.progressPercentage,
                    reason: reason || 'Manual admin adjustment',
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error updating user savings balance:', error);
            res.status(500).json({
                success: false,
                message: err.message || 'Error updating user savings balance',
            });
        }
    }
    /**
     * Update a user's investment current value and notify them by email.
     * @route PUT /api/admin/user/:userId/update-investment-balance
     * @access Private (Admin only)
     * @body amount: number (positive to increase, negative to decrease), investmentId?: string, reason?: string
     */
    async updateUserInvestmentBalance(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            const { amount, investmentId, reason } = req.body;
            const adminId = req.userId;
            if (!userId) {
                res.status(400).json({ success: false, message: 'User ID is required' });
                return;
            }
            if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) {
                res.status(400).json({ success: false, message: 'Amount must be a non-zero number' });
                return;
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            const investmentQuery = { userId, status: 'active' };
            if (investmentId)
                investmentQuery._id = investmentId;
            const investments = await UserInvestment_1.default.find(investmentQuery);
            let targetInvestment = investments.length
                ? investments.reduce((prev, current) => (prev.currentValue > current.currentValue ? prev : current))
                : null;
            let createdInvestment = false;
            // If the user has no investment, create one from the first active plan.
            if (!targetInvestment) {
                if (amount < 0) {
                    res.status(400).json({ success: false, message: 'Cannot decrease a balance when the user has no investment' });
                    return;
                }
                const plan = await InvestmentPlan_1.default.findOne({ status: 'active' }).sort({ createdAt: 1 });
                if (!plan) {
                    res.status(400).json({ success: false, message: 'No active investment plan is available' });
                    return;
                }
                const initialBalance = Math.round(amount * 100) / 100;
                const investmentDate = new Date();
                const maturityDate = new Date(investmentDate);
                maturityDate.setMonth(maturityDate.getMonth() + plan.duration);
                targetInvestment = new UserInvestment_1.default({
                    userId,
                    planId: plan._id,
                    planName: plan.name,
                    amountInvested: initialBalance,
                    currentValue: initialBalance,
                    gain: 0,
                    totalGain: 0,
                    gainPercentage: 0,
                    monthlyPerformance: [],
                    transactions: [{
                            type: 'buy',
                            amount: initialBalance,
                            valueBefore: 0,
                            valueAfter: initialBalance,
                            description: `Admin investment balance adjustment of $${initialBalance}`,
                            timestamp: investmentDate,
                        }],
                    investmentDate,
                    maturityDate,
                    status: 'active',
                });
                await targetInvestment.save();
                await User_1.default.findByIdAndUpdate(userId, { $addToSet: { investments: targetInvestment._id } });
                createdInvestment = true;
            }
            else {
                const investedBefore = targetInvestment.amountInvested;
                const valueBefore = targetInvestment.currentValue;
                const investedAfter = Math.max(0, Math.round((investedBefore + amount) * 100) / 100);
                const valueAfter = Math.max(0, Math.round((valueBefore + amount) * 100) / 100);
                targetInvestment.amountInvested = investedAfter;
                targetInvestment.currentValue = valueAfter;
                targetInvestment.totalGain = Math.round((valueAfter - investedAfter) * 100) / 100;
                targetInvestment.gainPercentage = investedAfter > 0
                    ? Math.round((targetInvestment.totalGain / investedAfter) * 10000) / 100
                    : 0;
                targetInvestment.transactions.push({
                    type: amount >= 0 ? 'buy' : 'sell',
                    amount: Math.abs(amount),
                    valueBefore,
                    valueAfter,
                    description: `Admin investment balance adjustment of $${amount}`,
                    timestamp: new Date(),
                });
                await targetInvestment.save();
            }
            const balanceBefore = targetInvestment.currentValue - amount;
            const balanceAfter = targetInvestment.currentValue;
            try {
                if (user.email) {
                    const html = emailService_1.default.generateAdminInvestmentBalanceUpdateEmailHtml(user.firstName || 'Valued User', amount, balanceBefore, balanceAfter, targetInvestment.planName, reason || 'Manual admin adjustment');
                    await emailService_1.default.sendEmail({
                        to: user.email,
                        subject: 'Your Investment Balance Was Updated - Crown Ledger',
                        html,
                    });
                }
            }
            catch (emailError) {
                console.error('[ADMIN] Error sending investment balance update email:', emailError);
            }
            try {
                await AdminAuditLog_1.default.create({
                    adminId,
                    actionType: 'update_investment_balance',
                    targetUserId: userId,
                    details: {
                        investmentId: targetInvestment._id,
                        planName: targetInvestment.planName,
                        amountChanged: amount,
                        balanceBefore,
                        balanceAfter,
                        amountInvested: targetInvestment.amountInvested,
                        currentValue: targetInvestment.currentValue,
                        createdInvestment,
                        reason: reason || 'No reason provided',
                    },
                    timestamp: new Date(),
                });
            }
            catch (auditError) {
                console.error('[ADMIN] Error creating investment audit log:', auditError);
            }
            res.status(200).json({
                success: true,
                message: 'Investment balance updated successfully',
                data: {
                    userId,
                    investmentId: targetInvestment._id,
                    planName: targetInvestment.planName,
                    amountChanged: amount,
                    balanceBefore,
                    balanceAfter,
                    totalGain: targetInvestment.totalGain,
                    gainPercentage: targetInvestment.gainPercentage,
                    reason: reason || 'Manual admin adjustment',
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error updating user investment balance:', error);
            res.status(500).json({ success: false, message: err.message || 'Error updating user investment balance' });
        }
    }
    /**
     * Credit or debit a user's wallet using their account number.
     * @route PUT /api/admin/wallet/credit
     * @access Private (Admin only)
     * @body accountNumber: string, amount: number (positive to credit, negative to debit), reason?: string
     */
    async creditWalletByAccountNumber(req, res) {
        try {
            const { accountNumber, amount, reason } = req.body;
            const adminId = req.userId;
            if (!accountNumber) {
                res.status(400).json({ success: false, message: 'Account number is required' });
                return;
            }
            if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) {
                res.status(400).json({ success: false, message: 'Amount must be a non-zero number' });
                return;
            }
            const wallet = await Wallet_1.default.findOne({ accountNumber });
            if (!wallet) {
                res.status(404).json({ success: false, message: 'No wallet found for that account number' });
                return;
            }
            const balanceBefore = wallet.balance;
            const balanceAfter = Math.max(0, Math.round((balanceBefore + amount) * 100) / 100);
            wallet.balance = balanceAfter;
            await wallet.save();
            const user = await User_1.default.findById(wallet.userId);
            try {
                if (user?.email) {
                    const html = emailService_1.default.generateAdminWalletCreditEmailHtml(user.firstName || 'Valued User', amount, balanceBefore, balanceAfter, wallet.accountNumber, reason || 'Credit Update');
                    await emailService_1.default.sendEmail({
                        to: user.email,
                        subject: 'Your Wallet Balance Was Updated - Crown Ledger',
                        html,
                    });
                }
            }
            catch (emailError) {
                console.error('[ADMIN] Error sending wallet credit email:', emailError);
            }
            try {
                await AdminAuditLog_1.default.create({
                    adminId,
                    actionType: 'credit_wallet',
                    targetUserId: wallet.userId,
                    details: {
                        walletId: wallet._id,
                        accountNumber: wallet.accountNumber,
                        amountChanged: amount,
                        balanceBefore,
                        balanceAfter,
                        reason: reason || 'No reason provided',
                    },
                    timestamp: new Date(),
                });
            }
            catch (auditError) {
                console.error('[ADMIN] Error creating wallet credit audit log:', auditError);
            }
            res.status(200).json({
                success: true,
                message: 'Wallet balance updated successfully',
                data: {
                    accountNumber: wallet.accountNumber,
                    amountChanged: amount,
                    balanceBefore,
                    balanceAfter,
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error crediting wallet:', error);
            res.status(500).json({ success: false, message: err.message || 'Error crediting wallet' });
        }
    }
    /**
     * List withdrawal requests, optionally filtered by status.
     * @route GET /api/admin/withdrawals
     * @access Private (Admin only)
     */
    async getWithdrawalRequests(req, res) {
        try {
            const { page = 1, limit = 20, status = '' } = req.query;
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            const skip = (pageNum - 1) * limitNum;
            const query = {};
            if (status) {
                query.status = status;
            }
            const total = await WithdrawalRequest_1.default.countDocuments(query);
            const withdrawals = await WithdrawalRequest_1.default.find(query)
                .populate('userId', 'firstName lastName email username')
                .populate('walletId', 'accountNumber balance currency')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum);
            res.status(200).json({
                success: true,
                data: withdrawals,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum),
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error fetching withdrawal requests:', error);
            res.status(500).json({ success: false, message: err.message || 'Error fetching withdrawal requests' });
        }
    }
    /**
     * Approve or reject a pending withdrawal request. Approving debits the wallet
     * and records the pre/post balance on the request for an audit trail.
     * @route PUT /api/admin/withdrawals/:withdrawalId/review
     * @access Private (Admin only)
     * @body decision: 'approve' | 'reject', note?: string
     */
    async reviewWithdrawalRequest(req, res) {
        try {
            const withdrawalId = Array.isArray(req.params.withdrawalId)
                ? req.params.withdrawalId[0]
                : req.params.withdrawalId;
            const { decision, note } = req.body;
            const adminId = req.userId;
            if (!withdrawalId) {
                res.status(400).json({ success: false, message: 'Withdrawal request ID is required' });
                return;
            }
            if (decision !== 'approve' && decision !== 'reject') {
                res.status(400).json({ success: false, message: "Decision must be 'approve' or 'reject'" });
                return;
            }
            const withdrawalRequest = await WithdrawalRequest_1.default.findById(withdrawalId);
            if (!withdrawalRequest) {
                res.status(404).json({ success: false, message: 'Withdrawal request not found' });
                return;
            }
            if (withdrawalRequest.status !== 'pending') {
                res.status(400).json({
                    success: false,
                    message: `This request has already been ${withdrawalRequest.status}`,
                });
                return;
            }
            const wallet = await Wallet_1.default.findById(withdrawalRequest.walletId);
            if (!wallet) {
                res.status(404).json({ success: false, message: 'Associated wallet not found' });
                return;
            }
            if (decision === 'approve') {
                if (wallet.balance < withdrawalRequest.amount) {
                    res.status(400).json({
                        success: false,
                        message: 'Wallet balance is insufficient to approve this withdrawal',
                    });
                    return;
                }
                const balanceBefore = wallet.balance;
                const balanceAfter = Math.round((balanceBefore - withdrawalRequest.amount) * 100) / 100;
                wallet.balance = balanceAfter;
                await wallet.save();
                withdrawalRequest.status = 'approved';
                withdrawalRequest.balanceBefore = balanceBefore;
                withdrawalRequest.balanceAfter = balanceAfter;
            }
            else {
                withdrawalRequest.status = 'rejected';
            }
            withdrawalRequest.reviewedBy = adminId;
            withdrawalRequest.reviewNote = note || undefined;
            withdrawalRequest.reviewedAt = new Date();
            await withdrawalRequest.save();
            const user = await User_1.default.findById(withdrawalRequest.userId);
            try {
                if (user?.email) {
                    const html = emailService_1.default.generateWithdrawalReviewedEmailHtml(user.firstName || 'Valued User', withdrawalRequest.amount, withdrawalRequest.bitcoinAddress, withdrawalRequest.status, note);
                    await emailService_1.default.sendEmail({
                        to: user.email,
                        subject: `Your Withdrawal Request Was ${withdrawalRequest.status === 'approved' ? 'Approved' : 'Rejected'} - Crown Ledger`,
                        html,
                    });
                }
            }
            catch (emailError) {
                console.error('[ADMIN] Error sending withdrawal review email:', emailError);
            }
            try {
                await AdminAuditLog_1.default.create({
                    adminId,
                    actionType: decision === 'approve' ? 'approve_withdrawal' : 'reject_withdrawal',
                    targetUserId: withdrawalRequest.userId,
                    details: {
                        withdrawalId: withdrawalRequest._id,
                        accountNumber: wallet.accountNumber,
                        amount: withdrawalRequest.amount,
                        bitcoinAddress: withdrawalRequest.bitcoinAddress,
                        note: note || 'No note provided',
                    },
                    timestamp: new Date(),
                });
            }
            catch (auditError) {
                console.error('[ADMIN] Error creating withdrawal review audit log:', auditError);
            }
            res.status(200).json({
                success: true,
                message: `Withdrawal request ${withdrawalRequest.status}`,
                data: withdrawalRequest,
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error reviewing withdrawal request:', error);
            res.status(500).json({ success: false, message: err.message || 'Error reviewing withdrawal request' });
        }
    }
    /**
     * Get admin audit logs
     * @route GET /api/admin/audit-logs
     * @access Private (Admin only)
     */
    async getAuditLogs(req, res) {
        try {
            const { page = 1, limit = 50, actionType = '', userId = '' } = req.query;
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 50;
            const skip = (pageNum - 1) * limitNum;
            // Build query
            let query = {};
            if (actionType) {
                query.actionType = actionType;
            }
            if (userId) {
                query.targetUserId = userId;
            }
            // Get total count
            const totalLogs = await AdminAuditLog_1.default.countDocuments(query);
            // Fetch logs
            const logs = await AdminAuditLog_1.default.find(query)
                .populate('adminId', 'firstName lastName email')
                .populate('targetUserId', 'firstName lastName email username')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limitNum);
            res.status(200).json({
                success: true,
                data: logs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: totalLogs,
                    pages: Math.ceil(totalLogs / limitNum),
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error fetching audit logs:', error);
            res.status(500).json({
                success: false,
                message: err.message || 'Error fetching audit logs',
            });
        }
    }
    /**
     * Get admin dashboard summary
     * @route GET /api/admin/dashboard-summary
     * @access Private (Admin only)
     */
    async getDashboardSummary(req, res) {
        try {
            // Total users
            const totalUsers = await User_1.default.countDocuments();
            // Total investments
            const totalInvestments = await UserInvestment_1.default.countDocuments({ status: 'active' });
            const investmentStats = await UserInvestment_1.default.aggregate([
                { $match: { status: 'active' } },
                {
                    $group: {
                        _id: null,
                        totalInvested: { $sum: '$amountInvested' },
                        totalValue: {
                            $sum: {
                                $cond: [
                                    { $gt: ['$monthlyPerformance', []] },
                                    { $arrayElemAt: ['$monthlyPerformance.value', -1] },
                                    '$currentValue',
                                ],
                            },
                        },
                    },
                },
            ]);
            // Total savings
            const savingsStats = await SavingsPlan_1.default.aggregate([
                { $match: { status: 'active' } },
                {
                    $group: {
                        _id: null,
                        totalSavings: { $sum: '$currentAmount' },
                        totalTarget: { $sum: '$targetAmount' },
                        averageAPY: { $avg: '$interestRate' },
                        plansCount: { $sum: 1 },
                    },
                },
            ]);
            // Total wallet balances + pending withdrawals
            const walletStats = await Wallet_1.default.aggregate([
                {
                    $group: {
                        _id: null,
                        totalWalletBalance: { $sum: '$balance' },
                        walletsCount: { $sum: 1 },
                    },
                },
            ]);
            const pendingWithdrawalsCount = await WithdrawalRequest_1.default.countDocuments({ status: 'pending' });
            const pendingWithdrawalsStats = await WithdrawalRequest_1.default.aggregate([
                { $match: { status: 'pending' } },
                { $group: { _id: null, totalPending: { $sum: '$amount' } } },
            ]);
            const investmentData = investmentStats[0] || {
                totalInvested: 0,
                totalValue: 0,
            };
            const savingsData = savingsStats[0] || {
                totalSavings: 0,
                totalTarget: 0,
                averageAPY: 0,
                plansCount: 0,
            };
            const walletData = walletStats[0] || {
                totalWalletBalance: 0,
                walletsCount: 0,
            };
            const pendingWithdrawalsData = pendingWithdrawalsStats[0] || { totalPending: 0 };
            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    investments: {
                        activeInvestments: totalInvestments,
                        totalInvested: investmentData.totalInvested,
                        portfolioValue: investmentData.totalValue,
                        totalGains: investmentData.totalValue - investmentData.totalInvested,
                    },
                    savings: {
                        activeSavingsPlans: savingsData.plansCount,
                        totalSavings: savingsData.totalSavings,
                        totalTarget: savingsData.totalTarget,
                        averageAPY: Math.round(savingsData.averageAPY * 10) / 10,
                    },
                    wallets: {
                        walletsCount: walletData.walletsCount,
                        totalWalletBalance: walletData.totalWalletBalance,
                        pendingWithdrawalsCount,
                        pendingWithdrawalsTotal: pendingWithdrawalsData.totalPending,
                    },
                    lastUpdated: new Date(),
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error fetching dashboard summary:', error);
            res.status(500).json({
                success: false,
                message: err.message || 'Error fetching dashboard summary',
            });
        }
    }
    /**
   * Look up the account holder's name/details by account number, so the
   * admin can confirm who they're crediting before submitting the amount.
   * @route GET /api/admin/wallet/lookup/:accountNumber
   * @access Private (Admin only)
   */
    async lookupWalletByAccountNumber(req, res) {
        try {
            const accountNumber = Array.isArray(req.params.accountNumber)
                ? req.params.accountNumber[0]
                : req.params.accountNumber;
            if (!accountNumber) {
                res.status(400).json({ success: false, message: 'Account number is required' });
                return;
            }
            const wallet = await Wallet_1.default.findOne({ accountNumber });
            if (!wallet) {
                res.status(404).json({ success: false, message: 'No wallet found for that account number' });
                return;
            }
            const user = await User_1.default.findById(wallet.userId).select('firstName lastName username email');
            if (!user) {
                res.status(404).json({ success: false, message: 'Account holder not found' });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    accountNumber: wallet.accountNumber,
                    balance: wallet.balance,
                    currency: wallet.currency,
                    status: wallet.status,
                    user: {
                        userId: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        fullName: `${user.firstName} ${user.lastName}`,
                        username: user.username,
                        email: user.email,
                    },
                },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error looking up wallet by account number:', error);
            res.status(500).json({ success: false, message: err.message || 'Error looking up wallet' });
        }
    }
    /**
   * Send a custom, free-form support-style email to a specific user.
   * @route POST /api/admin/user/:userId/send-email
   * @access Private (Admin only)
   * @body subject: string, message: string
   */
    async sendCustomEmailToUser(req, res) {
        try {
            const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
            const { subject, message } = req.body;
            const adminId = req.userId;
            if (!userId) {
                res.status(400).json({ success: false, message: 'User ID is required' });
                return;
            }
            if (!subject || typeof subject !== 'string' || !subject.trim()) {
                res.status(400).json({ success: false, message: 'Subject is required' });
                return;
            }
            if (!message || typeof message !== 'string' || !message.trim()) {
                res.status(400).json({ success: false, message: 'Message is required' });
                return;
            }
            const user = await User_1.default.findById(userId).select('firstName lastName email');
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            if (!user.email) {
                res.status(400).json({ success: false, message: 'This user has no email address on file' });
                return;
            }
            // Short reference ticket number for the email footer — not stored, just cosmetic.
            const ticketId = Math.floor(10000000 + Math.random() * 90000000).toString();
            const html = emailService_1.default.generateAdminCustomEmailHtml(user.firstName || 'Valued User', subject.trim(), message.trim(), ticketId);
            await emailService_1.default.sendEmail({
                to: user.email,
                subject: subject.trim(),
                html,
            });
            try {
                await AdminAuditLog_1.default.create({
                    adminId,
                    actionType: 'send_custom_email',
                    targetUserId: userId,
                    details: {
                        subject: subject.trim(),
                        ticketId,
                    },
                    timestamp: new Date(),
                });
            }
            catch (auditError) {
                console.error('[ADMIN] Error creating custom email audit log:', auditError);
            }
            res.status(200).json({
                success: true,
                message: 'Email sent successfully',
                data: { userId, email: user.email, subject: subject.trim(), ticketId },
            });
        }
        catch (error) {
            const err = error;
            console.error('[ADMIN] Error sending custom email:', error);
            res.status(500).json({ success: false, message: err.message || 'Error sending email' });
        }
    }
}
exports.AdminController = AdminController;
exports.default = new AdminController();
