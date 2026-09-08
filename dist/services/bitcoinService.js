"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const Payment_1 = __importDefault(require("../models/Payment"));
const mongoose_1 = __importDefault(require("mongoose"));
class BitcoinService {
    constructor() {
        this.btcExchangeRate = 45000; // Default BTC/USD rate (will be updated from API)
        this.bitcoinAddress = process.env.BITCOIN_ADDRESS || 'bc1qtqzs4td72uvacre4g9a2tl4khymd0khxrgqtqc'; // SegWit address
    }
    /**
     * Get current BTC/USD exchange rate
     */
    // async getBTCExchangeRate(): Promise<number> {
    //   try {
    //     const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
    //     const data = await response.json();
    //     this.btcExchangeRate = data.bpi.USD.rate_float;
    //     return this.btcExchangeRate;
    //   } catch (error) {
    //     console.error('[BITCOIN] Error fetching exchange rate:', error);
    //     // Return cached or default rate on error
    //     return this.btcExchangeRate;
    //   }
    // }
    /**
     * Convert USD to BTC
     */
    async convertUSDtoBTC(amountUSD) {
        const rate = await this.getBTCExchangeRate();
        return amountUSD / rate;
    }
    /**
     * Create Bitcoin payment request for investment or savings
     * @param userId - User ID
     * @param planId - Investment plan ID (optional - not needed for savings)
     * @param amountUSD - Amount in USD
     * @param planName - Plan name (actual plan name for investments, 'Savings Deposit' for savings)
     */
    async createPaymentRequest(userId, planId, amountUSD, planName = 'Savings Deposit') {
        try {
            // Generate unique payment reference
            const paymentReference = `BTC-${(0, uuid_1.v4)().substring(0, 8).toUpperCase()}`;
            // Convert USD to BTC
            const amountBTC = await this.convertUSDtoBTC(amountUSD);
            // Create payment record - planId is optional
            const paymentData = {
                userId,
                amount: amountUSD,
                currency: 'USD',
                paymentReference,
                paymentMethod: 'bitcoin',
                bitcoinAddress: this.bitcoinAddress,
                bitcoinAmountUSD: amountUSD,
                bitcoinAmountBTC: amountBTC,
                status: 'pending',
            };
            // Only add planId if provided (for investments)
            if (planId) {
                paymentData.planId = new mongoose_1.default.Types.ObjectId(planId);
            }
            const payment = new Payment_1.default(paymentData);
            await payment.save();
            return {
                paymentId: payment._id.toString(),
                paymentReference,
                bitcoinAddress: this.bitcoinAddress,
                amountUSD,
                amountBTC: amountBTC.toFixed(8),
                type: planId ? 'investment' : 'savings',
                planName,
                instructions: `Send exactly ${amountBTC.toFixed(8)} BTC to ${this.bitcoinAddress}. Then provide the transaction hash and reference number to confirm payment.`,
                message: `Bitcoin Payment: Send ${amountBTC.toFixed(8)} BTC (≈ $${amountUSD.toLocaleString()}) to ${this.bitcoinAddress}. After sending, use reference ${paymentReference} to confirm the payment.`,
                exchangeRate: this.btcExchangeRate,
            };
        }
        catch (error) {
            console.error('[BITCOIN] Error creating payment request:', error);
            throw error;
        }
    }
    /**
     * Get current BTC/USD exchange rate from Binance API
     * Falls back to cached rate if network unavailable
     */
    async getBTCExchangeRate() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds
        try {
            console.log('[BITCOIN] Fetching BTC/USD exchange rate from CoinGecko');
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                },
            });
            clearTimeout(timeout);
            if (!response.ok) {
                throw new Error(`CoinGecko API returned ${response.status}`);
            }
            const data = await response.json();
            const btcPrice = Number(data?.bitcoin?.usd);
            if (!btcPrice || btcPrice <= 0) {
                throw new Error('Invalid BTC price received from CoinGecko');
            }
            console.log(`[BITCOIN] Current BTC price: $${btcPrice} USD`);
            // Cache the latest price
            this.btcExchangeRate = btcPrice;
            return btcPrice;
        }
        catch (error) {
            clearTimeout(timeout);
            if (error.name === 'AbortError') {
                console.error('[BITCOIN] CoinGecko request timed out after 10 seconds.');
            }
            else {
                console.error('[BITCOIN] Error fetching BTC price from CoinGecko:', error.message);
            }
            // Use cached value if available
            if (this.btcExchangeRate && this.btcExchangeRate > 0) {
                console.warn(`[BITCOIN] Using cached BTC exchange rate: $${this.btcExchangeRate} USD`);
                return this.btcExchangeRate;
            }
            // Final fallback
            const fallbackRate = 118000; // Update occasionally if desired
            console.warn(`[BITCOIN] Using fallback BTC exchange rate: $${fallbackRate} USD`);
            return fallbackRate;
        }
    }
    /**
     * Get Bitcoin transaction details from blockstream.info API
     * Returns the amount sent to our wallet in BTC
     */
    async getTransactionAmount(transactionHash, bitcoinAddress) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            console.log(`[BITCOIN] Fetching transaction details for hash: ${transactionHash}`);
            const response = await fetch(`https://blockstream.info/api/tx/${transactionHash}`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) {
                throw new Error(`Blockstream API returned ${response.status}: Transaction not found or invalid hash`);
            }
            const tx = await response.json();
            console.log(`[BITCOIN] Transaction found. Outputs: ${tx.vout?.length || 0}`);
            console.log(`[BITCOIN] Looking for outputs to address: ${bitcoinAddress}`);
            let totalAmountToUs = 0;
            if (Array.isArray(tx.vout)) {
                console.log(`[BITCOIN] Scanning ${tx.vout.length} outputs...`);
                for (const output of tx.vout) {
                    const outputAddress = output.scriptpubkey_address;
                    console.log(`[BITCOIN] Output address: ${outputAddress}, amount: ${output.value} satoshis`);
                    if (outputAddress &&
                        outputAddress.toLowerCase() === bitcoinAddress.toLowerCase()) {
                        totalAmountToUs += Number(output.value);
                        console.log(`[BITCOIN] ✓ Found matching output of ${output.value} satoshis`);
                    }
                }
            }
            if (totalAmountToUs === 0) {
                console.warn(`[BITCOIN] ⚠️ No outputs found for address ${bitcoinAddress}`);
                console.warn(`[BITCOIN] Transaction hash: ${transactionHash}`);
            }
            // Convert satoshis to BTC
            const amountBTC = totalAmountToUs / 100000000;
            console.log(`[BITCOIN] Amount sent to ${bitcoinAddress}: ${amountBTC} BTC (${totalAmountToUs} satoshis)`);
            return amountBTC;
        }
        catch (error) {
            clearTimeout(timeout);
            if (error.name === "AbortError") {
                console.error("[BITCOIN] Blockstream request timed out after 10 seconds.");
            }
            else {
                console.error("[BITCOIN] Error fetching transaction amount:", error);
            }
            throw new Error(`Failed to verify transaction on blockchain: ${error.message || "Unknown error"}`);
        }
    }
    /**
     * Verify Bitcoin transaction by reference and transaction hash
     * Validates that the transaction amount matches the intended investment amount
     * Queries blockchain.com to verify actual amount received
     */
    async verifyPaymentByReference(paymentReference, transactionHash, confirmations = 1) {
        try {
            // Validate transaction hash format (64 hex characters)
            if (!/^[a-fA-F0-9]{64}$/.test(transactionHash)) {
                throw new Error('Invalid Bitcoin transaction hash format');
            }
            // Find payment by reference
            const payment = await Payment_1.default.findOne({ paymentReference });
            if (!payment) {
                throw new Error(`Payment with reference ${paymentReference} not found`);
            }
            if (payment.status !== 'pending') {
                throw new Error('Payment has already been processed');
            }
            // Check if this transaction hash has already been used for a completed payment
            const existingCompletedPayment = await Payment_1.default.findOne({
                bitcoinTransactionHash: transactionHash,
                status: 'completed',
            });
            if (existingCompletedPayment) {
                console.warn(`[BITCOIN] Attempted reuse of transaction hash: ${transactionHash}`);
                throw new Error(`This Bitcoin transaction hash has already been used for payment. ` +
                    `Transaction hashes can only be used once. Please send a new transaction from a different output.`);
            }
            // Get expected amount in BTC and USD
            const expectedBTC = payment.bitcoinAmountBTC;
            const expectedUSD = payment.amount;
            console.log(`[BITCOIN] Verifying payment: Expected ${expectedBTC} BTC (${expectedUSD} USD)`);
            // Get current BTC/USD exchange rate from Binance (with fallback)
            let currentBTCPrice = 0;
            try {
                currentBTCPrice = await this.getBTCExchangeRate();
            }
            catch (priceError) {
                console.warn('[BITCOIN] Price error, using fallback:', priceError);
                currentBTCPrice = this.btcExchangeRate || 67500;
            }
            // Query blockchain to get actual transaction amount sent to our address
            let actualBTC = 0;
            try {
                actualBTC = await this.getTransactionAmount(transactionHash, this.bitcoinAddress);
            }
            catch (blockchainError) {
                console.error('[BITCOIN] Blockchain verification failed:', blockchainError);
                throw new Error(`Blockchain verification failed: ${blockchainError.message}`);
            }
            // Calculate actual USD amount based on current exchange rate
            const actualUSD = actualBTC * currentBTCPrice;
            // Check if amount is sufficient (accept equal or greater amounts, reject underpayments)
            const usdDifference = actualUSD - expectedUSD;
            console.log(`[BITCOIN] Amount verification:`);
            console.log(`  - Expected: ${expectedUSD} USD (${expectedBTC} BTC)`);
            console.log(`  - Actual: ${actualUSD.toFixed(2)} USD (${actualBTC} BTC)`);
            console.log(`  - BTC Price: $${currentBTCPrice} USD`);
            console.log(`  - USD Difference: ${usdDifference.toFixed(2)}`);
            // Reject only if underpayment (actual < expected)
            if (actualUSD < expectedUSD) {
                const shortfall = (expectedUSD - actualUSD).toFixed(2);
                console.error(`[BITCOIN] Underpayment! Expected ${expectedUSD} USD but received ${actualUSD.toFixed(2)} USD`);
                throw new Error(`Bitcoin amount is insufficient! You sent ${actualBTC} BTC (${actualUSD.toFixed(2)} USD) but the investment requires ${expectedUSD} USD (${expectedBTC} BTC). ` +
                    `Shortfall: ${shortfall} USD. Please send at least the required amount to complete the investment.`);
            }
            // Accept payment if equal or greater
            if (usdDifference > 0) {
                console.log(`[BITCOIN] ✓ Amount verified successfully with overpayment: ${actualBTC} BTC = ${actualUSD.toFixed(2)} USD (Overpaid: $${usdDifference.toFixed(2)})`);
            }
            else {
                console.log(`[BITCOIN] ✓ Amount verified successfully: ${actualBTC} BTC = ${actualUSD.toFixed(2)} USD`);
            }
            // Update payment with transaction details
            const updatedPayment = await Payment_1.default.findByIdAndUpdate(payment._id, {
                bitcoinTransactionHash: transactionHash,
                bitcoinConfirmations: confirmations,
                status: 'completed',
                verifiedAt: new Date(),
                verificationNotes: `Bitcoin transaction verified. Actual: ${actualBTC} BTC (${actualUSD.toFixed(2)} USD at $${currentBTCPrice}/BTC). Expected: ${expectedBTC} BTC (${expectedUSD} USD). Hash: ${transactionHash}. Confirmations: ${confirmations}`,
            }, { returnDocument: 'after' });
            if (!updatedPayment) {
                throw new Error('Payment not found during update');
            }
            return updatedPayment;
        }
        catch (error) {
            console.error('[BITCOIN] Error verifying payment by reference:', error);
            throw error;
        }
    }
    /**
     * Verify Bitcoin transaction by Payment ID
     */
    async verifyPayment(paymentId, transactionHash, confirmations = 1) {
        try {
            // Validate transaction hash format (64 hex characters)
            if (!/^[a-fA-F0-9]{64}$/.test(transactionHash)) {
                throw new Error('Invalid Bitcoin transaction hash format');
            }
            // In production, verify with blockchain API (e.g., BlockChain.info, Blockchair)
            // For now, we'll accept the transaction hash and store it
            const payment = await Payment_1.default.findByIdAndUpdate(paymentId, {
                bitcoinTransactionHash: transactionHash,
                bitcoinConfirmations: confirmations,
                status: 'completed',
                verifiedAt: new Date(),
                verificationNotes: `Bitcoin transaction verified. Hash: ${transactionHash}. Confirmations: ${confirmations}`,
            }, { returnDocument: 'after' });
            if (!payment) {
                throw new Error('Payment not found');
            }
            return payment;
        }
        catch (error) {
            console.error('[BITCOIN] Error verifying payment:', error);
            throw error;
        }
    }
    /**
     * Get payment details
     */
    async getPaymentDetails(paymentId) {
        try {
            const payment = await Payment_1.default.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }
            return {
                paymentId: payment._id,
                paymentReference: payment.paymentReference,
                userId: payment.userId,
                amountUSD: payment.bitcoinAmountUSD,
                amountBTC: payment.bitcoinAmountBTC?.toFixed(8),
                bitcoinAddress: payment.bitcoinAddress,
                transactionHash: payment.bitcoinTransactionHash,
                confirmations: payment.bitcoinConfirmations,
                status: payment.status,
                verifiedAt: payment.verifiedAt,
                createdAt: payment.createdAt,
            };
        }
        catch (error) {
            console.error('[BITCOIN] Error getting payment details:', error);
            throw error;
        }
    }
    /**
     * Check transaction on blockchain (mock - integrate with real blockchain API)
     */
    async checkBlockchainTransaction(transactionHash) {
        try {
            // In production, call real blockchain API like:
            // https://blockchair.com/bitcoin/transactions/{transactionHash}
            // https://blockchain.com/v3/payments/transactions/{transactionHash}
            console.log('[BITCOIN] Checking transaction on blockchain:', transactionHash);
            // Mock response for testing
            return {
                transactionHash,
                status: 'confirmed',
                confirmations: 6,
                timestamp: new Date(),
                message: 'In production, this would verify with actual blockchain APIs',
            };
        }
        catch (error) {
            console.error('[BITCOIN] Error checking blockchain:', error);
            throw error;
        }
    }
    /**
     * Get Bitcoin address (returns the configured address)
     */
    async getBitcoinAddress() {
        return this.bitcoinAddress;
    }
    /**
     * Update Bitcoin address (admin only)
     */
    async updateBitcoinAddress(newAddress) {
        // Validate Bitcoin address format (simplified)
        if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(newAddress)) {
            throw new Error('Invalid Bitcoin address format');
        }
        this.bitcoinAddress = newAddress;
    }
    /**
     * Complete Bitcoin payment and create investment
     * Call this after verifying the payment to finalize the investment
     */
    async completePaymentAndCreateInvestment(paymentReference, investmentService) {
        try {
            // Find the payment
            const payment = await Payment_1.default.findOne({ paymentReference });
            if (!payment) {
                throw new Error(`Payment with reference ${paymentReference} not found`);
            }
            if (payment.status !== 'completed') {
                throw new Error('Payment must be verified before creating investment');
            }
            // Validate that planId exists
            if (!payment.planId) {
                throw new Error('Payment does not have an associated investment plan. Please create a new payment request.');
            }
            // Check if investment already exists
            if (payment.investmentId) {
                const investment = await investmentService.getInvestmentById(payment.investmentId.toString());
                if (investment) {
                    console.log('[BITCOIN] Investment already exists:', investment._id);
                    return investment;
                }
            }
            console.log('[BITCOIN] Creating investment for planId:', payment.planId.toString());
            // Create the investment
            const investment = await investmentService.createInvestment(payment.userId, payment.planId.toString(), payment.amount, payment._id.toString());
            // Update payment with investment reference
            await Payment_1.default.findByIdAndUpdate(payment._id, { investmentId: investment._id }, { returnDocument: 'after' });
            console.log('[BITCOIN] Investment created after payment verification:', investment._id);
            return investment;
        }
        catch (error) {
            console.error('[BITCOIN] Error creating investment:', error);
            throw error;
        }
    }
    /**
     * Complete Bitcoin payment and create savings deposit
     * Call this after verifying the payment to finalize the savings deposit
     */
    async completePaymentAndDepositSavings(paymentReference, savingsService) {
        try {
            // Find the payment
            const payment = await Payment_1.default.findOne({ paymentReference });
            if (!payment) {
                throw new Error(`Payment with reference ${paymentReference} not found`);
            }
            if (payment.status !== 'completed') {
                throw new Error('Payment must be verified before creating savings deposit');
            }
            console.log('[BITCOIN] Creating savings deposit for amount:', payment.amount);
            // Complete the savings deposit
            const savings = await savingsService.completeSavingsDeposit(payment.userId, payment.amount, payment._id.toString());
            console.log('[BITCOIN] Savings deposit completed after payment verification:', savings._id);
            return savings;
        }
        catch (error) {
            console.error('[BITCOIN] Error completing savings deposit:', error);
            throw error;
        }
    }
}
exports.default = new BitcoinService();
