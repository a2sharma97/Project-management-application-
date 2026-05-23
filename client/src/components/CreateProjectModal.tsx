import { useState } from "react";
import { toast } from "react-toast";
import api from "../lib/axios";
import type { IProject } from "../types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (project: IProject) => void;
}

const CreateProjectModal = ({isOpen, onClose, onSuccess}: Props ) => {
    const [projectForm, setProjectForm] = useState({title: "", description: ""})
    const [creating, setCreating] = useState(false)

    if(!isOpen) return null

    const handleSubmit = async () => {
        if(!projectForm.title.trim() || !projectForm.description.trim()) {
                toast.error("Titile and description are rquired")
                return
        }
        setCreating(true)
        try {
            const response = await api.post('/projects/', projectForm)
            if (response.data.success) {
                toast.success("Project created successfully")
                onSuccess(response.data.data) // Pass data back to parent
                setProjectForm({ title: "", description: "" })
                onClose()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to create project")
        } finally {
            setCreating(false)
        }
    }
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4'>
                <h2 className='text-xl font-bold mb-4'>Create New Project</h2>

                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-1'>Title</label>
                    <input 
                        type="text"
                        placeholder='Enter project title'
                        className='w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500'
                        value={projectForm.title}
                        onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    />
                </div>
                
                <div className='mb-6'>
                    <label className='block text-sm font-medium mb-1'>Description</label>
                    <textarea                             
                        placeholder='Enter project description'
                        className='w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500 resize-none'
                        rows={3}
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                     />
                </div>

                <div className='flex gap-3'>
                    <button
                        onClick={() => {
                            setProjectForm({ title: "", description: "" })
                            onClose()
                        }}
                        className='flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={creating}
                        className='flex-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors'
                    >
                        {creating ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateProjectModal