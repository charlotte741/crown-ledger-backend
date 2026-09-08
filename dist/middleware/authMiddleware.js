"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const tokenService_1 = __importDefault(require("../services/tokenService"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = async (req, res, next) => {
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
    const decodedWithoutVerify = jsonwebtoken_1.default.decode(token);
    console.log("Decoded Before Verify:", decodedWithoutVerify);
    try {
        const decoded = tokenService_1.default.verifyAccessToken(token);
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
    }
    catch (error) {
        console.error(error);
        res.status(403).json({
            success: false,
            message: "Invalid access token",
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (token) {
        try {
            const decoded = tokenService_1.default.verifyAccessToken(token);
            if (decoded) {
                req.userId = decoded.userId;
                req.email = decoded.email;
            }
        }
        catch (error) {
            // Ignore invalid tokens for optional auth
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
const authMiddleware = {
    verifyToken: exports.authenticateToken,
    optional: exports.optionalAuth,
};
exports.default = authMiddleware;
