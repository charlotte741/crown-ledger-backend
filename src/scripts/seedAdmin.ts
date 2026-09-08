import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/database";
import User from "../models/User";

const ADMIN_EMAIL = "ifeanyivitus339@gmail.com"; // <-- Replace with your email

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Update user
    const user = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $set: {
          isAdmin: true,
        },
      },
      {
        new: true,
      }
    );

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

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed admin:", error);
    process.exit(1);
  }
};

seedAdmin();