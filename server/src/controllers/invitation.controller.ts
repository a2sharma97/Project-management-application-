import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Invitation } from "../models/invitation.model.js";
import { Project } from "../models/project.model.js";
import { User } from "../models/user.model.js";
import { logActivity } from "../utils/logActivity.js";

type InvitationStatus = 'pending' | 'accepted' | 'rejected';
type InvitaionRole = 'admin' | 'editor' | 'viewer';

const sendInvite = async (req: Request, res: Response) => {
    try {
        const {projectId} = req.params as {projectId: string}
        const {email, role} = req.body
        const userId = req.user?._id
        
        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized user"})
        }
        if(!mongoose.Types.ObjectId.isValid(projectId as string)) {
            return res.status(400).json({success: false, message: "Invalid project ID"})
        }

        const isValidRole = ['admin', 'editor',  'viewer']
        if(!isValidRole.includes(role)) {
            return res.status(400).json({success: false, message: "Invalid role"})
        }

        if(!email) {
            return res.status(400).json({success: false, message: "email should not be empty"})
        }

        const project = await Project.findById(projectId)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }


        const isOwner = project.owner.equals(userId)
        const projectMember = project.members.find(m => m.user.equals(userId))
        const isAdmin = projectMember?.role === 'admin'

        if(!isOwner && !isAdmin) {
            return res.status(403).json({success: false, message: "Only owner or admin invites the user"})
        }

        const recipient = await User.findOne({email})
        if(!recipient) {
            return res.status(404).json({success: false, message: "No user found with this email"})
        }

        const isAlreadyAMember = project.members.some(m => m.user.equals(recipient._id))
        if(isAlreadyAMember) {
            return res.status(400).json({success:false, message: "User is already a member of project"})
        }

        let query: any = {
            project: projectId,
            recipient: recipient._id,
            status: 'pending'
        }
        const existingInvitation = await Invitation.findOne(query)
        if(existingInvitation) {
            return res.status(400).json({success: false, message: "Invitation already sent"})
        }

        const invitation = await Invitation.create({
            project: projectId,
            inviter: userId,
            recipient: recipient?._id,
            role: role || 'viewer',
            status:'pending'
        })

        return res.status(201).json({success: true, message: "Invitation send successfully.", data: invitation})


    } catch (error) {
        console.error("SEND_INVITE_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

const respondToInvite = async (req: Request, res: Response) => {
    try {
        const {invitationId} = req.params
        const {action} = req.body 
        const userId = req.user?._id

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }

        if(action !== 'accepted' && action !== 'rejected') {
            return res.status(400).json({success: false, message: "Invalid action"})
        }

        if(!mongoose.Types.ObjectId.isValid(invitationId as string)) {
            return res.status(400).json({success: false, message: "Invalid invitation id"})
        }

        const invitation = await Invitation.findById(invitationId)
        if(!invitation) {
            return res.status(404).json({success: false, message: "Invitation not found"})
        }

        const recipient = invitation?.recipient.equals(userId)
        if(!recipient) {
            return res.status(403).json({success: false, message: "Only the recipient can respond to this invitation"})
        }

        const isInvitationPending = invitation.status !== 'pending' 
        
        if(isInvitationPending) {
            return res.status(400).json({success: false, message: "Invitation already responded to."})
        }

        const project = await Project.findById(invitation?.project)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }

        if(action === 'accepted') {
            const alreadyIn = project.members.find(m => m.user.equals(userId)) //check becoz what if owner add user manually

            if(!alreadyIn) {
                await Project.findByIdAndUpdate(project._id,{
                    $addToSet: {members: {user: userId, role: invitation.role}} //addToSet works like push but it guarantees no duplicates.If the user is already there, it simply does nothing.
                })
                await logActivity(userId, project._id, 'MEMBER_JOINED', 'Joined the project via Invitation', invitation._id)
            }
        } else {
            await logActivity(userId, project._id, 'INVITE_REJECTED', 'Invite rejected by user', invitation._id)
        }

        invitation.status = action
        await invitation?.save()
       

        return res.status(200).json({success: true, message: "Respond to invitation successfully"})

    } catch (error) {
        console.error("RESPOND_TO_INVITE_ERROR",error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

const getMyInvitations = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id
        const {status} = req.query

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }

        const query: {recipient: typeof userId; status?: InvitationStatus} = {
            recipient: userId,
        }

        const validStatuses: InvitationStatus[] = ['pending', 'accepted', 'rejected']
        if(status && validStatuses.includes(status as InvitationStatus)) {
            query.status = status as InvitationStatus
        }

        const invitations = await Invitation.find(query)
        .populate('project', 'title')
        .populate('inviter', 'fullName email')
        .sort({createdAt: -1})

       return res.status(200).json({success: true, message: invitations.length > 0 ? "Invitations fetched successfully" : "No invitations" , data: invitations})
        
    } catch (error) {
        console.error("GET_MY_INVITATIONS_ERROR",error)
        return res.status(500).json({success: false, message: "Internal Server Error" })
    }
}

const cancelInvite = async (req: Request, res: Response) => {
    try {
        const {invitationId} = req.params
        const userId = req.user?._id
        
        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }

        if(!mongoose.Types.ObjectId.isValid(invitationId as string)) {
            return res.status(400).json({success: false, message: "Invalid invitation ID"})
        }
        const invitation = await Invitation.findById(invitationId)
        if(!invitation) {
            return res.status(404).json({success: false, message: "Invitation not found"})
        }
        const inviter = invitation?.inviter.equals(userId)
        const project = await Project.findById(invitation.project)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }

        const isOwner = project.owner.equals(userId)
        const projectMember = project.members.find(m => m.user.equals(userId))
        const isAdmin = projectMember?.role === 'admin'

        if(!inviter && !isOwner && !isAdmin) {
            return res.status(403).json({success: false, message: "Only inviter, owner or admin can cancel this invitation."})
        }

        const isPending = invitation?.status === 'pending'
        if(!isPending) {
            return res.status(400).json({success: false, message: "Only pending invitations can be cancelled."})
        }

        await Invitation.findByIdAndDelete(invitationId)
       
        return res.status(200).json({success: true, message: "Invitation cancelled successfully."})

    } catch (error) {
        console.error("CANCEL_INVITE_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

const getProjectInvitations = async (req: Request, res: Response) => {
    try {
        const {projectId} = req.params as {projectId: string}
        const userId = req.user?._id
        const {status} = req.query

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }

        if(!mongoose.Types.ObjectId.isValid(projectId as string)) {
            return res.status(400).json({success: false, message: "Invalid project ID"})
        }

        const project = await Project.findById(projectId) 
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }

        const isOwner = project.owner.equals(userId)
        const projectMember = project.members.find(m => m.user.equals(userId))
        const isAdmin = projectMember?.role === 'admin'
        if(!isOwner && !isAdmin) {
            return res.status(403).json({success: false, message: "Only owner and admin can fetch the invitations."})
        }

        const query: {project: string; status?: InvitationStatus} = {
            project: projectId
        }

        const validStatuses: InvitationStatus[] = ['pending', 'accepted', 'rejected']
        if(status && validStatuses.includes(status as InvitationStatus)) {
            query.status = status as InvitationStatus
        }

        const invitation = await Invitation.find(query )
        .populate('inviter', 'fullName email')
        .populate('recipient', 'fullName email')
        .sort({createdAt: -1})

       return res.status(200).json({success: true, 
        message: invitation.length === 0 ? "No invitation for this project": "Invitations fetched successfully", data: invitation})

    } catch (error) {
        console.error("GET_PROJECT_INVITATIONS_ERROR", error);
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}


export { cancelInvite, getMyInvitations, getProjectInvitations, respondToInvite, sendInvite };

