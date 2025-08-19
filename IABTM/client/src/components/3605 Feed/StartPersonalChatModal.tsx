import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  _id: string;
  name: string;
  profilePicture?: string;
  isOnline?: boolean;
}

interface StartPersonalChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatStarted: (friendId: string, friendName: string) => void;
  currentUserId?: string;
}

const StartPersonalChatModal: React.FC<StartPersonalChatModalProps> = ({
  isOpen,
  onClose,
  onChatStarted,
  currentUserId
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Filter users based on search query and exclude current user
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    user._id !== currentUserId
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Loading users for personal chat...');
      
      // Try client-side route first
      let response;
      try {
        response = await axios.get('/api/user/get-all-users', { 
          withCredentials: true 
        });
        console.log('📦 Client-side route response:', response.data);
      } catch (clientError) {
        console.log('⚠️ Client-side route failed, trying direct backend call...');
        // Fallback to direct backend call
        response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/get-all-users`, { 
          withCredentials: true 
        });
        console.log('📦 Direct backend response:', response.data);
      }
      
      if (response.data.success || response.data.statusCode === 200) {
        const userData = response.data.data || [];
        console.log('✅ Users fetched successfully:', userData.length, 'users');
        
        // Filter out users with invalid IDs
        const validUsers = userData.filter((user: any) => 
          user._id && 
          user._id !== 'undefined' && 
          user._id !== 'null' && 
          user.name && 
          user.name !== 'undefined' && 
          user.name !== 'null'
        );
        
        console.log('✅ Valid users after filtering:', validUsers.length, 'users');
        setUsers(validUsers);
      } else {
        console.error('❌ Users API returned success: false:', response.data);
        setError('Failed to load users');
        setUsers([]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching users:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleStartChat = async () => {
    if (!selectedUser) {
      setError('Please select a friend to start chatting');
      return;
    }

    // Validate selected user data
    if (!selectedUser._id || selectedUser._id === 'undefined' || selectedUser._id === 'null') {
      setError('Invalid user ID. Please try selecting a different user.');
      return;
    }

    if (!selectedUser.name || selectedUser.name === 'undefined' || selectedUser.name === 'null') {
      setError('Invalid user name. Please try selecting a different user.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      console.log('🚀 Starting personal chat with:', selectedUser._id, selectedUser.name);
      
      // Direct call to start chat (like Facebook/Instagram)
      onChatStarted(selectedUser._id, selectedUser.name);
      handleClose();
      
    } catch (error: any) {
      console.error('❌ Error starting personal chat:', error);
      setError('Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setError('');
    onClose();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-10 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-[656px] min-h-[384px] rounded-lg bg-white p-6 flex flex-col gap-6 relative">
              {/* Close (X) Button */}
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute top-6 right-6 w-6 h-6 flex items-center justify-center bg-none border-none cursor-pointer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E2E2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <Dialog.Title className="font-satoshi font-bold text-[21px] leading-[120%] mb-2">Start New Chat</Dialog.Title>
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {/* Selected User as Chip */}
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                <AnimatePresence>
                  {selectedUser && (
                    <motion.div
                      key={selectedUser._id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm font-medium"
                    >
                      <img src={selectedUser.profilePicture || '/default-profile.svg'} alt={selectedUser.name} className="w-6 h-6 rounded-full object-cover" />
                      <span>{selectedUser.name}</span>
                      <button onClick={() => setSelectedUser(null)} className="ml-1 text-gray-400 hover:text-gray-700">
                        &times;
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[608px] h-[35px] rounded-md border border-gray-200 px-4 font-satoshi text-base mb-2"
              />
              
              {/* User List */}
              <div className="w-[608px] max-h-[240px] overflow-y-auto flex flex-col gap-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                    Loading users...
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No users found
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No users match your search' : 'No users available'}
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div
                      key={user._id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full h-10 flex items-center gap-2 cursor-pointer rounded-md px-2 hover:bg-gray-100 transition"
                    >
                      <img src={user.profilePicture || '/default-profile.svg'} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">
                          {user.isOnline ? 'Online' : 'Last seen recently'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Debug Info */}
              <div className="text-xs text-gray-500">
                Debug: {users.length} total users, {filteredUsers.length} filtered, {selectedUser ? 1 : 0} selected
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartChat}
                  disabled={!selectedUser || loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Start Your Chat'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default StartPersonalChatModal; 