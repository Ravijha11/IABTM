"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from '@/components/ui/button';

const ResetPassword: React.FC = () => {
    const [isResendDisabled, setIsResendDisabled] = useState(true);
    const [timer, setTimer] = useState(20); // 20 seconds

    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev === 1) {
                    clearInterval(interval);
                    setIsResendDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        if (searchParams && searchParams.get('email')) {
            setEmail(searchParams.get('email') as string);
        }else {
            toast.error("Email is required to reset password");
            router.push('/forgot-password');
        }
    }, [searchParams]);

    const handleResendEmail = async (e: React.MouseEvent) => {
        // Prevent default to ensure this doesn't trigger form submission
        e.preventDefault();

        if (!email) {
            toast.error("Email is required to resend OTP");
            return;
        }

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/forgot-password`, { email });
            toast.success("OTP resent successfully. Check your email.");
            setIsResendDisabled(true);
            setTimer(20); // Reset timer
        } catch (error) {
            toast.error("Failed to resend OTP. Try again.");
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !otp || !newPassword) {
            toast.error('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/reset-password`, {
                email,
                otp,
                newPassword
            });

            const { statusCode, message } = response.data;

            if (statusCode === 200) {
                toast.success(message || 'Password reset successful');

                setTimeout(() => {
                    router.push('/sign-in');
                }, 300);
            } else {
                toast.error(message || 'Failed to reset password');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data?.message || 'An error occurred');
            } else {
                toast.error('Unable to connect to server');
            }
            console.error('Reset password error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 rounded-lg shadow-lg bg-white relative">
                <div className="relative z-10">
                    <h1 className="text-3xl font-semibold mb-2 text-center">Reset password</h1>
                    <p className="text-gray-500 mb-6 text-center font-light">
                        Enter the OTP sent to your email and create a new password
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm text-gray-500 mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black bg-gray-100"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                readOnly
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="otp" className="block text-sm text-gray-500 mb-1">OTP</label>
                            <input
                                type="text"
                                id="otp"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter the 5-digit OTP"
                                maxLength={5}
                            />
                        </div>

                        <div className="text-center mt-2">
                            <button
                                type="button" // Important! This prevents form submission
                                className={`text-sm font-medium ${isResendDisabled ? "text-gray-400 cursor-not-allowed" : "text-blue-500 hover:text-blue-700 cursor-pointer"}`}
                                onClick={handleResendEmail}
                                disabled={isResendDisabled}
                            >
                                Resend OTP {isResendDisabled && `in ${timer}s`}
                            </button>
                        </div>


                        <div className="mb-4">
                            <label htmlFor="newPassword" className="block text-sm text-gray-500 mb-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="newPassword"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
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
                            <label htmlFor="confirmPassword" className="block text-sm text-gray-500 mb-1">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="confirmPassword"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>

                        <div className="flex justify-center">

                            <Button
                                variant="outline"
                                className="px-8 py-6 cursor-pointer rounded-[80px] bg-black text-white border border-solid hover:bg-gray-800 hover:text-white [font-family:'Satoshi-Medium',Helvetica] font-medium text-lg focus:ring-gray-500"
                            >
                                Reset Pssword
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Remember your password?{' '}
                            <Link href="/signin" className="text-blue-500 hover:text-blue-700">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={5000} />
        </div>
    );
};

export default ResetPassword;