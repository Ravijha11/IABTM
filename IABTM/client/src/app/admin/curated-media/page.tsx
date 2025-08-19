"use client";

import { useState } from "react";
import { TabNavigation } from "@/components/Onboarding/UniquePath/TabNavigation";
import CuratedMediaContent from "@/pages/Onboarding/UniquePath/MediaListPage";
import ExpertsContent from "@/pages/Onboarding/UniquePath/ExpertsList";
import MediaForm, { MediaFormData } from '@/components/admin/curated-media/MediaForm';
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import ButtonLoader from "@/components/ui/loader/ButtonloaderSpinner";

export default function CuratedMedia() {
    const [showMediaForm, setShowMediaForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const tabs = [
        {
            id: "film",
            label: "Film",
            icon: "/Tabs/film.svg",
            component: <CuratedMediaContent />
        },
        {
            id: "music",
            label: "Music",
            icon: "/Tabs/users.svg",
            component: <ExpertsContent />
        }
    ];

    const handleAddNew = () => {
        setShowMediaForm(true);
    };

    const handleSave = async (formData: MediaFormData) => {
        // Basic validation
        if (!formData.title) {
            toast.error("Title is required");
            return;
        }

        setIsLoading(true);

        try {
            // Format the data according to the backend model structure
            let requestData;

            if (formData.type === 'Film') {
                // Validate film specific fields
                if (!formData.videoLink) {
                    toast.error("Video link is required");
                    setIsLoading(false);
                    return;
                }
                
                if (!formData.description) {
                    toast.error("Description is required");
                    setIsLoading(false);
                    return;
                }

                // Format data for film media
                requestData = {
                    title: formData.title,
                    attributes: {
                        currentSelf: formData.currentSelfAttributes,
                        imagineSelf: formData.imaginedSelfAttributes
                    },
                    videoLink: formData.videoLink,
                    description: formData.description,
                    thumbnail: formData.coverImageUrl // Use the cloudinary URL
                };

                // Call the film API
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/superAdmin/media/films/create`,
                    requestData
                );

                const { statusCode, message } = response.data;

                if (statusCode === 201) {
                    toast.success(message || 'Film media created successfully');
                    setShowMediaForm(false);
                    // You might want to refresh the list here
                } else {
                    toast.error(message || 'Failed to create film media');
                }
            } else if (formData.type === 'Music') {
                // Music upload logic would go here
                // Since the Music model wasn't provided, this is a placeholder
                toast.info("Music upload functionality will be implemented soon");
                
                // Example of what music upload might look like:
                /*
                // Validate music specific fields
                if (!formData.artist) {
                    toast.error("Artist name is required");
                    setIsLoading(false);
                    return;
                }
                
                if (!formData.trackFileUrl) {
                    toast.error("Track file is required");
                    setIsLoading(false);
                    return;
                }

                // Format data for music media
                requestData = {
                    title: formData.title,
                    artist: formData.artist,
                    attributes: {
                        currentSelf: formData.currentSelfAttributes,
                        imagineSelf: formData.imaginedSelfAttributes
                    },
                    trackUrl: formData.trackFileUrl,
                    coverImage: formData.coverImageUrl,
                    availableInGlobalPlaylist: formData.availableInGlobalPlaylist
                };

                // Call the music API
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/superAdmin/media/music/create`,
                    requestData,
                    { withCredentials: true }
                );

                const { statusCode, message } = response.data;

                if (statusCode === 201) {
                    toast.success(message || 'Music media created successfully');
                    setShowMediaForm(false);
                } else {
                    toast.error(message || 'Failed to create music media');
                }
                */
            }

        } catch (error) {
            console.error('Media upload error:', error);
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data?.message || 'An error occurred');
            } else {
                toast.error('Unable to connect to server');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setShowMediaForm(false);
    };

    return (
        <main className="min-h-screen bg-white relative">
            <ToastContainer />
            {isLoading && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-50 z-50">
                    <ButtonLoader />
                </div>
            )}
            
            <div className="ml-4 lg:ml-24 px-4 pt-8">
                <div className="flex items-center justify-between mb-6">
                    {!showMediaForm && (
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Curated media</h2>

                            <button
                                onClick={handleAddNew}
                                className="bg-[#4f6af4] hover:bg-[#3e55c7] ml-10 text-white cursor-pointer font-medium py-2 px-4 rounded"
                            >
                                + ADD NEW
                            </button>
                        </div>

                    )}

                    {showMediaForm && (
                        <Button onClick={() => setShowMediaForm(false)} className="cursor-pointer">Back</Button>
                    )}
                </div>

                <div className="ml-0 lg:ml-0 px-0">
                    {showMediaForm ? (
                        <MediaForm onSave={handleSave} onCancel={handleCancel} />
                    ) : (
                        <TabNavigation tabs={tabs} />
                    )}
                </div>
            </div>
        </main>
    );
}