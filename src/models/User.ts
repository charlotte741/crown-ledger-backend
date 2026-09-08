import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  // Personal Information
  firstName: string;
  lastName: string;
  middleName?: string;
  username: string;

  // Contact
  email: string;
  phoneNumber: string;
  country: string;

  // Account
  currency: string;
  accountType: 'savings' | 'current' | 'fixed_deposit' | 'business' | 'investment';

  // Security
  pin: string; // hashed 4-digit PIN
  password: string; // hashed password
  refreshTokens: string[]; // Store refresh tokens for 30-day remember-me

  // Status
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;

  // Password Reset
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;

  // Profile Settings
  dateOfBirth?: Date;
  profilePhoto?: string;

  // Investments
  investments?: mongoose.Types.ObjectId[]; // References to UserInvestment documents

  // Admin
  isAdmin?: boolean;

  // Metadata
  agreedToTerms: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const userSchema = new Schema<IUser>(
  {
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
      type: [Schema.Types.ObjectId],
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
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
// Note: email and username already have indexes via unique: true
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

export default mongoose.model<IUser>('User', userSchema);
