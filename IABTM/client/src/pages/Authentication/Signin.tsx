"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../../storage/authStore';
import Spinner from '@/components/ui/spinner';

const SignIn: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { user, setUser } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Email and password are required');
            return;
        }

        setIsLoading(true);

        try {
            console.log('🔐 Attempting login with:', { email, backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL });
            
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/login-email`, {
                email,
                password
            }, {
                withCredentials: true
            });

            console.log('Login response:', response.data);

            // Handle different response structures
            const { statusCode, message, data, success } = response.data;
            
            if (statusCode === 200 || success === true) {
                if (data && data.user) {
                    console.log('✅ Login successful, user data:', data.user);
                    setUser(data.user);
                    
                    // Try to increase path day
                    try {
                        const pathDayResponse = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/increase-pathDay`, {}, {
                            withCredentials: true
                        });
                        console.log("Path day increased:", pathDayResponse.data);
                    } catch (pathDayError) {
                        console.warn('⚠️ Could not increase path day:', pathDayError);
                        // Don't fail login if path day increase fails
                    }

                    toast.success('Login successful');
                    router.push('/dashboard');
                } else if (data) {
                    // Handle case where user data is directly in data
                    console.log('✅ Login successful, user data:', data);
                    setUser(data);
                    toast.success('Login successful');
                    router.push('/dashboard');
                } else {
                    toast.error('Login successful but no user data received');
                }
            } else {
                toast.error(message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // Server responded with error status
                    const errorMessage = error.response.data?.message || 
                                       error.response.data?.error || 
                                       `Server error: ${error.response.status}`;
                    toast.error(errorMessage);
                    console.error('Server error details:', error.response.data);
                } else if (error.request) {
                    // Request was made but no response received
                    toast.error('Unable to connect to server. Please check your internet connection.');
                    console.error('Network error:', error.request);
                } else {
                    // Something else happened
                    toast.error('An unexpected error occurred');
                    console.error('Unexpected error:', error.message);
                }
            } else {
                // Non-axios error
                toast.error('An unexpected error occurred');
                console.error('Non-axios error:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {return <Spinner />;}

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 overflow-hidden z-10">
            <div className="relative w-full max-w-md p-8 rounded-lg shadow-lg bg-[#FCFCFC] z-100">
                {/* Blue background shape positioned behind the form */}
                {/* <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#DCF6FF] rounded-2xl "></div> */}

                <div className="relative z-10">
                    <p className="text-gray-500 mb-1 text-center">Welcome back</p>
                    <h1 className="text-3xl font-semibold mb-6 text-center">Sign in</h1>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm text-gray-500 mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8F8F8F]"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm text-gray-500 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8F8F8F]"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <Link href="/forgot-password" className="text-blue-500 hover:text-blue-700 text-sm">
                                Forgot password?
                            </Link>
                        </div>

                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                className="px-8 py-6 cursor-pointer rounded-[80px] bg-black text-white border border-solid hover:bg-gray-800 hover:text-white [font-family:'Satoshi-Medium',Helvetica] font-medium text-lg focus:ring-gray-500"
                            >
                                Sign in
                            </Button>
                        </div>

                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link href="/onboarding" className="text-blue-500 hover:text-blue-700">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Pink background shape positioned behind the form */}
                {/* <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#FCF3FF] rounded-3xl z-[-1]"></div> */}
            </div>
            <ToastContainer position="top-right" autoClose={5000} />  
        </div>

    );
};

export default SignIn;

