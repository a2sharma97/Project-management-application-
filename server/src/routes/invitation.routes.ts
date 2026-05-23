import { Router } from "express";
import { cancelInvite, getMyInvitations, getProjectInvitations, respondToInvite, sendInvite } from "../controllers/invitation.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.post('/projects/:projectId/invite', verifyJWT, sendInvite)
router.get('/my', verifyJWT, getMyInvitations)
router.get('/projects/:projectId', verifyJWT, getProjectInvitations)
router.patch('/:invitationId/respond', verifyJWT, respondToInvite)
router.delete('/:invitationId/cancel', verifyJWT, cancelInvite)

export default router