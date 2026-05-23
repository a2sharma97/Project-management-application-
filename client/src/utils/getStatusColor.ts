export const getStatusColor = (status: string) => {
    if(status === 'done') return 'bg-green-100 text-green-700'
    if(status === 'in-progress') return 'bg-blue-100 text-blue-700'
    if(status === 'review') return 'bg-purple-100 text-purple-700'
    return 'bg-gray-100 text-gray-700'
}