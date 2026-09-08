"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const paymentSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    planId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'InvestmentPlan',
        required: false,
        default: null,
    },
    investmentId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'UserInvestment',
        default: null,
        required: false,
    },
    savingsPlanId: {
        type: String,
        required: false,
        default: null,
        index: true,
    },
    savingsPlanName: {
        type: String,
        required: false,
        default: null,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
    },
    paymentReference: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cashapp', 'bitcoin'],
        default: 'bitcoin',
    },
    // Cash App fields
    cashAppTransactionId: {
        type: String,
    },
    cashAppTag: {
        type: String,
        default: '$davechar1997',
    },
    // Bitcoin fields
    bitcoinAddress: {
        type: String,
    },
    bitcoinAmountUSD: {
        type: Number,
    },
    bitcoinAmountBTC: {
        type: Number,
    },
    bitcoinTransactionHash: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
        index: true,
    },
    bitcoinConfirmations: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },
    verifiedAt: {
        type: Date,
    },
    verificationNotes: {
        type: String,
    },
    errorMessage: {
        type: String,
    },
}, { timestamps: true });
exports.default = mongoose_1.default.models.Payment ||
    mongoose_1.default.model('Payment', paymentSchema);
