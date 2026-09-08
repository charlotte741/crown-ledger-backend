import jwt from "jsonwebtoken";
import crypto from "crypto";

interface TokenPayload {
    userId: string;
    email: string;
}

class TokenService {
    // Use dedicated secrets
    private jwtSecret: string =
        process.env.JWT_ACCESS_SECRET || "your-super-secret-access-key";

    private refreshSecret: string =
        process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key";

    constructor() {
        // console.log("========== TOKEN SERVICE ==========");
        // console.log("JWT_SECRET:", process.env.JWT_SECRET);
        // console.log("JWT_ACCESS_SECRET:", process.env.JWT_ACCESS_SECRET);
        // console.log("JWT_REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET);
        // console.log("Access Secret Used:", this.jwtSecret);
        // console.log("Refresh Secret Used:", this.refreshSecret);
        // console.log("===================================");

        if (!process.env.JWT_ACCESS_SECRET) {
            console.warn(
                "[TOKEN] ⚠️ WARNING: JWT_ACCESS_SECRET not found in environment variables."
            );
        }

        if (!process.env.JWT_REFRESH_SECRET) {
            console.warn(
                "[TOKEN] ⚠️ WARNING: JWT_REFRESH_SECRET not found in environment variables."
            );
        }
    }

    generateAccessToken(payload: TokenPayload): string {
        const token = jwt.sign(payload, this.jwtSecret, {
            expiresIn: "7d",
        });

        // console.log("[TOKEN] Access token generated.");
        return token;
    }

    generateRefreshToken(payload: TokenPayload): string {
        const token = jwt.sign(payload, this.refreshSecret, {
            expiresIn: "30d",
        });

        // console.log("[TOKEN] Refresh token generated.");
        return token;
    }

    verifyAccessToken(token: string): TokenPayload | null {
        try {
            // console.log("[TOKEN] Verifying access token...");
            // console.log("[TOKEN] Secret Used:", this.jwtSecret);

            // Decode first (without verifying) for debugging
            const decoded = jwt.decode(token);
            // console.log("[TOKEN] Decoded Payload:", decoded);

            const verified = jwt.verify(
                token,
                this.jwtSecret
            ) as TokenPayload;

            // console.log("[TOKEN] Access token verified successfully.");

            return verified;
        } catch (error: any) {
            console.error("[TOKEN] Access token verification failed.");
            console.error("[TOKEN] Error Name:", error.name);
            console.error("[TOKEN] Error Message:", error.message);
            console.error("[TOKEN] Token:", token);
            console.error("[TOKEN] Secret Used:", this.jwtSecret);

            return null;
        }
    }

    verifyRefreshToken(token: string): TokenPayload | null {
        try {
            // console.log("[TOKEN] Verifying refresh token...");
            // console.log("[TOKEN] Secret Used:", this.refreshSecret);

            const decoded = jwt.decode(token);
            // console.log("[TOKEN] Decoded Payload:", decoded);

            const verified = jwt.verify(
                token,
                this.refreshSecret
            ) as TokenPayload;

            // console.log("[TOKEN] Refresh token verified successfully.");

            return verified;
        } catch (error: any) {
            console.error("[TOKEN] Refresh token verification failed.");
            console.error("[TOKEN] Error Name:", error.name);
            console.error("[TOKEN] Error Message:", error.message);
            console.error("[TOKEN] Token:", token);
            console.error("[TOKEN] Secret Used:", this.refreshSecret);

            return null;
        }
    }

    generateVerificationToken(): string {
        return crypto.randomBytes(32).toString("hex");
    }

    generateResetToken(): string {
        return crypto.randomBytes(32).toString("hex");
    }

    getTokenExpiry(expiryHours: number = 24): Date {
        return new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    }
}

export default new TokenService();
