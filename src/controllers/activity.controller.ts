import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Activity } from "../models/activity.model.js";
import { Project } from "../models/project.model.js";

export const getActivityLog = async (req: Request, res: Response) => {
    try {
        const {projectId} = req.params
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
        const isOwner = project.owner.equals(userId)
        const isMember = project.members.some(m => m.user.equals(userId))

        // Only owner and member of the project can access the activity because by seeing activities they took the decisions of the project 
        // like if someone left the project then they invite another user.
        if(!isOwner && !isMember) {
            return res.status(403).json({success: false, message: "Only owner and member access this project"})
        }

        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20
        const skip = (page - 1) * limit;


        const log = await Activity.find({project: projectId as string})
        .populate("actor", 'fullName email')
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)

        const total =  await Activity.countDocuments({project: projectId as string})
        
        return res.status(200).json({success: true, message: log.length === 0
            ? "No activity yes" : "Activity fetched successfully.",
             data: log,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total/ limit)
            }})
        
    } catch (error) {
        console.error("GET_ACTIVITY_LOG_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}