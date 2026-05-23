import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toast"
import CreateProjectModal from '../components/CreateProjectModal'
import api from "../lib/axios"
import type { IProject } from "../types"
import { getStatusColor } from '../utils/getStatusColor'

const DashboardPage = () => {
    const [projects, setProjects] = useState<IProject[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const navigate = useNavigate()

    const fetchProjects = useCallback(async () => {
        setLoading(true)

        try {
            const response = await api.get('/projects/')
            if(response.data.success) {
               setProjects(response.data.data || [])
            }
        } catch (error:any) {
            toast.error( error.response?.data?.message || "Unable to fetch projects")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const handleLogout = async () => {
        try {
            const response = await api.post('/auth/logout')
            if(response.data.success) {
                toast.success("Logged out successfully")
                localStorage.removeItem('isLoggedIn')
                navigate('/login')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to logout")
        }
    }

    return(
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">Nexus</h1>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                    >Logout
                </button>
            </nav>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">My Projects</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex cursor-pointer"
                    >
                        <Plus size={20} strokeWidth={3} className='mr-1'/>New Project
                    </button>
                </div>
                {/* Loading State */}
                {loading && (
                    <p className="text-center text-gray-500 py-12">Loading projects...</p>
                )}

                {/* Empty State */}
                {!loading && projects.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">No projects yet.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Create your first project
                        </button>
                    </div>
                )}

                {/* Project Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <div
                            key={project._id}
                            onClick={() => navigate(`/projects/${project._id}`)}
                            className="bg-white rounded-lg shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
                        >
                            {/* Status badge */}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(project.status)}`}>
                                {project.status}
                            </span>

                            {/* Title */}
                            <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-1 capitalize">
                                {project.title}
                            </h3>

                            {/* Description */}
                            <p className='text-sm text-gray-500 mb-4 line-clamp-2'>
                                {project.description}
                            </p>

                            {/* Member count */}
                            <p className='text-xs text-gray-400'>
                                {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Project Model */}
                <CreateProjectModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={(newProject) => setProjects([...projects, newProject])}
                />
        </div>
    )
}

export default DashboardPage