import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Project } from "../models/project.model.js";
import { Task, type ITask } from "../models/task.model.js";
import { logActivity } from "../utils/logActivity.js";


type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
type TaskPriorities = 'low' | 'medium' | 'high' | 'critical';
const createTask = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id
        const {projectId} = req.params as {projectId: string; }
        const {title, description, assignedTo, priority, deadline} = req.body 

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }
        if(!title) {
            return res.status(400).json({success: false, message: "Title is required"})
        }

        if(!mongoose.Types.ObjectId.isValid(projectId as string) ) {
            return res.status(400).json({success: false, message: "Invalid project ID"})
        }

        if(assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo as string)) {
             return res.status(400).json({success: false, message: "Invalid assignedTo ID"})
        }

        if(assignedTo && assignedTo === userId?.toString()) {
            return res.status(400).json({success: false, message: "You cannot assign a task to yourself"})
        }

        const project = await Project.findById(projectId)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }


        const isOwner = project.owner.equals(userId)
        const projectMember = project.members.find(m => m.user.equals(userId))
        const isAdmin = projectMember?.role === 'admin'

        if(!isOwner && !isAdmin) {
            return res.status(403).json({success: false, message: "Only owner or admins can create task."})
        }

        if(assignedTo) {
            const isAssigneeAMember = project.members.some(m => m.user.equals(assignedTo))
            if(!isAssigneeAMember) {
                return res.status(400).json({success: false, message: "Assignee must be a member of this project"})
            } 
        }

        const task = await Task.create({
            title: title.trim(),
            description,
            project: projectId,
            createdBy: userId,
            assignedTo: assignedTo as string,
            priority: priority || 'low',
            deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

        await logActivity(userId, projectId, "TASK_CREATED", `Created task: ${task.title}`, task._id)

        return res.status(201).json({success: true, message: "Task created successfully", data: task})

    } catch (error) {
        console.error("CREATE_TASK_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const getProjectTasks = async (req: Request, res: Response) => {
    try {
        const {projectId} = req.params as {projectId: string}
        const {status, priority, assignedTo} = req.query
        const userId = req.user?._id;

        // Authenticate first
        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized user"})
        }
        // Validate project Id
        if(!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({success: false, message: "Invalid project ID"})
        }
        // Fetch project
        const project = await Project.findById(projectId)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found."})
        }
        const isOwner = project.owner.equals(userId)
        const isProjectMember = project.members.some(m => m.user.equals(userId))

        if(!isOwner && !isProjectMember) {
            return res.status(403).json({success: false, message: "Only owner and project member can see this task."})
        }

        const filter: {
            project: string;
            status?: TaskStatus;
            priority?: TaskPriorities;
            assignedTo?: string;
        } = {
            project: projectId
        }
        
        // Validate status if provided
        const validateStatus : TaskStatus[]  = ['todo', 'in-progress', 'review', 'done']
        if(status) {
            if(!validateStatus.includes(status as TaskStatus )) {
                return res.status(400).json({success: false, message: "Invalid status type"})
            }
            filter.status = status as TaskStatus

        }
        // Validate priority if provided
        const validatePriorities: TaskPriorities[] = ['low' , 'medium' , 'high' , 'critical']
        if(priority) {
            if(!validatePriorities.includes(priority as TaskPriorities)) {
                return res.status(400).json({success: false, message: "Invalid priority type"})
            }
            filter.priority = priority as TaskPriorities

        }
        // Validate assignee Id if provided
        if(assignedTo) {
            if(!mongoose.Types.ObjectId.isValid(assignedTo as string)) {
                return res.status(400).json({success: false, message: "Invalid assignee ID"})
            }
            filter.assignedTo = assignedTo as string
        }

        const tasks = await Task.find(filter)
        .populate('assignedTo', 'fullName email')
        .populate('project', 'title description')
        .populate('createdBy', 'fullName email')
        .sort({createdAt: -1}) //show newest task first

        return res.status(200)
        .json({
            success: true,
            message: tasks.length > 0 ? "Tasks fetched" : "No tasks found matching criteria",
            data: tasks
        })
       

    } catch (error) {
        console.error("GET_PROJECT_TASKS_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const updateTask = async (req: Request, res: Response) => {
    try {
       const {taskId} = req.params
       const {title, status, priority, assignedTo, deadline, description} = req.body
       const userId = req.user?._id

       // Authenticate first
       if(!userId) {
        return res.status(401).json({success: false, message: "Unauthorized access"})
       }

       // Check atleast one field is provided
       const updates = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => [
            key,
            typeof value === 'string' ? value.trim() : value
        ])
       )
       const hasAtleastOneField = Object.values(updates).some(val => val !== undefined && val !== "")
       if(!hasAtleastOneField ) {
        return res.status(400).json({success: false, message: "At least one field is required to update and that field should not be empty."})
       }

       if(updates.title !== undefined && updates.title === '') {
            return res.status(400).json({ success: false, message: "Title cannot be empty" })
        }
        if(updates.description !== undefined && updates.description === '') {
            return res.status(400).json({ success: false, message: "Description cannot be empty" })
        }

       // Check for deadline

       // Validate taskId format
       if(!mongoose.Types.ObjectId.isValid(taskId as string)) {
         return res.status(400).json({success: false, message: "Invalid task ID"})
       }
       // Validate assignedTo format if provided
       if(assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo as string)) {
         return res.status(400).json({success: false, message: "Invalid assinee ID"})
       }

       // Validate status value if provided
       const valideStatuses = ['todo' , 'in-progress' , 'review' , 'done']
       if(status && !valideStatuses.includes(status)) {
        return res.status(400).json({success: false, message: "Invalid status value"})
       }

       // Validate priority value if provided
       const validatePriorities = ['low' , 'medium' , 'high' , 'critical']
       if(priority && !validatePriorities.includes(priority)) {
        return res.status(400).json({success: false, message: "Invalid priority value"})
       }

        // Fetch task
       const task = await Task.findById(taskId)
       if(!task) {
        return res.status(404).json({success: false, message: "Task not found"})
       }

       // Fetch project from task
       const project = await Project.findById(task?.project._id)
       if(!project) {
        return res.status(404).json({success: false, message: "Project not found"})
       }

       // Check requester's (logged-in user) role in project 
       const isOwner = project.owner.equals(userId)
       const projectMember = project.members.find(m => m.user.equals(userId))
       const isAdmin = projectMember?.role === 'admin'
       const isAssignee = task.assignedTo?.equals(userId)
      
       // Validate new assignee is a project member if assignedTo being changed
       if(assignedTo) {
        const isAssigneeAMember = project.members.some(m => m.user.equals(assignedTo))
        if(!isAssigneeAMember) {
            return res.status(400).json({success: false, message: "Assignee must be the member of this project."})
        }
       }

       // Auto-fix stale assignee if member was removed from project
        if(task.assignedTo) {
            const assigneeStillMember = project.members.some(m => 
                m.user.equals(task.assignedTo)
            )
            if(!assigneeStillMember) {
                await Task.findByIdAndUpdate(taskId, { $unset: { assignedTo: "" } })
            }
        }
       
       // Build update object based on who is requesting
       const updateFields: Partial<ITask> = {} // Create a dynamic object(creates a new type from the given type),
       //  copies all properties from ITask but optionally but at runtime JS take it as a empty object.

      // If any of these properties add to updateField than it count as a property
       if(isOwner || isAdmin) {
        // Owner and admin can update all fields
        if(title) updateFields.title = title
        if(description) updateFields.description = description
        if(priority) updateFields.priority = priority
        if(assignedTo) updateFields.assignedTo = assignedTo
        if(deadline) updateFields.deadline = deadline
        if(status) updateFields.status = status   
       } else if(isAssignee) {
            // Assignee can only update status
            if(!status) {
                return res.status(400).json({success: false, message: "Assignees can only update the status."})
            }
            updateFields.status = status
       } else {
            // No permission
            return res.status(403).json({success: false, message: "You don't have permission to update this task."})
       }    

       const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {$set: updateFields},
        {new: true}
       )

       // Log appropriate activity
       const activityAction = status && Object.keys(updateFields).length === 1
       ? "STATUS_UPDATED" : "TASK_UPDATED" 

       await logActivity(userId, task.project, activityAction, `Task updated: ${task.title}`, task._id)
       
       return res.status(200).json({success: true, message: "Task updated successfully.", data: updatedTask})       

    } catch (error) {
        console.error("UPDATE_TASK_STATUS_ERROR", error);
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const {taskId} = req.params
        const userId = req.user?._id

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }

        if(!mongoose.Types.ObjectId.isValid(taskId as string)) {
            return res.status(400).json({success: false, message: "Invalid Task ID"})
        }

        const task = await Task.findById(taskId)
        if(!task) {
            return res.status(404).json({success: false, message: "No Task found"})
        }

        const project = await Project.findById(task.project._id)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }

        const isOwner = project.owner.equals(userId)
        const projectMember = project.members.find(m => m.user.equals(userId))
        const isAdmin = projectMember?.role === 'admin'

        // Only owner and admin can delete a task because, many times assignee leaves the project or if the assignee intentionally
        // deletes the task. Owner have the ownership of the project and sometimes admin also assign task to other member so both
        // of them are very close to the project that's why they have rights to delete a task. 
        if(!isOwner && !isAdmin) {
            return res.status(403).json({success: false, message: "Only owner and admin can delete a task"})
        }

        // await Task.deleteMany({ deletes all tasks of a particular project i.e if 50 tasks are assign to a project and we want to delete one it deletes all.
        //     project: task.project._id
        // })

        await Task.findByIdAndDelete(taskId)

        await logActivity(userId, task.project, "TASK_DELETED", `Task deleted: ${task.title}`, taskId as string)

        // I don't think so that we need to delete the task log because it logs the history of all our project
        // but if we need to than below is the code for task log activity delete

        // await Activity.deleteMany({
        //     entityId: taskId
        // })

        return res.status(200).json({success: true, message: "Task deleted successfully"})

    } catch (error) {
        console.error("DELETE_TASK_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const getTaskById = async (req: Request, res: Response) => {
    try {
        const {taskId} = req.params
        const userId = req.user?._id

        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }

        if(!mongoose.Types.ObjectId.isValid(taskId as string)) {
            return res.status(400).json({success: false, message: "Invalid task ID"})
        }

        const task = await Task.findById(taskId)
        .populate("assignedTo", "fullName email")
        .populate("createdBy", "fullName email")
        .populate("project", "title description createdAt")
        if(!task) {
            return res.status(404).json({success: false, message: "Task not found"})
        }

        const project = await Project.findById(task.project)
        if(!project) {
            return res.status(404).json({success: false, message: "Project not found"})
        }

        const isOwner = project.owner.equals(userId)
        const isMember = project.members.find(m => m.user.equals(userId))

        // Owner, admin and assignee all three should have access to see the task because owner and admin are the peoples
        // who created the task but assignee is the person who should know about the project before start, understands the project and do task easily on time.  
        if(!isOwner && !isMember) {
            return res.status(403).json({success: false, message: "You must be a project member to view this task."})
        }

        return res.status(200).json({success: true, message: "Task fetched successfully", data: task})

    } catch (error) {
        console.error("GET_TASK_BY_ID_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}


export { createTask };

