import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

interface User {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  agreedToTerms: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserDocument extends User, mongoose.Document {}

const userSchema = new mongoose.Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    firstName: {
      type: String,
      default: 'Admin',
    },
    lastName: {
      type: String,
      default: 'User',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    agreedToTerms: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUserDocument>('User', userSchema);

async function createAdminUser() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    const adminEmail = 'codessavy@gmail.com';
    const adminPassword = 'adminpassword';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.isAdmin) {
        console.log(`✓ Admin user already exists: ${adminEmail}`);
      } else {
        console.log(`User with email ${adminEmail} exists but is not an admin. Updating...`);
        existingAdmin.isAdmin = true;
        existingAdmin.agreedToTerms = true;
        await existingAdmin.save();
        console.log(`✓ Updated ${adminEmail} to admin`);
      }
    } else {
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      // Create admin user
      const adminUser = new User({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
        agreedToTerms: true,
      });

      await adminUser.save();
      console.log(`✓ Admin user created successfully`);
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
      console.log(`  Role: Admin`);
    }

    console.log('\n✓ Admin user setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
createAdminUser();
