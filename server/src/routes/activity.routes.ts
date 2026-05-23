import { Router } from "express";
import { getActivityLog } from "../controllers/activity.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.get('/:projectId', verifyJWT, getActivityLog)

export default router