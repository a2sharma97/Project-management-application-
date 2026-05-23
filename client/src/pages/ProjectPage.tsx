import { ArrowLeft, Plus } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toast"
import CreateTaskModal from "../components/CreateTaskModal"
import InviteMemberModal from "../components/InviteMemberModal"
import api from "../lib/axios"
import { type IMember, type IProject, type ITask, type IUser } from "../types"
import { getPriorityColor } from "../utils/getPriorityColor"
import { getStatusColor } from "../utils/getStatusColor"

const ProjectPage = () => {
    const {projectId} = useParams<{projectId: string}>()
    const navigate = useNavigate()

    // Data States 
    const [currentUser, setCurrentUser] = useState<IUser | null>(null)
    const [project, setProject] = useState<IProject | null>(null)
    const [members, setMembers] = useState<IMember[]>([])
    const [tasks, setTasks] = useState<ITask[]>([])

    // UI States
    const [loading, setLoading] = useState(false)
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'members' | 'tasks'>('members')

    // Permissions
    const isOwner = project?.owner._id?.toString() === currentUser?._id?.toString()
    const projectMember = project?.members.find(m => m.user._id?.toString() === currentUser?._id?.toString())
    const isAdmin = projectMember?.role === 'admin'
    const canManage = isOwner || isAdmin

    const fetchProjectData = useCallback(async () => {
        if(!projectId) return
        setLoading(true)
        try {
            const [memberRes, taskRes, projectRes, userRes] = await Promise.all([
                api.get(`/members/${projectId}/members`),
                api.get(`/tasks/projects/${projectId}`),
                api.get(`/projects/${projectId}`),
                api.get(`/auth/me`)
            ])
            setMembers(memberRes.data.data || [])
            setTasks(taskRes.data.data || [])
            setProject(projectRes.data.data || null)
            setCurrentUser(userRes.data.data || null)
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to load project data"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [projectId]) 

     useEffect(() => {
        fetchProjectData()
    },[fetchProjectData])

    const handleLogout = async () => {
        try {
            const response = await api.post('/auth/logout')
            if(response.data.success) {
                toast.success("Logged out successfully")
                localStorage.removeItem('isLoggedIn')
                navigate('/login')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to logout")
        }
    }

    if(loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading...</p>
            </div>
        )
    }

    return(
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1"/>Back
                    </button>
                    <h1 className="text-xl font-bold text-blue-600">Nexus</h1>
                </div>
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                >
                    Logout
                </button>
            </nav>

            {/* Main content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Project header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 capitalize">
                        {project?.title || "Project"}
                    </h2>
                    <p className='text-gray-500 mt-1'>
                        {project?.description}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        Owner: {project?.owner.fullName}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        {members.length} member{members.length !== 1 ? 's': ''}
                    </p>
                </div>

                {canManage && (
                    <div className="flex gap-3 mb-6">
                        <button 
                        onClick={() => setShowInviteModal(true)}
                        className="flex px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                            <Plus className="w-4 h-4 mr-1" /> Invite Member
                        </button>
                        <button
                            onClick={() => setShowCreateTaskModal(true)}
                            className="flex px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-1"/> Create Task
                        </button>
                    </div>
                )}

                {/* Tab buttons */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('members')}
                        className={`px-4 py-2 text-sm rounded-md transition-colors ${
                            activeTab === 'members'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        Members ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-4 py-2 text-sm rounded-md transition-colors ${
                            activeTab === 'tasks'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        Tasks ({tasks.length})
                    </button>
                </div>

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {members.length === 0 && (
                            <p className="text-gray-500 text-sm">No members yet.</p>
                        )}
                        {members.map((member) => (
                            <div 
                                key={member.user._id}
                                className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
                            >
                                <p className="font-medium text-gray-800 capitalize">
                                    {member.user.fullName}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {member.user.email}
                                </p>
                                <span className="text-xs mt-2 inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                    {member.role}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tasks Tab */}
                {activeTab === 'tasks' && (
                    <div className="flex flex-col gap-3">
                        {tasks.length === 0 && (
                            <p className="text-gray-500 text-sm">No tasks yet.</p>
                        )} 
                        {tasks.map((task) => (
                            <div 
                                key={task._id}
                                className="bg-white rounded-lg shadow-sm p-5 border border-gray-100"
                            >
                                <div className="flex justify-between items-start">
                                    <p className="font-medium text-gray-800 capitalize">
                                        {task.title}
                                    </p>
                                    <div className="flex gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-4 text-sm text-gray-500">
                                {task.assignedTo && (
                                    <p>Assigned to: <span className="font-medium text-gray-700">{task.assignedTo.fullName}</span></p>
                                )}
                                {task.deadline && (
                                    <p>Deadline: <span className="font-medium text-gray-700">{new Date(task.deadline).toLocaleDateString()}</span></p>
                                )}
                                </div>
                            </div>                            
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
                <InviteMemberModal
                    isOpen= {showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    projectId={projectId!}
                />

            {/* Task Moal */}
             <CreateTaskModal
                isOpen= {showCreateTaskModal}
                onClose={() =>setShowCreateTaskModal(false)}
                projectId={projectId!}
                onSuccess={(newTask) => setTasks([...tasks, newTask])}
                members={members}
             />
        </div>
    )
}

export default ProjectPage