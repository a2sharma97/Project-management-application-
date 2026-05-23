import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?:string;
    project: Types.ObjectId;
    createdBy: Types.ObjectId;
    assignedTo?: Types.ObjectId;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline: Date
}

const taskSchema = new Schema<ITask>({
    title: {
        type: String,
        required: true,
        trim: true,        
    },
    description: {
        type: String,
        trim: true
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['todo' , 'in-progress' , 'review' , 'done'],
        default: 'todo',
        required: true
    },
    priority: {
        type: String,
        enum: ['low' , 'medium' , 'high' , 'critical'],
        default: 'low',
        required: true
    },
    deadline: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        required: [true, "A deadline is required for project tracking"]
    }
}, {timestamps: true})


//index is connected to find method of mongodb. whatever we want to find in db in speed we write it in index eg: Task.findById({project: projectId}) 
//fetching all task of a project
taskSchema.index({project: 1})

//filtering task by assignee within a project 
taskSchema.index({project: 1, assignedTo: 1})

//filtering task by status within a project
taskSchema.index({project: 1, status: 1})


export const Task = mongoose.model<ITask>("Task", taskSchema)