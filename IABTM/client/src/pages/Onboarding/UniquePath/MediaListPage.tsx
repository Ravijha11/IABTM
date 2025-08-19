"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import MediaCard from '@/components/Onboarding/UniquePath/MediaCard';
import SectionHeader from '@/components/Onboarding/UniquePath/SectionHeader';
import { useAuthStore } from '@/storage/authStore';
import { EditModal } from '@/components/admin/curated-media/EditMediaModal';
import { FilmMedia } from '@/types/userType';

interface MediaListPageProps {
    featuredMedia?: FilmMedia[];
    pathTitle?: string;
    betterThrough?: string;
    isAdmin?: boolean;
    onMediaClick?: (media: FilmMedia) => void;
}

// Skeleton component for loading state
const MediaCardSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="flex gap-4">
            <div className="w-24 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
        </div>
    </div>
);

export default function MediaListPage({
    featuredMedia: propsFeaturedMedia,
    pathTitle,
    betterThrough,
    isAdmin = false,
    onMediaClick
}: MediaListPageProps) {
    const { mediaStatuses, setMediaStatuses } = useAuthStore();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingStatuses, setIsLoadingStatuses] = useState<boolean>(false);
    const [featuredMedia, setFeaturedMedia] = useState<FilmMedia[]>([]);
    const [additionalMedia, setAdditionalMedia] = useState<FilmMedia[]>([]);
    const [editingMedia, setEditingMedia] = useState<FilmMedia | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    useEffect(() => {
        const updateAuthMediaStatuses = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/curated-paths/media-progress/all`, {
                    withCredentials: true
                });
                const { statusCode, data } = response.data;

                if (statusCode === 200) {
                    const statuses: Record<string, boolean> = {};

                    data.forEach((item: { mediaId: string; isViewed: boolean }) => {
                        statuses[item.mediaId] = item.isViewed;
                    });

                    setMediaStatuses(statuses);
                } else {
                    console.error('Failed to load media data');
                }
            } catch (error) {
                console.error('Error fetching media data:', error);
            }
        };

        updateAuthMediaStatuses();
    }, [setMediaStatuses]);


    // Check if we're on the admin page
    const isAdminPage = typeof window !== 'undefined' &&
        window.location.href.includes("admin") &&
        window.location.pathname.includes('admin');

    const showAdminControls = isAdmin || isAdminPage;
    const isDashboard = typeof window !== 'undefined' && window.location.href.includes("dashboard");

    // Load media data
    const loadMediaData = async () => {
        setIsLoading(true);

        try {
            if (showAdminControls) {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/superAdmin/media/films/get`);
                const { statusCode, data, message } = response.data;

                if (statusCode === 200) {
                    const media = data || [];
                    setFeaturedMedia(media);
                    setAdditionalMedia(media);
                } else {
                    toast.error(message || 'Failed to load media data');
                }
            } else {
                setFeaturedMedia([]);
            }
        } catch (error) {
            console.error('Load media error:', error);
            toast.error('Unable to load media');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (propsFeaturedMedia) {
            setFeaturedMedia(propsFeaturedMedia);
            setIsLoading(false);
        } else {
            loadMediaData();
        }
    }, [propsFeaturedMedia]);

    const handleDeleteMedia = async (id: string) => {
        if (!confirm('Are you sure you want to delete this media?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/superAdmin/media/films/delete/${id}`
            );

            const { statusCode, message } = response.data;

            if (statusCode === 200) {
                toast.success(message || 'Media deleted successfully');
                setFeaturedMedia(prev => prev.filter(item => item._id !== id));
                setAdditionalMedia(prev => prev.filter(item => item._id !== id));
            } else {
                toast.error(message || 'Failed to delete media');
            }
        } catch (error) {
            console.error('Delete media error:', error);
            toast.error('Unable to delete media');
        }
    };

    const handleEditClick = (media: FilmMedia) => {
        setEditingMedia(media);
        setIsModalOpen(true);
    };

    const handleMediaClick = (media: FilmMedia) => {
        if (onMediaClick) {
            onMediaClick(media);
        }
    };

    const handleUpdateMedia = async (updatedMedia: FilmMedia) => {
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/superAdmin/media/films/update/${updatedMedia._id}`,
                updatedMedia
            );

            const { statusCode, message } = response.data;

            if (statusCode === 200) {
                toast.success(message || 'Media updated successfully');
                setFeaturedMedia(prev =>
                    prev.map(item => item._id === updatedMedia._id ? updatedMedia : item)
                );
                setAdditionalMedia(prev =>
                    prev.map(item => item._id === updatedMedia._id ? updatedMedia : item)
                );
                setIsModalOpen(false);
                setEditingMedia(null);
            } else {
                toast.error(message || 'Failed to update media');
            }
        } catch (error) {
            console.error('Update media error:', error);
            toast.error('Unable to update media');
        }
    };

    const renderHeader = () => {
        if (showAdminControls) {
            return <SectionHeader title="Admin Media Management" />;
        }

        if (isDashboard) return null;

        return (
            <SectionHeader title="Personal curated media list based on information from your attributes and media preferences" />
        );
    };

    // if (isLoading || isLoadingStatuses) {
    //     return (
    //         <div className={`container mx-auto px-4 ${isDashboard ? `py-0` : `py-6`}`}>
    //             {renderHeader()}
    //             <div className="space-y-4">
    //                 {[1, 2, 3].map((i) => (
    //                     <MediaCardSkeleton key={i} />
    //                 ))}
    //             </div>
    //             <div className="flex items-center justify-center py-4">
    //                 <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
    //                 <span className="ml-2 text-sm text-gray-600">
    //                     {isLoading ? 'Loading media...' : 'Loading viewing progress...'}
    //                 </span>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className={`container mx-auto px-4 ${isDashboard ? `py-0` : `py-6`}`}>
            {renderHeader()}

            <div className="space-y-2">
                {featuredMedia.map((item) => (
                    <MediaCard
                        key={item._id}
                        id={item._id}
                        type={item.type || 'Video'}
                        title={item.title}
                        description={item.description}
                        thumbnail={item.thumbnail}
                        isViewed={mediaStatuses[item._id]}
                        compact={false}
                        onClick={() => handleMediaClick(item)}
                        onDelete={showAdminControls ? () => handleDeleteMedia(item._id) : undefined}
                        onEdit={showAdminControls ? () => handleEditClick(item) : undefined}
                    />
                ))}
            </div>

            {!showAdminControls && additionalMedia.length > 0 && (
                <div className="mt-8 mb-4">
                    <SectionHeader title="Additional open access information for you" />
                    <div className="space-y-1">
                        {additionalMedia.map((item) => (
                            <MediaCard
                                key={item._id}
                                id={item._id}
                                type={item.type || 'Video'}
                                title={item.title}
                                description={item.description}
                                thumbnail={item.thumbnail}
                                compact={true}
                                onClick={() => handleMediaClick(item)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showAdminControls && editingMedia && (
                <EditModal
                    media={editingMedia}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingMedia(null);
                    }}
                    onSave={handleUpdateMedia}
                />
            )}
        </div>
    );
}