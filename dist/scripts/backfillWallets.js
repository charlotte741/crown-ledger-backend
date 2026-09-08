"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const walletService_1 = __importDefault(require("../services/walletService"));
dotenv_1.default.config();
async function backfillWallets() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set.');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('[BACKFILL] Connected to MongoDB');
        // Find every user, then filter out ones that already have a wallet
        const users = await User_1.default.find({}).select('_id firstName lastName email currency');
        console.log(`[BACKFILL] Found ${users.length} total users`);
        let created = 0;
        let skipped = 0;
        let failed = 0;
        for (const user of users) {
            const existingWallet = await Wallet_1.default.findOne({ userId: user._id });
            if (existingWallet) {
                skipped++;
                continue;
            }
            try {
                const wallet = await walletService_1.default.createWalletForUser(user._id.toString(), user.currency || '$');
                console.log(`[BACKFILL] Created wallet ${wallet.accountNumber} for ${user.email} (${user._id})`);
                created++;
            }
            catch (err) {
                console.error(`[BACKFILL] Failed to create wallet for ${user.email} (${user._id}):`, err);
                failed++;
            }
        }
        console.log('\n[BACKFILL] Done.');
        console.log(`  Created: ${created}`);
        console.log(`  Already had a wallet (skipped): ${skipped}`);
        console.log(`  Failed: ${failed}`);
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('[BACKFILL] Fatal error:', error);
        process.exit(1);
    }
}
backfillWallets();
