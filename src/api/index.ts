import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import app from '../app';

// Cache the database connection for serverless reuse
let cachedDb: typeof mongoose | null = null;

async function connectToDatabase(): Promise<typeof mongoose> {
    if (cachedDb && cachedDb.connection.readyState === 1) {
        return cachedDb;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined');
    }

    // Connect with serverless-optimized settings
    cachedDb = await mongoose.connect(mongoUri, {
        bufferCommands: false,
        maxPoolSize: 10,
    });

    console.log('MongoDB connected for Vercel serverless');
    return cachedDb;
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Ensure database is connected before handling request
    try {
        await connectToDatabase();
    } catch (error: any) {
        console.error('MongoDB connection failed:', error.message);
        return res.status(500).json({ error: 'Database connection failed' });
    }

    // Let Express handle the request
    return app(req as any, res as any);
}
