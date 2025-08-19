import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/storage/authStore';
import { toast } from 'react-toastify';
import axios from 'axios';

interface PostMenuProps {
  postId: string;
  postedBy: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

const PostMenu: React.FC<PostMenuProps> = ({ postId, postedBy, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  // Check if current user is the post author
  const isAuthor = user?._id === postedBy._id;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/${postId}`,
        { withCredentials: true }
      );

      if (response.data.statusCode === 200) {
        toast.success('Post deleted successfully');
        onDelete();
      } else {
        toast.error(response.data.message || 'Failed to delete post');
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      if (error.response?.status === 403) {
        toast.error('You can only delete your own posts');
      } else if (error.response?.status === 404) {
        toast.error('Post not found');
      } else {
        toast.error('Error deleting post');
      }
    }
    setShowDeleteConfirm(false);
    setIsOpen(false);
  };

  if (!isAuthor) {
    return null; // Don't show menu for non-authors
  }

  return (
    <>
      {/* Three-dot menu button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          aria-label="Post options"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-10 right-0 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] animate-in fade-in-0 zoom-in-95">
            <button
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Post
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                setShowDeleteConfirm(true);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Post
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Post</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostMenu; 