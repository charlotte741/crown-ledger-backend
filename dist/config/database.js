"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in enviroment variables');
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('[DB] MongoDB connected successfully');
    }
    catch (error) {
        console.error('[DB] MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('[DB] mongoDB disconnection error:', error);
    }
};
exports.disconnectDB = disconnectDB;
