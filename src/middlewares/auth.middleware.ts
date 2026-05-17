import type { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";



export const verifyJWT = async (req: Request, res:Response, next: NextFunction) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", '')

        if(!token) {
            return res.status(401).json({success: false, message: "No token provided"})
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {_id: string}

        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if(!user) {
            return res.status(401).json({success: false, message: "Invalid token"})
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({success: false, message: "Invalid or expired token"})
    }
}

