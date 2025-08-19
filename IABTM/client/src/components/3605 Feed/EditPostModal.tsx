import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Post } from '@/types/PostType';

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedPost: Post) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, isOpen, onClose, onUpdate }) => {
  const [content, setContent] = useState(post.content || '');
  const [pictures, setPictures] = useState<string[]>(post.pictures || []);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      setContent(post.content || '');
      setPictures(post.pictures || []);
      setUploadedImages([]);
    }
  }, [isOpen, post]);

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    if (imageFiles.length + pictures.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploadedImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setPictures(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    setIsLoading(true);

    try {
      // Upload new images if any
      let newImageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        const formData = new FormData();
        uploadedImages.forEach((file, index) => {
          formData.append('picture', file);
        });

        const uploadResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/upload`,
          formData,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (uploadResponse.data.statusCode === 200) {
          newImageUrls = uploadResponse.data.data.urls;
        }
      }

      // Combine existing and new images
      const allImages = [...pictures, ...newImageUrls];

      // Update the post
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/${post._id}`,
        {
          content: content.trim(),
          pictures: allImages,
        },
        { withCredentials: true }
      );

      if (response.data.statusCode === 200) {
        const updatedPost = response.data.data;
        onUpdate(updatedPost);
        toast.success('Post updated successfully');
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to update post');
      }
    } catch (error: any) {
      console.error('Error updating post:', error);
      if (error.response?.status === 403) {
        toast.error('You can only edit your own posts');
      } else if (error.response?.status === 404) {
        toast.error('Post not found');
      } else {
        toast.error('Error updating post');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="What's on your mind?"
              disabled={isLoading}
            />
          </div>

          {/* Existing Images */}
          {pictures.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {pictures.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index, true)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          {uploadedImages.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index, false)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading || pictures.length + uploadedImages.length >= 5}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum 5 images allowed. Current: {pictures.length + uploadedImages.length}/5
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
              disabled={isLoading || !content.trim()}
            >
              {isLoading ? 'Updating...' : 'Update Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal; 