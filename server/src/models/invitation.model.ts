import mongoose, { Schema, Types } from "mongoose";

interface IInvitation {
    project: Types.ObjectId;
    inviter: Types.ObjectId;
    recipient: Types.ObjectId;
    role: 'admin' | 'editor' | 'viewer';
    status: 'pending' | 'accepted' | 'rejected';
    expiresAt: Date
}

const invitationSchema = new Schema<IInvitation>({
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    inviter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'editor',  'viewer'],
        default: 'viewer'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
}, {timestamps: true})

//prevent duplicate invitations(i.e invite recipient only one time for same project)
invitationSchema.index({project: 1, recipient: 1}, {unique: true})

//Auto-delete invitaions document after expiresAt date
invitationSchema.index({expiresAt: 1}, {expireAfterSeconds: 0})

export const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema)