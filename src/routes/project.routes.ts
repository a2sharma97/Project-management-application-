import { Router } from "express";
import { createProject, getProjectById, getUserProjects, updateProjectStatus } from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.post('/', verifyJWT, createProject)
router.get('/', verifyJWT, getUserProjects)
router.get('/:projectId', verifyJWT, getProjectById)
router.patch('/:projectId/status', verifyJWT, updateProjectStatus)

export default router