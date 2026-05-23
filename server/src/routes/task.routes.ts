import { Router } from "express";
import { createTask, deleteTask, getProjectTasks, getTaskById, updateTask } from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.post('/projects/:projectId', verifyJWT, createTask)
router.get('/projects/:projectId',verifyJWT, getProjectTasks)
router.get('/:taskId', verifyJWT, getTaskById)
router.patch('/:taskId',verifyJWT, updateTask)
router.delete('/:taskId', verifyJWT, deleteTask)

export default router
