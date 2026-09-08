"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const InvestmentTransactionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['buy', 'sell', 'dividend', 'gain_update'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    valueBefore: {
        type: Number,
        required: true,
    },
    valueAfter: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});
exports.default = InvestmentTransactionSchema;
