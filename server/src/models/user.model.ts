import bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    fullName: string;
    email: string;
    password:string;
    refreshToken?: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            select: false
        },
        refreshToken: {
            type: String,
            select: false
        }
    }, {timestamps: true})

userSchema.pre("save", async function(this: IUser) {
    if(!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.isPasswordCorrect = async function(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(): string {
    const payload = {
        _id: this._id,
        email: this.email,
        fullName:this.fullName
    }
    const options: SignOptions = {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY  || "1d") as any
    }
    return jwt.sign(
        payload,
       process.env.ACCESS_TOKEN_SECRET!,
        options
    )
}

userSchema.methods.generateRefreshToken = function(): string {
    return jwt.sign(
        {_id: this._id},
        process.env.REFRESH_TOKEN_SECRET!,
        {expiresIn: (process.env.REFRESH_TOKEN_EXPIRY! || "7d") as any}
    )
}

export const User = mongoose.model<IUser>('User', userSchema)