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
const userSchema = new mongoose_1.Schema({
    // Personal Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
    },
    middleName: {
        type: String,
        trim: true,
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'],
    },
    // Contact
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^\+?[\d\s\-()]{10,}$/, 'Please provide a valid phone number'],
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
    },
    // Account
    currency: {
        type: String,
        required: [true, 'Currency is required'],
        default: 'USD',
    },
    accountType: {
        type: String,
        enum: ['savings', 'current', 'fixed_deposit', 'business', 'investment'],
        required: [true, 'Account type is required'],
    },
    // Security
    pin: {
        type: String,
        required: [true, 'PIN is required'],
        minlength: [60, 'Invalid PIN format'], // hashed length
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false, // Don't return password by default
    },
    refreshTokens: {
        type: [String],
        default: [],
    },
    // Email Verification
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: {
        type: String,
        select: false,
    },
    emailVerificationTokenExpiry: {
        type: Date,
        select: false,
    },
    // Password Reset
    resetPasswordToken: {
        type: String,
        select: false,
    },
    resetPasswordTokenExpiry: {
        type: Date,
        select: false,
    },
    // Profile Settings
    dateOfBirth: {
        type: Date,
    },
    profilePhoto: {
        type: String,
    },
    // Investments
    investments: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'UserInvestment',
        default: [],
    },
    // Admin
    isAdmin: {
        type: Boolean,
        default: false,
    },
    // Metadata
    agreedToTerms: {
        type: Boolean,
        required: [true, 'You must agree to terms and services'],
        default: false,
    },
    lastLogin: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Index for faster queries
// Note: email and username already have indexes via unique: true
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });
exports.default = mongoose_1.default.model('User', userSchema);
