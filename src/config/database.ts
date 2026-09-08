import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in enviroment variables')
        }

        await mongoose.connect(mongoUri)
        console.log('[DB] MongoDB connected successfully')
    } catch (error) {
        console.error('[DB] MongoDB connection error:', error);
        process.exit(1)
    }
}

export const disconnectDB = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
    } catch (error) {
        console.error('[DB] mongoDB disconnection error:', error)
    }
}