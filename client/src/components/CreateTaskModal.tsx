import { useState } from "react";
import { toast } from "react-toast";
import api from "../lib/axios";
import type { IMember, ITask } from "../types";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess: (task: ITask) => void;
    members: IMember[]
}

interface TaskForm {
     title: string;
    description: string,
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline: string;
    assignedTo: string
}



const CreateTaskModal = ({ isOpen, onClose, projectId, onSuccess, members }: Props) => {
     const [taskForm, setTaskForm] = useState<TaskForm>({
        title: "",
        description: "",
        priority: 'medium',
        deadline: "",
        assignedTo: ""
    })
    const [creating, setCreating] = useState(false)

    if (!isOpen) return null;

    const handleTask = async () => {
        if (!taskForm.title.trim()) {
            toast.error("Title and description are required")
            return
        }
        if(!taskForm.deadline) {
            toast.error('Deadline is required')
            return
        }
        setCreating(true)
        try {
            const payload = {
                ...taskForm,
                assignedTo: taskForm.assignedTo || undefined,
                deadline: taskForm.deadline || undefined
            }
            const response = await api.post(`/tasks/projects/${projectId}`, payload)
            if (response.data.success) {
                toast.success("Task created successfully")
                onSuccess(response.data.data) // Pass data back to parent
                setTaskForm({title: "", description: "", priority: "medium", deadline: "", assignedTo: ""})
                onClose()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to create task")
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4'>
                <h2 className='text-xl font-bold mb-4'>Create Task</h2>

                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-1'>Title</label>
                    <input 
                        type="text"
                        placeholder='Enter task title'
                        className='w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500'
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    />
                </div>
                
                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-1'>Description</label>
                    <textarea
                        placeholder="Enter task description"                        
                        className='w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500 resize-none'                           
                        rows={3}
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} 
                    />
                </div>
                <div className='mb-4'>
                            <label className='block text-sm font-medium mb-1'>Priority</label>
                            <select
                                className='w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500 bg-white'                          
                                value={taskForm.priority}
                                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskForm['priority']})}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div className='mb-4'>
                            <label className='block text-sm font-medium mb-1'>Deadline</label>
                            <input 
                                type="date"
                                className='w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500'
                                value={taskForm.deadline}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                            />
                        </div>
                        <div className='mb-6'>
                            <label className='block text-sm font-medium mb-1'>Assign To  <span className='text-gray-400 font-normal'>(optional)</span></label>
                            <select
                                className='w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500 bg-white'                          
                                value={taskForm.assignedTo}
                                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                            >
                                <option value="">Unassigned</option>
                                {members.map((member) => (
                                    <option key={member.user._id} value={member.user._id}>
                                        {member.user.fullName} ({member.user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                <div className='flex gap-3'>
                    <button
                        onClick={() => {
                            setTaskForm({title: "", description: "", priority: "medium", deadline: "", assignedTo: ""})
                            onClose()
                        }}
                        className='flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTask}
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

export default CreateTaskModal