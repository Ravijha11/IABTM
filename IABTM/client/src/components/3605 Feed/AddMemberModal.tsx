'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HiX, HiSearch, HiUserAdd } from 'react-icons/hi';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (memberId: string) => Promise<void>;
  groupId: string;
  existingMembers: string[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  groupId,
  existingMembers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Fetch all users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Filter users based on search query and existing members
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
      const notAlreadyMember = !existingMembers.includes(user._id);
      return matchesSearch && notAlreadyMember;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users, existingMembers]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/user/get-all-users', {
        withCredentials: true,
      });
      
      if (response.data.success) {
        console.log('Fetched users for add member:', response.data);
        setUsers(response.data.data || []);
      } else {
        console.error('Failed to fetch users:', response.status);
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsAdding(true);
    try {
      // Add each selected user
      for (const user of selectedUsers) {
        await onAddMember(user._id);
      }
      
      toast.success(`Added ${selectedUsers.length} member${selectedUsers.length > 1 ? 's' : ''} to the group`);
      setSelectedUsers([]);
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error('Failed to add some members');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Add Members
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Selected Users */}
                <div className="flex flex-wrap gap-2 min-h-[32px] mb-4">
                  <AnimatePresence>
                    {selectedUsers.map(user => (
                      <motion.div
                        key={user._id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-sm font-medium"
                      >
                        <img 
                          src={user.profilePicture || '/default-profile.svg'} 
                          alt={user.name} 
                          className="w-6 h-6 rounded-full object-cover" 
                        />
                        <span>{user.name}</span>
                        <button 
                          onClick={() => handleRemoveUser(user._id)} 
                          className="ml-1 text-blue-400 hover:text-blue-700"
                        >
                          &times;
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Users List */}
                <div className="max-h-60 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? 'No users match your search' : 'No users available'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedUsers.some(u => u._id === user._id)
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleAddUser(user)}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            {user.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {user.isOnline ? (
                                <span className="text-green-600">Online</span>
                              ) : user.lastSeen ? (
                                <span>Last seen {new Date(user.lastSeen).toLocaleDateString()}</span>
                              ) : (
                                <span>Offline</span>
                              )}
                            </div>
                          </div>
                          {selectedUsers.some(u => u._id === user._id) && (
                            <HiUserAdd className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMembers}
                    disabled={selectedUsers.length === 0 || isAdding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAdding ? 'Adding...' : selectedUsers.length > 0 ? `Add ${selectedUsers.length} Member${selectedUsers.length > 1 ? 's' : ''}` : 'Add Members'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddMemberModal; 