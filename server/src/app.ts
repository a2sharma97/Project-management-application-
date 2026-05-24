import dotenv from 'dotenv'
dotenv.config({
    path:'./.env'
})

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { type Application, type NextFunction, type Request, type Response } from 'express'
import activityRouter from './routes/activity.routes.js'
import authRouter from './routes/auth.routes.js'
import invitationRouter from './routes/invitation.routes.js'
import memberRouter from './routes/member.routes.js'
import projectRouter from './routes/project.routes.js'
import taskRouter from './routes/task.routes.js'
import connectDb from './services/db.js'

const app: Application = express()


const PORT = Number(process.env.PORT) || 3000

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL || ''
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true)

        if(allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error(`CORS blocked: ${origin}`))
        }
    },
    credentials: true
}))
app.use(express.json({limit: '100kb'}))
app.use(cookieParser())


app.use('/api/auth', authRouter)
app.use('/api/projects', projectRouter)
app.use('/api/invitations', invitationRouter)
app.use('/api/members', memberRouter)
app.use('/api/tasks', taskRouter)
app.use('/api/activity', activityRouter)

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("UNHANDLED_ERROR", err)
    return res.status(500).json({success: false, message: "Internal Server Error"})
})

const startServer = async() => {
    try {
        await connectDb()

        const server = app.listen(PORT, () => {
            console.log(`Server is running at port ${PORT}`)
        })

        server.on('error', (error: Error) => {
            console.log('Server execution failed', error)
        })
    } catch (error) {
        console.error("Initialization failed: ", error)
        process.exit(1)
    }
}

startServer()