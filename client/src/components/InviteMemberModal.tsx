import { useState } from "react";
import { toast } from "react-toast";
import api from "../lib/axios";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    projectId: string
}

interface InviteForm {
    email: string;
    role:'admin' | 'editor' | 'viewer';
}

const InviteMemberModal = ({ isOpen, onClose, projectId }: Props) => {
    const [inviteForm, setInviteForm] = useState<InviteForm>({ email: "", role: "viewer" })
    const [creating, setCreating] = useState(false)

    if (!isOpen) return null;

    const handleInvite = async () => {
        if (!inviteForm.email.trim()) {
            toast.error("Email is required")
            return
        }
        setCreating(true)
        try {
            const response = await api.post(`/invitations/projects/${projectId}/invite`, inviteForm)
            if (response.data.success) {
                toast.success("Invitation sent successfully")
                setInviteForm({ email: "", role: "viewer" })
                onClose()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Unable to send invite")
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4'>
                <h2 className='text-xl font-bold mb-4'>Invite Member</h2>

                <div className='mb-4'>
                    <label className='block text-sm font-medium mb-1'>Email</label>
                    <input 
                        type="email"
                        placeholder='Enter email'
                        className='w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500'
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                </div>
                
                <div className='mb-6'>
                    <label className='block text-sm font-medium mb-1'>Choose Role</label>
                    <select                            
                        className='w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500 bg-white'                           
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as InviteForm['role'] })}
                     >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className='flex gap-3'>
                    <button
                        onClick={() => {
                            setInviteForm({ email: "", role: "viewer" })
                            onClose()
                        }}
                        className='flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInvite}
                        disabled={creating}
                        className='flex-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors'
                    >
                        {creating ? "Inviting..." : "Invite"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InviteMemberModal