import type { Request, Response } from "express";
import { User, type IUser } from "../models/user.model.js";

 const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const
        }

export const register = async (req: Request, res: Response) => {
    try {
        const {fullName, email, password} = req.body as IUser

        if(!fullName || !email || !password) {
            return res.status(400).json({success: false, message: "All fields are required"})
        }
        const trimmedName = fullName.trim()
        const trimmedEmail = email.trim()
        const trimmedPassword = password.trim()
        if(!trimmedName || !trimmedEmail || !trimmedPassword) {
            return res.status(400).json({success: false, message: "Fields cannot be empty"})
        }

        const exsitingUser = await User.findOne({email: trimmedEmail})
        if(exsitingUser) {
            return res.status(409).json({success: false, message: "User already exists"})
        }

        await User.create({
            fullName: trimmedName,
            email: trimmedEmail,
            password: trimmedPassword
        })

        return res.status(201).json({success: true, message: "User created successfully"})

    } catch (error) {
        console.error("REGISTER_ERROR", error)
        return res.status(500).json({success: false, message: "Internal Server Error"})   
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const {email, password} = req.body

        if(!email || !password) {
            return res.status(400).json({success: false, message: "All fields are required"})
        }

        const trimmedEmail = email.trim()
        const trimmedPassword = password.trim()
        if(!trimmedEmail || !trimmedPassword) {
            return res.status(400).json({success: false, message: "Fields cannot be empty"})
        }

        const user = await User.findOne({email: trimmedEmail}).select('+password')
        if(!user) {
            return res.status(404).json({success: false, message: "User does not exist"})
        }

        const isPasswordValid = await user.isPasswordCorrect(trimmedPassword)
        if(!isPasswordValid) {
            return res.status(401).json({success: false, message: "Invalid email or password"})
        }

        const token = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})       

        return res.status(200)
        .cookie("token", token, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json({success: true, message: "User logged in"})

    } catch (error) {
        console.error("LOGIN_ERROR",error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id
        if(!userId) {
            return res.status(401).json({success: false, message: "Unauthorized access"})
        }

        await User.findByIdAndUpdate(
            userId,
           { $unset: {refreshToken:""}}
        )
        return res
        .status(200)
        .clearCookie("token", cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
        .json({success: true, message: "Logged out successfully"})
        
    } catch (error) {
        console.error("LOGOUT_ERROR",error)
        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}