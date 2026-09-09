"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inboxController_1 = __importDefault(require("../controllers/inboxController"));
const router = (0, express_1.Router)();
// Raw body is required here — Resend's Svix signature is computed over the
// exact bytes it sent, and JSON-parsing/re-stringifying breaks verification.
router.post('/resend/inbound', (0, express_1.raw)({ type: '*/*' }), inboxController_1.default.handleInboundWebhook);
exports.default = router;
