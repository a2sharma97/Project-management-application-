import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toast"
import api from "../lib/axios"

const RegisterPage = () => {
    const [formData, setFormData] = useState({fullName: "", email: "", password: "", confirmPassword: ""})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const navigate = useNavigate()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value})
        setError("")
    }

    const handleRegister = async () => {
        setError("")
        const {fullName, email, password, confirmPassword} = formData
        if(!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() ) {
            setError("All fields are required")
            return
        }
        if(password !== confirmPassword) {
            setError("Password do not match")
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/auth/register', {fullName, email, password})

            if(response.data.success) {
                toast.success("Registering successfully")
                setFormData({fullName: "", email: "", password: "", confirmPassword: ""})
                navigate('/login')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration Failed")
        } finally {
            setLoading(false)
        }
    }

    return(
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 rounded-lg shadow-md bg-white">
                <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>

                {error && (
                    <p className="text-red-500 text-sm mb-4 text-center"
                    >{error}</p>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input type="text"
                    placeholder="Enter your fullname"
                    className="w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500"
                    value= {formData.fullName}
                    onChange={handleChange} 
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500"
                    value= {formData.email}
                    onChange={handleChange} />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input type="password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500"
                    value={formData.password}
                    onChange={handleChange} />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Confirm Password</label>
                    <input type="password"
                    placeholder="Enter confirm password"
                    className="w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500"
                    value={formData.confirmPassword}
                    onChange={handleChange} />
                </div>
                <button 
                onClick={handleRegister}
                disabled= {loading}
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? "Creating account...": "Signup"}
                </button>
                <p className="text-center text-sm mt-4 text-gray-600">
                    Already have an account?{" "}
                    <Link to='/login' className="text-blue-600 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    )
}

export default RegisterPage