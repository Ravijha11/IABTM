import React, { useState, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { currentSelfAttributeOptions, imagineSelfAttributeOptions } from "@/constants/selfWords";
import axios from 'axios';
import { toast } from 'react-toastify';

// Define types for the component
type MediaType = 'Music' | 'Film' | '';

interface MediaFormProps {
    onSave?: (formData: MediaFormData) => void;
    onCancel?: () => void;
}

export interface MediaFormData {
    type: MediaType;
    title?: string;
    artist?: string;
    videoLink?: string;
    description?: string;
    availableInGlobalPlaylist?: boolean;
    currentSelfAttributes: string[];
    imaginedSelfAttributes: string[];
    trackFile?: File | null;
    coverImage?: File | null;
    coverImageUrl?: string; // Add URL for uploaded cover image
    trackFileUrl?: string;  // Add URL for uploaded track file
}

const MediaForm: React.FC<MediaFormProps> = ({ onSave, onCancel }) => {
    const router = useRouter();

    // Initialize form state
    const [formData, setFormData] = useState<MediaFormData>({
        type: '',
        title: '',
        artist: '',
        videoLink: '',
        description: '',
        availableInGlobalPlaylist: false,
        currentSelfAttributes: [],
        imaginedSelfAttributes: [],
        trackFile: null,
        coverImage: null,
        coverImageUrl: '',
        trackFileUrl: '',
    });

    // Add loading states for uploads
    const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
    const [uploadingTrackFile, setUploadingTrackFile] = useState(false);

    // Handle form field changes
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle checkbox changes
    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    // Handle attribute checkbox changes
    const handleAttributeChange = (type: 'currentSelfAttributes' | 'imaginedSelfAttributes', value: string) => {
        setFormData((prev) => {
            const currentValues = [...prev[type]];
            const index = currentValues.indexOf(value);

            if (index === -1) {
                currentValues.push(value);
            } else {
                currentValues.splice(index, 1);
            }

            return { ...prev, [type]: currentValues };
        });
    };

    // Cloudinary upload function (copied from PersonalDetails)
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
            toast.error("Failed to upload file. Please try again.");
            return null;
        }
    };

    // Handle file uploads with Cloudinary integration
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, fieldName: 'trackFile' | 'coverImage') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Set local file for preview
        setFormData((prev) => ({ ...prev, [fieldName]: file }));

        // Set loading state
        if (fieldName === 'coverImage') {
            setUploadingCoverImage(true);
        } else {
            setUploadingTrackFile(true);
        }

        try {
            const uploadedUrl = await uploadToCloudinary(file);
            if (uploadedUrl) {
                setFormData(prev => ({
                    ...prev,
                    [fieldName === 'coverImage' ? 'coverImageUrl' : 'trackFileUrl']: uploadedUrl
                }));
            }
        } finally {
            // Reset loading state
            if (fieldName === 'coverImage') {
                setUploadingCoverImage(false);
            } else {
                setUploadingTrackFile(false);
            }
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSave) {
            onSave(formData);
        }
    };

    // Handle cancel button
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            router.back();
        }
    };

    return (
        <div className="max-w-4xl ">
            <h1 className="text-xl font-semibold ">Add new</h1>

            <div className="flex">
                {/* Form Section */}
                <div className="flex-1 p-6 pt-2">
                    <form onSubmit={handleSubmit}>
                        {/* Media Type Selection */}
                        <div className="mb-4">
                            <label htmlFor="type" className="block text-sm text-gray-600 mb-1">Type</label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded p-2"
                                required
                            >
                                <option value="" disabled>Select type</option>
                                <option value="Music">Music</option>
                                <option value="Film">Film</option>
                            </select>
                        </div>

                        {/* Dynamic Fields Based on Type */}
                        {formData.type === 'Music' && (
                            <>
                                {/* Global Playlist Toggle */}
                                <div className="mb-4 flex items-center">
                                    <label htmlFor="availableInGlobalPlaylist" className="flex-grow text-sm text-gray-600">
                                        Available in global playlist
                                    </label>
                                    <div className="relative inline-block w-10 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            id="availableInGlobalPlaylist"
                                            name="availableInGlobalPlaylist"
                                            checked={formData.availableInGlobalPlaylist}
                                            onChange={handleCheckboxChange}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                        />
                                        <label
                                            htmlFor="availableInGlobalPlaylist"
                                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.availableInGlobalPlaylist ? 'bg-blue-500' : 'bg-gray-300'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Artist Field */}
                                <div className="mb-4">
                                    <label htmlFor="artist" className="block text-sm text-gray-600 mb-1">Artist</label>
                                    <input
                                        type="text"
                                        id="artist"
                                        name="artist"
                                        value={formData.artist}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded p-2"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* Common Fields for Both Types */}
                        {(formData.type === 'Film' || formData.type === 'Music') && (
                            <>
                                {/* Title Field */}
                                <div className="mb-4">
                                    <label htmlFor="title" className="block text-sm text-gray-600 mb-1">
                                        {formData.type === 'Film' ? 'Title' : 'Title'}
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded p-2"
                                        required
                                    />
                                </div>

                                {/* Current Self Attributes */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">
                                        Attributes of Current Self
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentSelfAttributeOptions.map((option) => (
                                            <div key={`current-${option.value}`} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`current-${option.value}`}
                                                    checked={formData.currentSelfAttributes.includes(option.value)}
                                                    onChange={() => handleAttributeChange('currentSelfAttributes', option.value)}
                                                    className="mr-2"
                                                />
                                                <label htmlFor={`current-${option.value}`} className="text-sm">
                                                    {option.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Imagined Self Attributes */}
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-2">
                                        Attributes of Imagined Self
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {imagineSelfAttributeOptions.map((option) => (
                                            <div key={`imagined-${option.value}`} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`imagined-${option.value}`}
                                                    checked={formData.imaginedSelfAttributes.includes(option.value)}
                                                    onChange={() => handleAttributeChange('imaginedSelfAttributes', option.value)}
                                                    className="mr-2"
                                                />
                                                <label htmlFor={`imagined-${option.value}`} className="text-sm">
                                                    {option.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Film-specific Fields */}
                        {formData.type === 'Film' && (
                            <>
                                {/* Video Link */}
                                <div className="mb-4">
                                    <label htmlFor="videoLink" className="block text-sm text-gray-600 mb-1">Video link</label>
                                    <input
                                        type="url"
                                        id="videoLink"
                                        name="videoLink"
                                        value={formData.videoLink}
                                        onChange={handleChange}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full border border-gray-300 rounded p-2"
                                    />
                                </div>

                                {/* Description */}
                                <div className="mb-4">
                                    <label htmlFor="description" className="block text-sm text-gray-600 mb-1">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full border border-gray-300 rounded p-2"
                                    />
                                </div>
                            </>
                        )}

                        {/* Media Upload Fields */}
                        {formData.type === 'Music' && (
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('trackFileUpload')?.click()}
                                    className="w-full border border-dashed border-blue-500 rounded p-2 text-blue-500 text-center"
                                    disabled={uploadingTrackFile}
                                >
                                    {uploadingTrackFile ? "Uploading..." : "Upload track file (.mp3, .wav, .ogg)"}
                                </button>
                                <input
                                    type="file"
                                    id="trackFileUpload"
                                    onChange={(e) => handleFileChange(e, 'trackFile')}
                                    accept=".mp3,.wav,.ogg"
                                    className="hidden"
                                />
                                {formData.trackFile && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {uploadingTrackFile ? "Uploading..." : `Selected: ${formData.trackFile.name}`}
                                        {formData.trackFileUrl && " (Uploaded)"}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Form Actions */}
                        {formData.type && (
                            <div className="flex space-x-2 mt-6">
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer uppercase text-sm font-medium"
                                    disabled={uploadingCoverImage || uploadingTrackFile}
                                >
                                    {(uploadingCoverImage || uploadingTrackFile) ? "Uploading..." : "Save"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="border border-gray-300 px-4 py-2 rounded uppercase text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Thumbnail Preview Section  - Clickable for upload */}
                {(formData.type === 'Music' || formData.type === 'Film') && (
                    <div className={`${formData.type === 'Film' ? 'w-96' : 'w-80'} p-6`}>
                        <h2 className="text-sm font-medium text-gray-600 mb-3">
                            {formData.type === 'Film' ? 'Thumbnail' : 'Cover Image'}
                        </h2>
                        <div
                            className={`${formData.type === 'Film'
                                ? 'w-full h-48 aspect-video' // 16:9 landscape ratio for film thumbnails
                                : 'w-64 h-64 aspect-square'} // Square ratio for music cover images 
                bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer relative`}
                            onClick={() => !uploadingCoverImage && document.getElementById('coverImageUpload')?.click()}
                        >
                            {uploadingCoverImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                </div>
                            )}
                            {formData.coverImage && !uploadingCoverImage ? (
                                <img
                                    src={URL.createObjectURL(formData.coverImage)}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded"
                                />
                            ) : !uploadingCoverImage && (
                                <div className="text-blue-500 text-center">
                                    <p>Upload {formData.type === 'Film' ? 'thumbnail' : 'cover image'}</p>
                                    <p className="text-xs text-gray-400">(.jpg, .jpeg, .png)</p>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            id="coverImageUpload"
                            onChange={(e) => handleFileChange(e, 'coverImage')}
                            accept=".jpg,.jpeg,.png"
                            className="hidden"
                            disabled={uploadingCoverImage}
                        />
                        {formData.coverImageUrl && (
                            <p className="text-xs text-green-600 mt-1">Image uploaded successfully</p>
                        )}
                    </div>
                )}

            </div>

            {/* CSS for toggle switch */}
            <style jsx>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #3b82f6;
        }
        .toggle-label {
          transition: background-color 0.2s ease;
        }
        .toggle-checkbox {
          right: 0;
          z-index: 1;
          transition: all 0.2s ease;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #3b82f6;
        }
      `}</style>
        </div>
    );
};

export default MediaForm;