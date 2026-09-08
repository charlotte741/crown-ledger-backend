import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

/**
 * Middleware to check if the authenticated user has admin role
 */
export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Find user and check if admin
    const user = await User.findById(userId).select('isAdmin');

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
  } catch (error) {
    const err = error as Error;
    console.error('[AUTH] Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: err.message || 'Error verifying admin privileges',
    });
  }
};
