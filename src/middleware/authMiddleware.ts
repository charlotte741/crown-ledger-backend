import { Request, Response, NextFunction } from 'express';
import tokenService from '../services/tokenService';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {

  console.log("========== AUTH REQUEST ==========");
  console.log("Authorization Header:", req.headers.authorization);
  console.log("All Headers:", req.headers);
  console.log("=================================");

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "Access token is required",
    });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  console.log("Received Token:", token);

  const decodedWithoutVerify = jwt.decode(token);

  console.log("Decoded Before Verify:", decodedWithoutVerify);

  try {
    const decoded = tokenService.verifyAccessToken(token);

    if (decoded) {
      req.userId = decoded.userId;
      req.email = decoded.email;
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "Invalid or expired access token",
    });
  } catch (error) {
    console.error(error);

    res.status(403).json({
      success: false,
      message: "Invalid access token",
    });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    try {
      const decoded = tokenService.verifyAccessToken(token);

      if (decoded) {
        req.userId = decoded.userId;
        req.email = decoded.email;
      }
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
};

const authMiddleware = {
  verifyToken: authenticateToken,
  optional: optionalAuth,
};

export default authMiddleware;
