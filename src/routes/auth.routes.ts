import { Router } from "express";
import { getMe, login, logout, register } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', verifyJWT, getMe)
router.post('/logout', verifyJWT, logout)

export default router

// Why do you need to save the refresh token to the database?
// we need to save the refresh token to the database because its Time to live(TTL) is more and it helps the user to
// stay logged in after closing the tab or window.

// What is the difference between `set‘and‘unset` in MongoDB?
// 'set' is used to set the value of a field and 'unset' is used to clear the value of a field. when if we want to
// update any field 'set' is the clearer way to do that whereas, to remove any value 'unset' is the best choice.

// Why must you clear the cookie on logout — isn't clearing the DB token enough?
// No we must clear the cookie also because if we not clear the cookie then at the next request browser sends the 
// old cookie which is not matched by the verifyJWT and then it gives error.