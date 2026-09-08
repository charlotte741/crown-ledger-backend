"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeWebhookController = void 0;
const stripeClient_1 = __importDefault(require("../utils/stripeClient"));
const Payment_1 = __importDefault(require("../models/Payment"));
const UserInvestment_1 = __importDefault(require("../models/UserInvestment"));
class StripeWebhookController {
    /**
     * Handle Stripe webhook events
     */
    async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET is not set');
            res.status(400).json({ error: 'Webhook secret not configured' });
            return;
        }
        let event;
        try {
            event = stripeClient_1.default.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
        catch (error) {
            const err = error;
            console.error(`Webhook Error: ${err.message}`);
            res.status(400).json({ error: `Webhook Error: ${err.message}` });
            return;
        }
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                case 'charge.refunded':
                    await this.handleChargeRefunded(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
            res.status(200).json({ received: true });
        }
        catch (error) {
            const err = error;
            console.error('Webhook processing error:', err);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }
    /**
     * Handle successful payment
     */
    async handlePaymentSucceeded(paymentIntent) {
        const { id: paymentIntentId, metadata } = paymentIntent;
        // Update payment record
        const payment = await Payment_1.default.findOneAndUpdate({ stripePaymentIntentId: paymentIntentId }, {
            status: 'completed',
            stripePaidAt: new Date(),
        }, { new: true });
        if (payment && metadata) {
            // Update investment if it exists
            if (payment.investmentId) {
                await UserInvestment_1.default.findByIdAndUpdate(payment.investmentId, { status: 'active' });
            }
            console.log(`Payment succeeded for investment: ${payment.investmentId}`);
        }
    }
    /**
     * Handle failed payment
     */
    async handlePaymentFailed(paymentIntent) {
        const { id: paymentIntentId, last_payment_error } = paymentIntent;
        // Update payment record
        await Payment_1.default.findOneAndUpdate({ stripePaymentIntentId: paymentIntentId }, {
            status: 'failed',
            errorMessage: last_payment_error?.message || 'Payment failed',
        });
        console.log(`Payment failed: ${paymentIntentId}`);
    }
    /**
     * Handle charge refunded
     */
    async handleChargeRefunded(charge) {
        const { payment_intent: paymentIntentId } = charge;
        // Update payment record
        const payment = await Payment_1.default.findOneAndUpdate({ stripePaymentIntentId: paymentIntentId }, {
            status: 'cancelled',
        }, { new: true });
        if (payment && payment.investmentId) {
            // Cancel associated investment
            await UserInvestment_1.default.findByIdAndUpdate(payment.investmentId, { status: 'cancelled' });
            console.log(`Refund processed for investment: ${payment.investmentId}`);
        }
    }
}
exports.StripeWebhookController = StripeWebhookController;
exports.default = new StripeWebhookController();
