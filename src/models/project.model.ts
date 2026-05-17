import mongoose, { Document, Schema, Types } from 'mongoose';

interface IMember {
    user: Types.ObjectId;
    role: 'admin' | 'editor' | 'viewer';
}

export interface IProject extends Document{
    title: string;
    description: string;
    owner: Types.ObjectId;
    members: IMember[];
    status: 'planning' | 'active' | 'completed';
}

const projectSchema = new Schema<IProject>({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: [
        {
       user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
       },
       role: {
        type: String,
        enum: ['admin', 'editor', 'viewer'],
        default: 'viewer'
       }
    }
],
    status: {
        type: String,
        enum: ['planning', 'active', 'completed'],
        default: 'planning',
        required: true
    }
}, {timestamps: true})

projectSchema.index({owner: 1})
projectSchema.index({"members.user": 1})

export const Project = mongoose.model<IProject>('Project', projectSchema)