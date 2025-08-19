"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from '@/components/ui/button';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('Email is required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/forgot-password`, {
                email
            });

            const { statusCode, message } = response.data;

            if (statusCode === 200) {
                toast.success(message || 'OTP sent to your email');
                router.push(`/reset-password?email=${email}`);
            } else {
                toast.error(message || 'Failed to send reset link');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data?.message || 'An error occurred');
            } else {
                toast.error('Unable to connect to server');
            }
            console.error('Forgot password error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-white">
            <div className="w-full max-w-md p-10 rounded-lg shadow-lg bg-[#FCFCFC] relative">

                {/* <div className="absolute -top-4 -right-4 w-40 h-40 bg-blue-100 rounded-3xl z-0"></div> */}

                <div className="relative z-10">
                    <h1 className="text-3xl font-semibold mb-2 text-center">Forgot password</h1>
                    <p className="text-gray-500 mb-6 text-center font-light">
                        Enter your account's email and we'll send you an email to reset the password.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="email" className="block text-sm text-gray-500 mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                className="px-8 py-6 cursor-pointer rounded-[80px] bg-black text-white border border-solid hover:bg-gray-800 hover:text-white [font-family:'Satoshi-Medium',Helvetica] font-medium text-lg focus:ring-gray-500"
                            >
                                Send Email
                            </Button>

                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link href="/create-account" className="text-blue-500 hover:text-blue-700">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={5000} />
        </div>
    );
};

export default ForgotPassword;