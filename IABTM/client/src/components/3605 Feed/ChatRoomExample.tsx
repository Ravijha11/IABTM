'use client';

import React, { useState } from 'react';
import ChatRoomHeader from './ChatRoomHeader';
import AddMemberModal from './AddMemberModal';
import { useGroupOperations } from '../../hooks/useGroupOperations';
import { toast } from 'react-toastify';

interface ChatRoomExampleProps {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  memberCount: number;
  existingMembers: string[];
}

const ChatRoomExample: React.FC<ChatRoomExampleProps> = ({
  groupId,
  groupName,
  isAdmin,
  memberCount,
  existingMembers
}) => {
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const { leaveGroup, addMember, initiateCall, isLoading } = useGroupOperations({
    groupId,
    onSuccess: (message) => {
      toast.success(message);
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const handleCall = () => {
    initiateCall('voice');
  };

  const handleVideoCall = () => {
    initiateCall('video');
  };

  const handleAddMember = () => {
    setIsAddMemberModalOpen(true);
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const handleAddMemberSubmit = async (memberId: string) => {
    try {
      await addMember(memberId);
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Chat Room Header */}
      <ChatRoomHeader
        groupName={groupName}
        groupId={groupId}
        onCall={handleCall}
        onVideoCall={handleVideoCall}
        onAddMember={handleAddMember}
        onLeaveGroup={handleLeaveGroup}
        isAdmin={isAdmin}
        memberCount={memberCount}
      />

      {/* Chat Content Area */}
      <div className="flex-1 bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">
              Chat Room Content
            </h3>
            <p className="text-gray-600">
              This is where the chat messages would appear. The header above provides all the necessary
              functionality for managing the group.
            </p>
            
            {/* Group Info Display */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Group Information</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Group ID:</strong> {groupId}</p>
                <p><strong>Admin Status:</strong> {isAdmin ? 'Yes' : 'No'}</p>
                <p><strong>Member Count:</strong> {memberCount}</p>
                <p><strong>Existing Members:</strong> {existingMembers.length}</p>
              </div>
            </div>

            {/* Action Buttons for Testing */}
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-gray-900">Test Actions:</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCall}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Test Voice Call
                </button>
                <button
                  onClick={handleVideoCall}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Test Video Call
                </button>
                {isAdmin && (
                  <button
                    onClick={handleAddMember}
                    disabled={isLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    Test Add Member
                  </button>
                )}
                <button
                  onClick={handleLeaveGroup}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Test Leave Group
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={handleAddMemberSubmit}
        groupId={groupId}
        existingMembers={existingMembers}
      />
    </div>
  );
};

export default ChatRoomExample; 