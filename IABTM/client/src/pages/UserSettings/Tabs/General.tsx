import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/storage/authStore'
import { Label } from '@radix-ui/react-label'
import React, { useState, useRef, useEffect } from 'react'
import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import { toast } from 'react-toastify'
import { User } from '@/types/userType'

interface FormData {
    name: string;
    profileName: string;
    email: string;
    phoneNumber: string;
    profilePicture: string;
}

function General() {
    const { user, setUser } = useAuthStore()
    const [formData, setFormData] = useState<FormData>({
        name: '',
        profileName: '',
        email: '',
        phoneNumber: '',
        profilePicture: ''
    })
    const [uploadingImage, setUploadingImage] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Pre-fill form data from user store
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                profileName: user.profileName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                profilePicture: user.profilePicture || ''
            })
        }
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleImageClick = () => {
        fileInputRef.current?.click()
    }

    const uploadToCloudinary = async (file: File) => {
        const userId = user?._id || "guest"
        try {
            const { data: signed } = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/shared/signedUrl/${userId}`
            )

            const formDataUpload = new FormData()
            formDataUpload.append("file", file)
            formDataUpload.append("api_key", signed.data.api_key)
            formDataUpload.append("timestamp", signed.data.timestamp.toString())
            formDataUpload.append("signature", signed.data.signature)
            formDataUpload.append("folder", signed.data.folder)

            const uploadRes = await axios.post(signed.data.url, formDataUpload, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            return uploadRes.data.secure_url as string
        } catch (error) {
            console.error("Cloudinary upload error:", error)
            toast.error("Failed to upload image. Please try again.")
            return null
        }
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingImage(true)
        try {
            const uploadedUrl = await uploadToCloudinary(file)
            if (uploadedUrl) {
                console.log("uploadedUrl", uploadedUrl)
                setFormData(prev => ({
                    ...prev,
                    profilePicture: uploadedUrl
                }))
                toast.success("Profile picture uploaded successfully!")
            }
        } catch (error) {
            console.error("Error uploading image:", error)
            toast.error("Failed to upload image")
        } finally {
            setUploadingImage(false)
        }
    }

    const handleSave = async () => {
        if (!user?._id) {
            toast.error("User not found")
            return
        }

        setIsLoading(true)
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/me/update-profile`,
                {
                    name: formData.name,
                    profileName: formData.profileName,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    profilePicture: formData.profilePicture
                },
                {
                  withCredentials: true,
                }
            )

            console.log("Update profile response:", response.data)

            if (response.data.statusCode == 200) {
                // Update the user in the auth store
                setUser(response.data.data)
                toast.success("Profile updated successfully!")
            } else {
                toast.error(response.data.message || "Failed to update profile")
            }
        } catch (error: any) {
            console.error("Error updating profile:", error)
            toast.error(error.response?.data?.message || "Failed to update profile")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='max-w-lg'>
            {/* Profile Picture Upload Section */}
            <div className="mb-6">
                <Label className="text-[#2E2E2E] mt-4 font-medium mb-2 block">Profile Picture</Label>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                />
                <div
                    className="w-24 h-24 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden"
                    onClick={handleImageClick}
                >
                    {uploadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {formData.profilePicture ? (
                        <div className="w-full h-full relative">
                            <Image
                                src={formData.profilePicture}
                                alt="Profile Picture"
                                layout="fill"
                                objectFit="cover"
                                className="rounded-full"
                            />
                        </div>
                    ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Click to upload a new profile picture</p>
            </div>

            <div className="space-y-4 mt-4">
                <div className="space-y-2">
                    <Label className="text-[#2E2E2E] font-medium">Name</Label>
                    <Input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        className='font-light p-2' 
                    />
                </div>
                
                <div className="space-y-2">
                    <Label className="text-[#2E2E2E] font-medium">Profile name</Label>
                    <Input 
                        type="text"
                        name="profileName"
                        value={formData.profileName}
                        onChange={handleChange}
                        placeholder="Enter your profile name"
                        className='font-light p-2' 
                    />
                </div>
                
                <div className="space-y-2">
                    <Label className="text-[#2E2E2E] font-medium">Email</Label>
                    <Input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className='font-light p-2' 
                    />
                </div>
                
                <div className="space-y-2">
                    <Label className="text-[#2E2E2E] font-medium">Phone</Label>
                    <Input 
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        className='font-light p-2' 
                    />
                </div>
            </div>
            
            <div className="flex gap-4 py-8">
                <Button
                    onClick={handleSave}
                    disabled={isLoading || uploadingImage}
                    variant="outline"
                    className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] bg-black text-white border border-solid hover:bg-gray-800 hover:text-white [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Saving...
                        </div>
                    ) : (
                        'Apply Changes'
                    )}
                </Button>
            </div>
        </div>
    )
}

export default General