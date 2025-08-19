import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ButtonLoader from '../ui/loader/ButtonloaderSpinner';

interface EmailVerificationModalProps {
    email: string;
    onVerify: (otp: string) => void;
    onClose: () => void;
    isLoading: boolean;
}

const EmailVerificationModal = ({ email: fullEmail, onVerify, onClose, isLoading }: EmailVerificationModalProps) => {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '']);
    const [timer, setTimer] = useState(45); // 45 seconds countdown
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null, null]);

    // Format email for display (hide middle part)
    const emailParts = fullEmail.split('@');
    const username = emailParts[0];
    const domain = emailParts[1] || '';

    // Show only first character and last character of username
    const hiddenEmail = username.length > 2
        ? `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.charAt(username.length - 1)}@${domain}`
        : `${username.charAt(0)}*@${domain}`;

    // Handle countdown timer
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    // Format timer to MM:SS
    const formatTimer = () => {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Handle input change and automovement to next field
    const handleChange = (index: number, value: string) => {
        if (value.length <= 1) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            // Move to next input if value is entered and not the last field
            if (value && index < 4) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    // Handle backspace key to move to previous input
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle OTP verification
    const handleVerify = () => {
        const fullOtp = otp.join('');
        if (fullOtp.length === 5) {
            onVerify(fullOtp);
        }
    };

    // Handle resend OTP
    const handleResend = async () => {
        // Reset timer and disable resend button
        setTimer(45);
        setCanResend(false);
        // Clear OTP fields
        setOtp(['', '', '', '', '']);
        // Focus on first input
        inputRefs.current[0]?.focus();

        console.log("Resending OTP to", fullEmail);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/register-email`, {
                email: fullEmail,
            });

            const { statusCode, message } = response.data;

            if (statusCode === 200) {
                toast.success('OTP resent successfully');
            } else {
                toast.error('Failed to resend otp');
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data?.message || 'An error occurred');
            } else {
                toast.error('Unable to connect to server');
            }
            console.error('resend otp error', error);
        }

        
    };

    return (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-full max-w-xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700  cursor-pointer"
                >
                    <X size={20} />
                </button>

                <div className="text-left mb-6">
                    <h2 className="text-xl font-semibold mb-2">Verify your email address</h2>
                    <p className="text-gray-600 text-sm">
                        We've sent a 5-digit verification code to your email {hiddenEmail}
                    </p>
                </div>

                <div className="flex justify-start gap-2 mb-4">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none text-lg"
                            autoFocus={index === 0}
                        />
                    ))}
                </div>

                <div className="text-left mb-6">
                    {canResend ? (
                        <button
                            onClick={handleResend}
                            className="text-blue-500 hover:underline text-sm cursor-pointer font-semibold"
                        >
                            Resend OTP
                        </button>
                    ) : (
                        <p className="text-sm text-gray-600 font-semibold">
                            Resend OTP in: <span className="font-medium">{formatTimer()}</span>
                        </p>
                    )}
                </div>

                <Button
                    onClick={handleVerify}
                    disabled={otp.join('').length !== 5 || isLoading}
                    className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] text-white border border-black hover:black-600 [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500"
                >
                    {isLoading ? <ButtonLoader/> : "Verify your email"}
                </Button>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Still having trouble? <a href="#" className="text-blue-500 hover:underline" onClick={() => window.open('mailto:support@example.com')}>Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationModal;