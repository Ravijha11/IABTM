import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/storage/authStore';
import getSocket from '@/lib/socket';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import ImageGallery from './3605 Feed/ImageGallery';

const MAX_IMAGES = 4;

const PostCreator: React.FC = () => {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setUploadError('Some files were invalid. Only images under 5MB are allowed.');
      setTimeout(() => setUploadError(null), 5000);
    }

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length === 0) {
      setUploadError(`Maximum ${MAX_IMAGES} images allowed.`);
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    setImages(prev => [...prev, ...filesToAdd]);
    setImagePreviews(prev => [...prev, ...filesToAdd.map(file => URL.createObjectURL(file))]);
  };

  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== idx);
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[idx]);
      return newPreviews;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && images.length === 0) return;
    
    setLoading(true);
    setUploadError(null);
    
    try {
      // 1. Upload images (if any)
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(img => formData.append('picture', img));
        
        const res = await axios.post('/api/posts/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        
        if (res.data.statusCode === 200) {
          imageUrls = res.data.data?.urls || [];
        } else {
          throw new Error(res.data.message || 'Failed to upload images');
        }
      }
      
      // 2. Create post
      const postRes = await axios.post('/api/posts/create', {
        content: text,
        pictures: imageUrls,
        hashtags: [], // Optionally parse hashtags from text
      }, { withCredentials: true });
      
      if (postRes.data.statusCode !== 201) {
        throw new Error(postRes.data.message || 'Failed to create post');
      }
      
      // 3. Emit real-time event
      getSocket().emit('feed:new_post', postRes.data.data);
      
      // 4. Invalidate queries to refresh the feed
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // 5. Reset form
      setText('');
      setImages([]);
      setImagePreviews([]);
      
      // 6. Clean up image preview URLs
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      
    } catch (err: any) {
      console.error('Error creating post:', err);
      setUploadError(err.response?.data?.message || err.message || 'Failed to create post');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
      <div className="flex items-start gap-3 md:gap-4">
        <img
          src={user?.profilePicture || '/default-profile.svg'}
          alt="Profile"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover bg-gray-200 flex-shrink-0"
        />
        <div className="flex-1 space-y-3 md:space-y-4">
          <textarea
            className="w-full rounded-lg px-3 md:px-4 py-2 md:py-3 bg-gray-50 border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
            placeholder={`What's on your mind, ${user?.name || 'User'}?`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            rows={3}
            style={{ minHeight: '80px' }}
          />
          
          {/* Error Message */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{uploadError}</p>
            </div>
          )}
          
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="relative">
              <ImageGallery images={imagePreviews} />
              <div className="absolute top-2 right-2 flex gap-1">
                {imagePreviews.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-70 transition-opacity text-sm"
                  >
                    ×
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleImageChange}
                disabled={loading || images.length >= MAX_IMAGES}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs md:text-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || images.length >= MAX_IMAGES}
              >
                📷 Add Photos ({images.length}/{MAX_IMAGES})
              </Button>
            </div>
            
            <Button
              type="submit"
              className="rounded-full bg-blue-600 text-white hover:bg-blue-700 px-4 md:px-6 py-2 text-sm md:text-base w-full sm:w-auto"
              disabled={loading || (!text.trim() && images.length === 0)}
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PostCreator; 