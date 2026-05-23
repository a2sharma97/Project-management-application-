export const getPriorityColor = (priority: string) => {
    if(priority === 'critical') return 'bg-red-100 text-red-700'
    if(priority === 'high') return 'bg-orange-100 text-orange-700'
    if(priority === 'medium') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
}