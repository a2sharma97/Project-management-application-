import type { Types } from "mongoose";
import type { ActivityAction } from "../@types/activity.types.js";
import { Activity } from "../models/activity.model.js";

export const logActivity = async (
    actor: Types.ObjectId | string,
    project: Types.ObjectId | string,
    action: ActivityAction,
    details: string,
    entityId?: Types.ObjectId | string
) => {
    try {
        const query : {
    actor: Types.ObjectId | string,
    project: Types.ObjectId | string,
    action: ActivityAction,
    details: string,
    entityId?: Types.ObjectId | string
        } = {
            actor,
            project,
            action,
            details,
        }
        if(entityId) {
            query.entityId = entityId
        }
        await Activity.create(query)
    } catch (error) {
        console.error("LOGGING_ERROR", error)
    }
}