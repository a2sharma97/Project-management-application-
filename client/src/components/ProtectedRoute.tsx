import { Navigate } from "react-router-dom"

const ProtectedRoute = ({children}: {children: React.ReactNode}) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')

    if(!isLoggedIn) {
        return <Navigate to='/login' />
    }

    return <>
    {children}
    </>
}

export default ProtectedRoute