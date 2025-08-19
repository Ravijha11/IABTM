import { EditModalProps, MediaItem } from '@/types/CuratedMediaType';
import { useEffect, useState, useRef } from 'react';
import { currentSelfAttributeOptions, imagineSelfAttributeOptions } from '@/constants/selfWords';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ImageIcon } from 'lucide-react';

export const EditModal: React.FC<EditModalProps> = ({ media, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState<MediaItem>({
        _id: '',
        type: 'Video',
        title: '',
        description: '',
        thumbnail: '',
        videoLink: '',
        attributes: {
            currentSelf: [],
            imagineSelf: []
        }
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for attributes
    const [selectedCurrentAttributes, setSelectedCurrentAttributes] = useState<string[]>([]);
    const [selectedImagineAttributes, setSelectedImagineAttributes] = useState<string[]>([]);

    useEffect(() => {
        console.log('Media:', media);
        if (media) {
            setFormData({ ...media });

            // Initialize attribute selections from media
            if (media.attributes?.currentSelf) {
                setSelectedCurrentAttributes(media.attributes.currentSelf);
            }
            if (media.attributes?.imagineSelf) {
                setSelectedImagineAttributes(media.attributes.imagineSelf);
            }
        }

        // console.log("formdata", formData);
    }, [media]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log("formdata", formData);


        // Combine formData with selected attributes
        const updatedFormData = {
            ...formData,
            attributes: {
                currentSelf: selectedCurrentAttributes,
                imagineSelf: selectedImagineAttributes
            }
        };

        

        onSave(updatedFormData);
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
                console.log("uploadedUrl",uploadedUrl);
                setFormData(prev => ({
                    ...prev,
                    thumbnail: uploadedUrl
                }));
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
        } finally {
            setUploadingImage(false);
        }
    };

    const toggleCurrentAttribute = (value: string) => {
        setSelectedCurrentAttributes(prev =>
            prev.includes(value)
                ? prev.filter(item => item !== value)
                : [...prev, value]
        );
    };

    const toggleImagineAttribute = (value: string) => {
        setSelectedImagineAttributes(prev =>
            prev.includes(value)
                ? prev.filter(item => item !== value)
                : [...prev, value]
        );
    };

    return (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white border border-black p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Edit Media</h2>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left side - Form Fields */}
                        <div className="flex-1">
                            <div className="mb-4">
                                <label className="block mb-1">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1">Youtube Video Link</label>
                                <input
                                    type="text"
                                    name="videoLink"
                                    value={formData.videoLink}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>

                            {/* Thumbnail Upload Section */}
                            <div className="mb-4">
                                <label className="block mb-1">Thumbnail</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                />
                                <div
                                    className="w-full h-48 aspect-video bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer relative"
                                    onClick={handleImageClick}
                                >
                                    {uploadingImage && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                        </div>
                                    )}
                                    {formData.thumbnail ? (
                                        <div className="w-full h-full relative">
                                            <Image
                                                src={formData.thumbnail}
                                                alt="Thumbnail"
                                                layout="fill"
                                                objectFit="cover"
                                                className="rounded"
                                            />
                                        </div>
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Click to upload a new thumbnail</p>
                            </div>
                        </div>

                        {/* Right side - Attributes */}
                        <div className="flex-1">
                            <div className="mb-6">
                                <h3 className="font-medium mb-2">Current Self Attributes</h3>
                                <div className="flex flex-wrap gap-2">
                                    {currentSelfAttributeOptions.map((attribute) => (
                                        <button
                                            key={attribute.value}
                                            type="button"
                                            onClick={() => toggleCurrentAttribute(attribute.value)}
                                            className={`px-3 py-1 rounded-full cursor-pointer text-sm ${selectedCurrentAttributes.includes(attribute.value)
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {attribute.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-medium mb-2">Imagine Self Attributes</h3>
                                <div className="flex flex-wrap gap-2">
                                    {imagineSelfAttributeOptions.map((attribute) => (
                                        <button
                                            key={attribute.value}
                                            type="button"
                                            onClick={() => toggleImagineAttribute(attribute.value)}
                                            className={`px-3 py-1 rounded-full text-sm cursor-pointer ${selectedImagineAttributes.includes(attribute.value)
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {attribute.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};