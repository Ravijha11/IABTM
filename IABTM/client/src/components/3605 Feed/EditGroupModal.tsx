'use client';

import React, { useState } from 'react';
import { HiX, HiSave, HiEye, HiEyeOff } from 'react-icons/hi';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; isPrivate: boolean }) => Promise<void>;
  initialData: {
    name: string;
    description: string;
    isPrivate: boolean;
  };
  isLoading?: boolean;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false
}) => {
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [isPrivate, setIsPrivate] = useState(initialData.isPrivate);

  const handleSave = async () => {
    try {
      await onSave({ name, description, isPrivate });
      onClose();
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter group name"
              maxLength={50}
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter group description"
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md border transition-colors ${
                  !isPrivate
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <HiEye className="w-4 h-4" />
                <span>Public</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md border transition-colors ${
                  isPrivate
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <HiEyeOff className="w-4 h-4" />
                <span>Private</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isPrivate 
                ? 'Only members can see this group' 
                : 'Anyone can find and join this group'
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <HiSave className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal; 