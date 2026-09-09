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
const InboxAttachmentSchema = new mongoose_1.Schema({
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number },
    resendAttachmentId: { type: String },
}, { _id: false });
const InboxMessageSchema = new mongoose_1.Schema({
    threadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'InboxThread', required: true, index: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    // sparse+unique so retried webhook deliveries (Resend sends at-least-once)
    // can be deduped by Resend's own email id, without colliding across
    // inbound/outbound docs that don't set it.
    resendEmailId: { type: String, index: true, sparse: true, unique: true },
    messageId: { type: String },
    fromEmail: { type: String, required: true },
    fromName: { type: String },
    toEmail: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String },
    html: { type: String },
    attachments: { type: [InboxAttachmentSchema], default: [] },
    sentByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    read: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });
InboxMessageSchema.index({ threadId: 1, createdAt: 1 });
exports.default = mongoose_1.default.model('InboxMessage', InboxMessageSchema);
