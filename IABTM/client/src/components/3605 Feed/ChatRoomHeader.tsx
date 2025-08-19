'use client';

import React, { useState, useEffect } from 'react';
import { 
  HiPhone, 
  HiVideoCamera, 
  HiDotsVertical, 
  HiUserAdd, 
  HiLogout, 
  HiPencil, 
  HiTrash, 
  HiUserRemove, 
  HiInformationCircle,
  HiCog,
  HiEye,
  HiEyeOff,
  HiSearch
} from 'react-icons/hi';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface ChatRoomHeaderProps {
  groupName: string;
  groupId: string;
  groupAvatar?: string;
  onCall?: () => void;
  onVideoCall?: () => void;
  onAddMember?: () => void;
  onLeaveGroup?: () => void;
  onEditGroupName?: () => void;
  onEditGroupDescription?: () => void;
  onRemoveMembers?: () => void;
  onDeleteGroup?: () => void;
  onViewGroupInfo?: () => void;
  onToggleGroupPrivacy?: () => void;
  isAdmin?: boolean;
  isOwner?: boolean;
  memberCount?: number;
  groupDescription?: string;
  isPrivate?: boolean;
}

const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  groupName,
  groupId,
  groupAvatar,
  onCall,
  onVideoCall,
  onAddMember,
  onLeaveGroup,
  onEditGroupName,
  onEditGroupDescription,
  onRemoveMembers,
  onDeleteGroup,
  onViewGroupInfo,
  onToggleGroupPrivacy,
  isAdmin = false,
  isOwner = false,
  memberCount = 0,
  groupDescription = '',
  isPrivate = false
}) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(groupAvatar);

  // Listen for group avatar updates
  useEffect(() => {
    setCurrentAvatar(groupAvatar);
    if (groupAvatar) {
      console.log('ChatRoomHeader received avatar:', groupAvatar);
    }
  }, [groupAvatar]);

  useEffect(() => {
    if (!groupId) return;

    const handleGroupAvatarUpdated = (data: any) => {
      if (data.groupId === groupId) {
        console.log('Group avatar updated via socket:', data);
        setCurrentAvatar(data.avatar);
      }
    };

    // Add socket listeners if socket is available
    if (typeof window !== 'undefined' && (window as any).socket) {
      const socket = (window as any).socket;
      socket.on('group:avatar-updated', handleGroupAvatarUpdated);

      return () => {
        socket.off('group:avatar-updated', handleGroupAvatarUpdated);
      };
    }
  }, [groupId]);

  const handleLeaveGroup = async () => {
    if (!onLeaveGroup) return;
    
    setIsLeaving(true);
    try {
      await onLeaveGroup();
    } catch (error) {
      console.error('Error leaving group:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!onDeleteGroup) return;
    
    setIsDeleting(true);
    try {
      await onDeleteGroup();
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmLeaveGroup = () => {
    if (window.confirm('Are you sure you want to leave this group? This action cannot be undone.')) {
      handleLeaveGroup();
    }
  };

  const confirmDeleteGroup = () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone and will remove all members.')) {
      handleDeleteGroup();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Group Info */}
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden shadow-md">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={groupName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {groupName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>

          {/* Group Details */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {groupName}
              </h2>
              {isPrivate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  <HiEyeOff className="w-3 h-3 mr-1" />
                  Private
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {memberCount} {memberCount === 1 ? 'member' : 'members'} online
              </span>
              {groupDescription && (
                <span className="text-gray-400">•</span>
              )}
              {groupDescription && (
                <span className="truncate max-w-xs">{groupDescription}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <button
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 group"
            title="Search messages"
          >
            <HiSearch className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          </button>

          {/* Call Button */}
          <button
            onClick={onCall}
            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 group"
            title="Voice Call"
          >
            <HiPhone className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          </button>

          {/* Video Call Button */}
          <button
            onClick={onVideoCall}
            className="p-2.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-all duration-200 group"
            title="Video Call"
          >
            <HiVideoCamera className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          </button>

          {/* Three-Dot Dropdown Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 group">
              <HiDotsVertical className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </Menu.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-100">
                <div className="py-2">
                  {/* Group Information */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onViewGroupInfo}
                        className={`${
                          active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                        } group flex items-center w-full px-4 py-3 text-sm transition-all duration-200 hover:bg-gray-50`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mr-3">
                          <HiInformationCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Group Information</div>
                          <div className="text-xs text-gray-500">View group details and settings</div>
                        </div>
                      </button>
                    )}
                  </Menu.Item>

                  {/* Add Member Option (Admin/Owner only) */}
                  {(isAdmin || isOwner) && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={onAddMember}
                          className={`${
                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                          } group flex items-center w-full px-4 py-3 text-sm transition-all duration-200 hover:bg-gray-50`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mr-3">
                            <HiUserAdd className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Add Member</div>
                            <div className="text-xs text-gray-500">Invite new members to the group</div>
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  {/* Edit Group (Admin/Owner only) */}
                  {(isAdmin || isOwner) && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={onEditGroupName}
                          className={`${
                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                          } group flex items-center w-full px-4 py-3 text-sm transition-all duration-200 hover:bg-gray-50`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mr-3">
                            <HiPencil className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Edit Group</div>
                            <div className="text-xs text-gray-500">Change group name and description</div>
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  {/* Remove Members (Admin/Owner only) */}
                  {(isAdmin || isOwner) && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={onRemoveMembers}
                          className={`${
                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                          } group flex items-center w-full px-4 py-3 text-sm transition-all duration-200 hover:bg-gray-50`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg mr-3">
                            <HiUserRemove className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Remove Members</div>
                            <div className="text-xs text-gray-500">Manage group membership</div>
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-2"></div>

                  {/* Leave Group */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={confirmLeaveGroup}
                        disabled={isLeaving}
                        className={`${
                          active ? 'bg-red-50 text-red-700' : 'text-red-600'
                        } group flex items-center w-full px-4 py-3 text-sm transition-all duration-200 hover:bg-red-50 disabled:opacity-50`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3">
                          <HiLogout className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">
                            {isLeaving ? 'Leaving...' : 'Leave Group'}
                          </div>
                          <div className="text-xs text-red-500">You will no longer be a member</div>
                        </div>
                      </button>
                    )}
                  </Menu.Item>

                  {/* Delete Group (Owner only) */}
                  {isOwner && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={confirmDeleteGroup}
                          disabled={isDeleting}
                          className={`${
                            active ? 'bg-red-50 text-red-700' : 'text-red-600'
                          } group flex items-center w-full px-4 py-3 text-sm transition-all duration-200 hover:bg-red-50 disabled:opacity-50`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mr-3">
                            <HiTrash className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">
                              {isDeleting ? 'Deleting...' : 'Delete Group'}
                            </div>
                            <div className="text-xs text-red-500">Permanently delete this group</div>
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomHeader; 