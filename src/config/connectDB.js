import mongoose from 'mongoose';
import { getMongoUri } from '@/utils/env';

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    if (mongoose.connections[0].readyState) { isConnected = true; return }

    const mongoUri = getMongoUri();
    if (!mongoUri) {
        console.warn('MongoDB_URI not found');
        return;
    }

    try {
        const db = await mongoose.connect(mongoUri);
        isConnected = db.connections[0].readyState === 1;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw new Error('Failed to connect to MongoDB: ' + error.message);
    }
};

export default connectDB;
