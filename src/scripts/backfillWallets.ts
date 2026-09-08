import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Wallet from '../models/Wallet';
import walletService from '../services/walletService';

dotenv.config();

async function backfillWallets() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set.');
    }

    await mongoose.connect(mongoUri);
    console.log('[BACKFILL] Connected to MongoDB');

    // Find every user, then filter out ones that already have a wallet
    const users = await User.find({}).select('_id firstName lastName email currency');
    console.log(`[BACKFILL] Found ${users.length} total users`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      const existingWallet = await Wallet.findOne({ userId: user._id });

      if (existingWallet) {
        skipped++;
        continue;
      }

      try {
        const wallet = await walletService.createWalletForUser(
          user._id.toString(),
          user.currency || '$'
        );
        console.log(
          `[BACKFILL] Created wallet ${wallet.accountNumber} for ${user.email} (${user._id})`
        );
        created++;
      } catch (err) {
        console.error(`[BACKFILL] Failed to create wallet for ${user.email} (${user._id}):`, err);
        failed++;
      }
    }

    console.log('\n[BACKFILL] Done.');
    console.log(`  Created: ${created}`);
    console.log(`  Already had a wallet (skipped): ${skipped}`);
    console.log(`  Failed: ${failed}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[BACKFILL] Fatal error:', error);
    process.exit(1);
  }
}

backfillWallets();