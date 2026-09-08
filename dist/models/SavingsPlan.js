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
const SavingsPlanSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    planName: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: [
            'business',
            'personal',
            'rent',
            'school_fees',
            'birthday',
            'emergency',
            'gadget',
            'eid',
            'real_estate',
            'summer_holiday',
            'travel',
            'automobile',
            'christmas',
            'detty_december',
            'new_year',
            'other',
        ],
        required: false, // ✅ Make optional
        default: null,
    },
    targetAmount: {
        type: Number,
        required: false, // ✅ Make optional
        default: 0,
        min: 0,
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    earnInterest: {
        type: Boolean,
        default: true,
    },
    interestRate: {
        type: Number,
        default: 12, // 12% APY
    },
    duration: {
        type: Number,
        enum: [3, 6, 9, 12],
        required: false,
        default: null
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: false,
        default: null
    },
    startDate: {
        type: Date,
        default: () => new Date(),
    },
    endDate: {
        type: Date,
        required: false,
        default: null
    },
    nextDepositDueDate: {
        type: Date,
        required: false,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'paused', 'completed', 'cancelled'], // ✅ Add 'pending' to enum
        default: 'pending',
    },
    totalInterestEarned: {
        type: Number,
        default: 0,
        min: 0,
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    expectedInterest: {
        type: Number,
        default: 0,
        min: 0,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    transactions: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: 'SavingsTransaction',
        default: [],
    },
}, { timestamps: true });
// Index for finding user's plans
SavingsPlanSchema.index({ userId: 1, status: 1 });
const SavingsPlan = mongoose_1.default.model('SavingsPlan', SavingsPlanSchema);
exports.default = SavingsPlan;
