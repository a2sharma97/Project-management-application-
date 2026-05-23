export interface IUser {
    _id: string;
    fullName: string;
    email: string;
}

export interface IMember {
    user: IUser;
    role: 'admin' | 'editor' | 'viewer';
}

export interface IProject {
    _id: string;
    title: string;
    description: string;
    owner: IUser;
    members: IMember[];
    status: 'planning' | 'active' | 'completed';
    createdAt: string
}

export interface ITask {
    _id: string;
    title: string;
    description?:string;
    project: IProject;
    createdBy: IUser;
    assignedTo?: IUser;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline: string;
    createdAt: string
}

export interface IInvitation {
    _id: string;
    project: IProject;
    inviter: IUser;
    recipient: IUser;
    role: 'admin' | 'editor' | 'viewer';
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T
}