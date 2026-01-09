/* Vercel serverless entrypoint */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../app';

let mongoPromise: Promise<typeof import('mongoose')> | null = null;
import mongoose from 'mongoose';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (mongoose.connection.readyState === 0) {
        if (!mongoPromise) {
            mongoPromise = mongoose.connect(process.env.MONGODB_URI as string);
        }
        await mongoPromise;
    }
    // Express app signature matches
    // @ts-ignore
    return app(req, res);
}