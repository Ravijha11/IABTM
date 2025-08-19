import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/storage/authStore';
import { useSocket } from '@/hooks/useSocket';

// Icons
const UserIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

interface Friend {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface StartNewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatStarted: (chatId: string, friendName: string) => void;
}

const StartNewChatModal: React.FC<StartNewChatModalProps> = ({
  isOpen,
  onClose,
  onChatStarted
}) => {
  const { user } = useAuthStore();
  const { socket, isConnected } = useSocket();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  // Filter friends based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [searchQuery, friends]);

  // Load friends from API
  const loadFriends = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading friends...');
      const response = await axios.get('/api/friend/get-friends');
      console.log('Friends response:', response.data);
      setFriends(response.data.data || []);
      setFilteredFriends(response.data.data || []);
      
      if (response.data.data && response.data.data.length === 0) {
        console.log('ℹ️ No friends found - user may need to add friends first');
      }
    } catch (error: any) {
      console.error('Error loading friends:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Please log in to view friends');
      } else if (error.response?.status === 404) {
        toast.error('Friends service not available');
      } else {
        toast.error('Failed to load friends');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle friend selection and start chat
  const handleFriendSelect = async (friend: Friend) => {
    if (!user || !socket || !isConnected) {
      toast.error('Connection not available');
      return;
    }

    try {
      setSelectedFriend(friend);
      
      console.log('Emitting initiatePersonalChat with friendId:', friend.id);
      // Emit socket event to initiate personal chat
      socket.emit('initiatePersonalChat', { friendId: friend.id }, (response: any) => {
        console.log('Received response from initiatePersonalChat:', response);
        if (response?.success) {
          const chatId = response.chatId;
          onChatStarted(chatId, friend.name);
          onClose();
          toast.success(`Started chat with ${friend.name}`);
        } else {
          toast.error(response?.error || 'Failed to start chat');
          setSelectedFriend(null);
        }
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
      setSelectedFriend(null);
    }
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Start New Chat</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Select a friend to start chatting</p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading friends...</p>
            </div>
                     ) : filteredFriends.length === 0 ? (
             <div className="text-center py-8">
               <UserIcon />
               <p className="text-gray-500 mt-2">
                 {searchQuery ? 'No friends found matching your search' : 'No friends found'}
               </p>
               {!searchQuery && (
                 <div className="text-sm text-gray-400 mt-3 space-y-2">
                   <p>You need to add friends before you can start chatting.</p>
                   <p>💡 Try searching for users or accepting friend requests.</p>
                 </div>
               )}
             </div>
          ) : (
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => handleFriendSelect(friend)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFriend?.id === friend.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {friend.profilePicture ? (
                      <img
                        src={friend.profilePicture}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                        {getInitials(friend.name)}
                      </div>
                    )}

                    {/* Friend Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{friend.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{friend.email}</p>
                    </div>

                    {/* Selection indicator */}
                    {selectedFriend?.id === friend.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartNewChatModal; 