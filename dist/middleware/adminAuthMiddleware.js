"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = void 0;
const User_1 = __importDefault(require("../models/User"));
/**
 * Middleware to check if the authenticated user has admin role
 */
const adminAuthMiddleware = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }
        // Find user and check if admin
        const user = await User_1.default.findById(userId).select('isAdmin');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        if (!user.isAdmin) {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.',
            });
            return;
        }
        // User is admin, proceed
        next();
    }
    catch (error) {
        const err = error;
        console.error('[AUTH] Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: err.message || 'Error verifying admin privileges',
        });
    }
};
exports.adminAuthMiddleware = adminAuthMiddleware;
