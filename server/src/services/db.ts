import mongoose from "mongoose";

const connectDb = async() => {
    try {
        const uri = process.env.MONGODB_URI
        if(!uri) {
            throw new Error("MONGODB_URI is not defined in the environment variables")
        }
        const conn = await mongoose.connect(uri)
        console.log(`Connected to MongoDB ${conn.connection.host}`)
    } catch (error) {
        console.log("Connection failed", error)
        process.exit(1)
    }
}

export default connectDb