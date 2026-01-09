/**
 * Project Model - Stores generated website projects in MongoDB
 */

import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for individual file
export interface IProjectFile {
    path: string;
    content: string;
}

// Interface for the Project
export interface IProject {
    userId?: string;  // Optional for anonymous users
    sessionId?: string; // For anonymous session-based tracking
    name: string;
    prompt: string;
    files: IProjectFile[];
    blueprint?: object;
    status: 'generating' | 'complete' | 'error';
    fileCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IProjectDocument extends IProject, Document { }

const projectFileSchema = new Schema({
    path: { type: String, required: true },
    content: { type: String, required: true },
}, { _id: false });

const projectSchema = new Schema<IProjectDocument>({
    userId: { type: String, index: true },
    sessionId: { type: String, index: true },
    name: { type: String, required: true },
    prompt: { type: String, required: true },
    files: [projectFileSchema],
    blueprint: { type: Schema.Types.Mixed },
    status: {
        type: String,
        enum: ['generating', 'complete', 'error'],
        default: 'generating'
    },
    fileCount: { type: Number, default: 0 },
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
});

// Index for faster queries
projectSchema.index({ createdAt: -1 });
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ sessionId: 1, createdAt: -1 });

const Project: Model<IProjectDocument> = mongoose.model<IProjectDocument>('Project', projectSchema);
export default Project;
