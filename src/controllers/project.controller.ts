import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Invitation } from "../models/invitation.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { logActivity } from "../utils/logActivity.js";

interface createProjectBody {
    title: string;
    description: string;
}

type InvitaionRole = 'admin' | 'editor' | 'viewer';
type ProjectStatus = 'planning' | 'active' | 'completed'

//create project
export const createProject = async(req: Request, res: Response) => {
    try {
        const {title, description} = req.body as createProjectBody
        
        const userId = req.user?._id
        
        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthenticated User"})
        }

        if(!title || !description) {
            return res.status(400).json({success: false, message: "Title and description are required"})
        }
        
        const normalizedTitle = title.toLowerCase().trim()


        const projectExists = await Project.findOne({title: normalizedTitle, owner: userId})
        if(projectExists) {
            return res.status(409).json({success: false, message: "Project already exists"})
        }

        const project = await Project.create({
            title: normalizedTitle,
            description: description.trim(),
            owner: userId,
            members: [
                {
                    user: userId,
                    role: 'admin'
                }
            ]
        })

        await logActivity(userId, project._id, 'PROJECT_CREATED', 'project created')

        return res.status(201).json({success: true, message: "Project created successfully", data: project})

    } catch (error) {
        console.error("CREATE_PROJECT_ERROR:", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

//fetch details of a project of a given user
export const getUserProjects = async(req: Request, res:Response) => {
    try {
        const userId = req.user?._id
        const {status} = req.query

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }

        // Record tells TypeScript — this object has string keys with unknown values. Mongoose accepts it without complaint.
        const query: Record<string, unknown> = {
            $or: [
                {owner: userId},
                {"members.user": userId}
            ]
        }
        
        const validateStatus: ProjectStatus[] = ['planning', 'active', 'completed']
        if(status) {
            if(!validateStatus.includes(status as ProjectStatus)) {
                return res.status(400).json({success: false, message: "Invalid status value"})
            }
            query.status = status as ProjectStatus
        }

        const projects = await Project.find(query)
        .populate("owner", "fullName email")
        .populate("members.user", "fullName email")

        if(projects.length === 0) {
            return res.status(200).json({success: true,
                 message: status? `No ${status} projects found`: "No projects found", data: []})
        }
        return res.status(200).json({success: true, message: "Projects fetched successfully", data: projects})

    } catch (error) {
     console.error("GET_USER_PROJECTS_ERROR", error)
     return res.status(500).json({success: false, message: "Internal Server Error"})   
    }
}

// Get project by ID

export const getProjectById = async (req: Request, res: Response) => {
    try {
        const {projectId} = req.params as {projectId: string}
        const userId = req.user?._id

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

        return res.status(200).json({success: true, message: "Project fetch successfully", data: project})

    } catch (error) {
        console.error("GET_PROJECT_BY_ID_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

//update the status of a project
export const updateProjectStatus = async(req: Request, res: Response) => {
    try {
        const {projectId} = req.params as {projectId: string}
        const {status} = req.body
        const userId = req.user?._id
        
        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized User"})
        }

         if(!mongoose.Types.ObjectId.isValid(projectId as string)) {
            return res.status(400).json({success: false, message: "Invalid project ID"})
        }

        const project = await Project.findById(projectId)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }

        const isOwner = project.owner.equals(userId)

        const memberInfo = project.members.find(m => m.user.equals(userId))
        const isAdmin = memberInfo?.role === 'admin'

        if(!isOwner && !isAdmin) {
            return res.status(403).json({success: false, message:"Permission denied. Only owners and admin can change status"})
        }

        const validateStatus: ProjectStatus[] = ['planning', 'active', 'completed']
        if(!validateStatus.includes(status as ProjectStatus)) {
            return res.status(400).json({success: false, message: "Invalid status value"})
        }
        project.status = status;
        await project.save();
       
        await logActivity(userId, projectId, 'PROJECT_STATUS_UPDATED', `project status updated to ${status}`)


        return res.status(200).json({success: true, message: `Status updated to ${status}`, data: project})

    } catch (error) {
        console.error("UPDATE_STATUS_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

//update the role of a member
export const updateMemberRole = async(req: Request, res: Response) => {
    try {
        const {projectId, memberId} = req.params as {projectId: string; memberId: string};
        const {role} = req.body
        const userId = req.user?._id

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized user"})
        }

        if(!mongoose.Types.ObjectId.isValid(projectId as string) || !mongoose.Types.ObjectId.isValid(memberId as string)) {
            return res.status(400).json({success: false, message: "Invalid Id"})
        }

        const validRoles = ['admin', 'editor', 'viewer']

        if(!validRoles.includes(role)) {
            return res.status(400).json({success: false, message: "Invalid role type"})
        }

        const project = await Project.findById(projectId)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }

        if(!project.owner.equals(userId)) {
            return res.status(403).json({success: false, message: "Only the project owner can promote/demote the members"})
        }

        if(project.owner.equals(memberId)) {
            return res.status(400).json({success: false, message: "Owner role cannot be changed"})
        }

        const memberIndex = project.members.findIndex(m => m.user.equals(memberId))

        if(memberIndex === -1) {
            return res.status(404).json({success: false, message: "User is not a member of this project"})
        }

        const member = project.members[memberIndex]
        if(member) {
            member.role = role as 'admin' | 'editor' | 'viewer';
        }
        await project.save()

        await logActivity(userId, projectId, 'MEMBER_ROLE_UPDATED', `Member role updated to ${role}`, memberId)

        return res.status(200).json({success: true, message: `User promoted/demoted to ${role} successfully`})

    } catch (error) {
        console.error("UPDATE_MEMBER_ROLE_ERROR", error);
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

//leave project
export const leaveProject = async (req: Request, res: Response) => {
    try {
        const {projectId} = req.params as {projectId:string}
        const userId = req.user?._id

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized User"})
        }

        if(!mongoose.Types.ObjectId.isValid(projectId as string)) {
            return res.status(400).json({success: false, message: "Invalid project Id"})
        }


        const project = await Project.findById(projectId)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }

        const isOwner = project.owner.equals(userId)
        if(isOwner) {
            return res.status(403).json({success:false, message: "As the owner, you cannot leave. You must delete the project or transfer ownership."})
        }

        const isMember = project.members.some(m => m.user.equals(userId))
        if(!isMember) {
            return res.status(400).json({success: false, message: "You are not a member of this project"})
        }

        // Concurrency: If two people try to leave at the exact same millisecond, $pull ensures the database handles them correctly.
        await Project.findByIdAndUpdate(
            projectId,
            {$pull: {members: {user: userId}}},
            {new: true}
        )

        await Task.updateMany(
            {project: projectId, assignedTo: userId},
            {$unset: {assignedTo: ""}}
        )

        await Invitation.deleteMany({
            project: projectId,
            recipiect: userId
        })

        await logActivity(userId, projectId, "MEMBER_LEFT", 'Member left the project')

        return res.status(200).json({success: true, message: "You have left the project successfully"}) 
        

    } catch (error) {
        console.error("LEAVE_PROJECT_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

//remove member by owner/admin
export const removeMember = async (req: Request, res: Response) => {
    try {
        const {projectId, memberId} = req.params as {projectId: string; memberId: string}
        const userId = req.user?._id

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }

        if(!mongoose.Types.ObjectId.isValid(projectId as string) || !mongoose.Types.ObjectId.isValid(memberId as string)) {
            return res.status(400).json({success: false, message: "Invalid project or member Id."})
        }

        const project = await Project.findById(projectId)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }
        const isOwner = project.owner.equals(userId)
        const projectMember = project.members.find(m => m.user.equals(userId))
        const isAdmin = projectMember?.role === 'admin'

        if(!isOwner && !isAdmin) {
            return res.status(403).json({success: false, message: "Only owner or admin can remove the member."})
        }

        //check the member we want to remove is the part of the project or not
        const isMemberOwner = project.owner.equals(memberId)
        if(isMemberOwner) {
            return res.status(403).json({success: false, message: "The owner cannot remove itself"})
        }
        const isMember = project.members.find(m => m.user.equals(memberId))
        if(!isMember) {
            return res.status(404).json({success: false, message: "Member not found"})
        }
        if(isMember.role === 'admin' && isAdmin && !isOwner) {
            return res.status(403).json({success: false, message: "Only owner can remove admins."})
        }
        
        await Project.findByIdAndUpdate(
            projectId,
            {$pull: {members: {user: memberId}}},
            {new: true}
        )

        await Invitation.deleteMany({
            project: projectId,
            recipient: memberId
        })

        // Once the member is removed, all his tasks are also removed
        await Task.updateMany(
            {project: projectId, assignedTo: memberId},
            {$unset: { assignedTo: ""}} // removes the field entirely
        )

        await logActivity(
            userId,
            projectId,
            'MEMBER_REMOVED',
            'Member removed from project',
            memberId
        )
        

        return res.status(200).json({success: true , message: "Member removed successfully"})

    } catch (error) {
        console.error("REMOVE_MEMBER_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

//fetch the members of a project
export const getProjectMembers = async (req: Request, res: Response) => {
    try {
        const {projectId} = req.params as {projectId : string}
        const userId = req.user?._id

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }
        if(!mongoose.Types.ObjectId.isValid(projectId as string)) {
            return res.status(400).json({success: false, message: "Invalid project Id"})
        }

        const project = await Project.findById(projectId)
        .populate("members.user", "fullName email createdAt")

        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }

        const isOwner = project.owner.equals(userId)
        const projectMember = project.members.find(m => m.user.equals(userId))
        const isAdmin = projectMember?.role === 'admin'

        if(!isOwner && !isAdmin) {
            return res.status(403).json({success: false, message: "Only owner or admin can fetch the members"})
        }

        const members = project.members

        return res.status(200)
        .json({success: true, message: members.length === 1 ? "Only owner is the only member of this project"
            : "All members fetched successfully",
            data: members
        })

    } catch (error) {
        console.error("GET_PROJECT_MEMBERS_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}



