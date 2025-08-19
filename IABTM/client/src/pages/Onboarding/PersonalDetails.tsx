"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/Onboarding/Progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Eye, EyeOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/storage/authStore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import EmailVerificationModal from "@/components/Onboarding/EmailVerificationModal";
import ButtonLoader from "@/components/ui/loader/ButtonloaderSpinner";
import PathLoaderSpinner from '@/components/ui/loader/PathLoaderSpinner';

export default function PersonalDetails() {
    const router = useRouter();
    const { setRedirectionStep, setUser, clearOnboarding, setUserName, setProfileName, setUserEmail, setPhoneNumber, setPassword, setProfilePicture, personalDetails, attributes } = useAuthStore();


    const authStore = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);  // for image uploading separately
    const [showPassword, setShowPassword] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [isCreateAccountRoute, setIsCreateAccountRoute] = useState(false);

    const [profileData, setProfileData] = useState({
        name: "",
        profileName: "",
        email: "",
        phoneNumber: "",
        password: "",
    });

    const [profileImage, setProfileImage] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            setIsCreateAccountRoute(path.includes('create-account'));
        }
    }, []);

    useEffect(() => {
        if (personalDetails) {
            setProfileData({
                name: personalDetails.userName || "",
                profileName: personalDetails.profileName || "",
                email: personalDetails.userEmail || "",
                phoneNumber: personalDetails.phoneNumber || "",
                password: personalDetails.password || "",
            });
        }
        if (personalDetails?.profilePicture) {
            setProfileImage(personalDetails.profilePicture);
        }
    }, [personalDetails]);

    useEffect(() => {
        if (authStore.user?.curatedPaths?.length) {
            setRedirectionStep(5);
            // clearOnboarding();
        }
    }, [authStore.user]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const uploadToCloudinary = async (file: File) => {
        const userId = "guest"; // userId ||
        try {
            const { data: signed } = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/shared/signedUrl/${userId}`
            );

            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", signed.data.api_key);
            formData.append("timestamp", signed.data.timestamp.toString());
            formData.append("signature", signed.data.signature);
            formData.append("folder", signed.data.folder);

            const uploadRes = await axios.post(signed.data.url, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            return uploadRes.data.secure_url as string;
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            toast.error("Failed to upload image. Please try again.");
            return null;
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const uploadedUrl = await uploadToCloudinary(file);
            if (uploadedUrl) {
                setProfileImage(uploadedUrl);
            }
        } finally {
            setUploadingImage(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleBack = () => {
        if (isCreateAccountRoute) {
            router.push('/sign-in');
        } else {
            setRedirectionStep(3);
        }
    };

    const handleSave = async () => {
        if (!profileData.name || !profileData.profileName || !profileData.email || !profileData.phoneNumber || !profileData.password) {
            toast.error("Please fill in all fields");
            return;
        }

        if (!profileImage) {
            toast.error("Please upload a profile picture");
            return;
        }
        if (profileData.password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(profileData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }
        if (!/^\d{10}$/.test(profileData.phoneNumber)) {
            toast.error("Please enter a valid phone number (10 digits)");
            return;
        }

        setIsLoading(true);

        setUserName(profileData.name);
        setProfileName(profileData.profileName);
        setUserEmail(profileData.email);
        setPhoneNumber(profileData.phoneNumber);
        setPassword(profileData.password);
        setProfilePicture(profileImage);

        const allUserData = {
            profile: personalDetails,
            attributes: attributes,
        };

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/register-email`, {
                email: profileData.email,
                password: profileData.password,
                name: profileData.name,
                profileName: profileData.profileName,
                phoneNumber: profileData.phoneNumber,
                profilePicture: profileImage,
                attributes: allUserData?.attributes,
                onboarding: !!allUserData?.attributes,
                role: "user"
            });

            const { statusCode, message } = response.data;

            if (statusCode === 200) {
                toast.success(message || 'Verification email sent successfully!');
                setShowVerificationModal(true);
            } else {
                toast.error(message || 'Failed to register');
            }
        } catch (error) {
            console.error('Register user error:', error);
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data?.message || 'An error occurred');
            } else {
                toast.error('Unable to connect to server');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmail = async (otp: string) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/auth/verify/email`, {
                email: profileData.email,
                otp: otp
            }, {
                withCredentials: true
            });

            const { statusCode, message, data } = response.data;

            if (statusCode === 201 || statusCode === 200) {
                toast.success(message || 'User verified and logged in successfully');
                setShowVerificationModal(false);

                // Set user data in store
                setUser(data);

                // Always call personalized path API after verification
                try {
                    const pathResponse = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/create-personalised-path`, {
                        attributes
                    }, {
                        withCredentials: true
                    });

                    const { statusCode: pathStatus, message: pathMessage } = pathResponse.data;
                    if (pathStatus === 200) {
                        toast.success(pathMessage || 'Personalised Path created successfully');
                    } else {
                        toast.error(pathMessage || 'Failed to create Personalised Path');
                    }
                } catch (error) {
                    console.error('Create personalised path error:', error);
                    toast.error('Failed to create personalised path');
                }

                // Fetch updated user profile
                try {
                    const userDataResponse = await axios.get(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/me/profile`,
                        { withCredentials: true }
                    );
                    if (userDataResponse.data.statusCode === 200) {
                        setUser(userDataResponse.data.data);
                    }
                } catch (error) {
                    console.error('Fetch user profile error:', error);
                }

                // Redirect to dashboard/curated media page
                router.push('/onboarding');
            } else {
                toast.error(message || 'Failed to verify');
            }
        } catch (error) {
            console.error('Verify email error:', error);
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data?.message || 'An error occurred');
            } else {
                toast.error('Unable to connect to server');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-white relative">
            <ToastContainer />
            {isLoading && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-50 z-50">
                    <ButtonLoader />
                </div>
            )}

            <div className="max-w-5xl ml-4 lg:ml-24 px-4 pt-8">
                {!isCreateAccountRoute && (
                    <Progress value={80} className="mb-8" fractionValue="4/5" />
                )}
                <div className="mb-12 w-full sm:w-10/12">
                    <p className="text-sm text-muted-foreground">
                        {isCreateAccountRoute ? "Create your account" : "Starting your paths"}
                    </p>
                    <h1 className="text-xl sm:text-2xl font-semibold mb-3">Tell us about yourself</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Let's get know each other better and set up your account
                    </p>
                </div>
            </div>

            <div className="space-y-8 mb-5 flex gap-20 ml-4 lg:ml-24">
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                    />
                    <div
                        className="border-2 border-dashed border-[#33CCFF] opacity-75 rounded-full w-44 h-44 mx-auto flex items-center justify-center cursor-pointer hover:border-gray-300 overflow-hidden relative"
                        onClick={handleImageClick}
                    >
                        {uploadingImage && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10 ">
                                <ButtonLoader border="black" />
                            </div>
                        )}
                        {profileImage && !uploadingImage ? (   // <== Only show image if NOT uploading
                            <div className="w-full h-full relative">
                                <Image
                                    src={profileImage}
                                    alt="Profile"
                                    layout="fill"
                                    objectFit="cover"
                                    loading="eager" // <== Important to avoid flicker
                                />
                            </div>
                        ) : !uploadingImage && (  // <== Only show ImageIcon if NOT uploading
                            <ImageIcon className="w-8 h-8 text-[#33CCFF] opacity-75" />
                        )}
                    </div>

                    <p className="text-center mt-4 text-sm text-[#2E2E2E]">
                        Drag&Drop your photo<br />or select on the device
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Inputs */}
                    <div className="space-y-2">
                        <Label>Your name</Label>
                        <Input type="text" name="name" value={profileData.name} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Profile name</Label>
                        <Input type="text" name="profileName" value={profileData.profileName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Your email</Label>
                        <Input type="email" name="email" value={profileData.email} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Your phone number</Label>
                        <Input type="tel" name="phoneNumber" value={profileData.phoneNumber} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2 relative">
                        <Label>Password</Label>
                        <Input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={profileData.password}
                            onChange={handleInputChange}
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3 -bottom-1.5 transform -translate-y-1/2 flex items-center justify-center cursor-pointer"
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </button>

                    </div>
                </div>
            </div>

            <div className="relative w-full pb-8 flex flex-col sm:flex-row sm:items-center sm:justify-center">
                <div className="flex justify-center gap-4">
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] bg-white text-black border border-[#2E2E2E] hover:bg-gray-100 hover:text-black [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="outline"
                        disabled={isLoading}
                        className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] bg-black text-white border border-solid hover:bg-gray-800 hover:text-white [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500"
                    >
                        {isLoading ? <ButtonLoader /> : "Continue"}
                    </Button>
                </div>
            </div>

            {showVerificationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <EmailVerificationModal
                        email={profileData.email}
                        onVerify={handleVerifyEmail}
                        onClose={() => setShowVerificationModal(false)}
                        isLoading={isLoading}
                    />
                </div>

            )}
        </main>
    );
}
