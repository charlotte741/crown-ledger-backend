"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../config/database");
const User_1 = __importDefault(require("../models/User"));
const ADMIN_EMAIL = "ifeanyivitus339@gmail.com"; // <-- Replace with your email
const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.connectDB)();
        // Update user
        const user = await User_1.default.findOneAndUpdate({ email: ADMIN_EMAIL }, {
            $set: {
                isAdmin: true,
            },
        }, {
            new: true,
        });
        if (!user) {
            console.log(`❌ User with email "${ADMIN_EMAIL}" not found.`);
            process.exit(1);
        }
        console.log("✅ Admin privileges granted successfully!");
        console.log({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
        });
        await mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Failed to seed admin:", error);
        process.exit(1);
    }
};
seedAdmin();
