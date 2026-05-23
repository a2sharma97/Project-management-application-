import { Router } from "express";
import { getProjectMembers, leaveProject, removeMember, updateMemberRole } from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.get('/:projectId/members', verifyJWT, getProjectMembers)
router.patch('/:projectId/member/:memberId/role', verifyJWT, updateMemberRole)
router.delete('/:projectId/member/:memberId', verifyJWT, removeMember)
router.patch('/:projectId/leave', verifyJWT, leaveProject)

export default router


