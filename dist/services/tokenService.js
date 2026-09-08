"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
class TokenService {
    constructor() {
        // console.log("========== TOKEN SERVICE ==========");
        // console.log("JWT_SECRET:", process.env.JWT_SECRET);
        // console.log("JWT_ACCESS_SECRET:", process.env.JWT_ACCESS_SECRET);
        // console.log("JWT_REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET);
        // console.log("Access Secret Used:", this.jwtSecret);
        // console.log("Refresh Secret Used:", this.refreshSecret);
        // console.log("===================================");
        // Use dedicated secrets
        this.jwtSecret = process.env.JWT_ACCESS_SECRET || "your-super-secret-access-key";
        this.refreshSecret = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key";
        if (!process.env.JWT_ACCESS_SECRET) {
            console.warn("[TOKEN] ⚠️ WARNING: JWT_ACCESS_SECRET not found in environment variables.");
        }
        if (!process.env.JWT_REFRESH_SECRET) {
            console.warn("[TOKEN] ⚠️ WARNING: JWT_REFRESH_SECRET not found in environment variables.");
        }
    }
    generateAccessToken(payload) {
        const token = jsonwebtoken_1.default.sign(payload, this.jwtSecret, {
            expiresIn: "7d",
        });
        // console.log("[TOKEN] Access token generated.");
        return token;
    }
    generateRefreshToken(payload) {
        const token = jsonwebtoken_1.default.sign(payload, this.refreshSecret, {
            expiresIn: "30d",
        });
        // console.log("[TOKEN] Refresh token generated.");
        return token;
    }
    verifyAccessToken(token) {
        try {
            // console.log("[TOKEN] Verifying access token...");
            // console.log("[TOKEN] Secret Used:", this.jwtSecret);
            // Decode first (without verifying) for debugging
            const decoded = jsonwebtoken_1.default.decode(token);
            // console.log("[TOKEN] Decoded Payload:", decoded);
            const verified = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            // console.log("[TOKEN] Access token verified successfully.");
            return verified;
        }
        catch (error) {
            console.error("[TOKEN] Access token verification failed.");
            console.error("[TOKEN] Error Name:", error.name);
            console.error("[TOKEN] Error Message:", error.message);
            console.error("[TOKEN] Token:", token);
            console.error("[TOKEN] Secret Used:", this.jwtSecret);
            return null;
        }
    }
    verifyRefreshToken(token) {
        try {
            // console.log("[TOKEN] Verifying refresh token...");
            // console.log("[TOKEN] Secret Used:", this.refreshSecret);
            const decoded = jsonwebtoken_1.default.decode(token);
            // console.log("[TOKEN] Decoded Payload:", decoded);
            const verified = jsonwebtoken_1.default.verify(token, this.refreshSecret);
            // console.log("[TOKEN] Refresh token verified successfully.");
            return verified;
        }
        catch (error) {
            console.error("[TOKEN] Refresh token verification failed.");
            console.error("[TOKEN] Error Name:", error.name);
            console.error("[TOKEN] Error Message:", error.message);
            console.error("[TOKEN] Token:", token);
            console.error("[TOKEN] Secret Used:", this.refreshSecret);
            return null;
        }
    }
    generateVerificationToken() {
        return crypto_1.default.randomBytes(32).toString("hex");
    }
    generateResetToken() {
        return crypto_1.default.randomBytes(32).toString("hex");
    }
    getTokenExpiry(expiryHours = 24) {
        return new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    }
}
exports.default = new TokenService();
