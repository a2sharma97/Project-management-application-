import { IUser } from "../models/user.model.ts";

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export { };
// created a global type declaration file that extends Express's Request interface so req.user is typed correctly across the entire application.