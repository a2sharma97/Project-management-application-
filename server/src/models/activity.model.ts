import mongoose, { Schema, Types } from "mongoose";

interface IActivity {
    actor: Types.ObjectId;
    project: Types.ObjectId;
    action: string;
    entityId?: Types.ObjectId;
    details: string
}

const activitySchema = new Schema<IActivity>({
    actor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    action: {
        type: String,
        enum: [
            'TASK_CREATED', 
            'TASK_DELETED',
            'TASK_UPDATED' ,
            'STATUS_UPDATED', 
            'MEMBER_JOINED', 
            'MEMBER_ROLE_UPDATED',
            'INVITE_REJECTED',
            'MEMBER_LEFT',
            'MEMBER_REMOVED',
            'INVITE_SENT',
            'PROJECT_CREATED',
            'PROJECT_STATUS_UPDATED'
        ],
        required: true        
    },
    entityId: {
        type: Schema.Types.ObjectId,
        ref: "Task",
        required: false
       
    },
    details: {
        type: String,
        trim: true,
        required: true
       
    }
}, {timestamps: true})

activitySchema.index({project: 1, createdAt: -1})

export const Activity = mongoose.model<IActivity>('Activity', activitySchema)