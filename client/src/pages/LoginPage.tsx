import { useState } from "react"
import { Link, useNavigate, } from 'react-router-dom'
import { toast } from 'react-toast'
import api from '../lib/axios'

const LoginPage = () => {
    const [formData, setFormData] = useState({email: "", password: ""})
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value})
        setError("")
    }

    const handleLogin = async () => {
        setError("")
        if(!formData.email.trim() || !formData.password.trim()) {
            setError("All fields are required")
            return             
        }

        setLoading(true)
        try {
            const response = await api.post('/auth/login', formData)

            if(response.data.success) {
                toast.success("logged in successfully")
                localStorage.setItem('isLoggedIn', 'true')
                navigate('/dashboard')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 rounded-lg shadow-md bg-white">

                <h1 className="text-2xl font-bold mb-6 text-center">
                    Login
                </h1>

                {error && (
                    <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                        type="password"
                        className="w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                    />
                </div>
                <button
                    onClick={handleLogin}
                    disabled= {loading}
                    className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? "Logging in...": "Login"}
                </button>

                <p className="text-center text-sm mt-4 text-gray-600">
                    Don't have an account?{" "}
                    <Link to='/register' className='text-blue-600 hover:underline'>Register</Link>
                </p>
            </div>
        </div>
    )
}

export default LoginPage
