import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, X, MessageCircle, Users, File, Image as ImageIcon, Download } from 'lucide-react';
import { useAuthStore } from '@/storage/authStore';
import { toast } from 'react-toastify';

interface SearchResult {
  conversationId: string;
  conversationName: string;
  conversationAvatar?: string;
  conversationType: 'personal' | 'group';
  messages: Message[];
}

interface Message {
  _id: string;
  content: string;
  messageType?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  recipient?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  group?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

interface ChatSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToChat: (chatId: string, chatType: 'personal' | 'group') => void;
  currentChatId?: string;
  currentChatType?: 'personal' | 'group';
}

const ChatSearch: React.FC<ChatSearchProps> = ({
  isOpen,
  onClose,
  onNavigateToChat,
  currentChatId,
  currentChatType
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        setDebouncedQuery(searchQuery);
      }, 300);
    } else {
      setDebouncedQuery('');
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch();
    }
  }, [debouncedQuery]);

  const performSearch = async () => {
    if (!debouncedQuery.trim()) return;

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        query: debouncedQuery,
        limit: '50'
      });

      // Add current chat context if available
      if (currentChatId && currentChatType) {
        if (currentChatType === 'group') {
          params.append('groupId', currentChatId);
        } else {
          params.append('recipientId', currentChatId);
        }
      }

      const response = await axios.get(`/api/messages/search?${params}`, {
        withCredentials: true
      });

      setSearchResults(response.data.data.results);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Error searching messages: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const chatId = result.conversationType === 'group' 
      ? result.conversationId.replace('group_', '')
      : result.conversationId.replace('chat_', '').split('_').find(id => id !== user?._id) || '';
    
    onNavigateToChat(chatId, result.conversationType);
    onClose();
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon size={16} />;
    return <File size={16} />;
  };

  const renderMessageContent = (message: Message) => {
    if (message.messageType === 'image') {
      return (
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">Image: {message.fileName}</span>
        </div>
      );
    } else if (message.messageType === 'file') {
      return (
        <div className="flex items-center gap-2">
          <File size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">
            File: {message.fileName} ({message.fileSize ? formatFileSize(message.fileSize) : ''})
          </span>
        </div>
      );
    } else {
      return (
        <span className="text-sm text-gray-700">
          {highlightText(message.content, debouncedQuery)}
        </span>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Search Messages</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search messages, files, or conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searchQuery.trim().length < 2 ? (
            <div className="text-center text-gray-500 py-8">
              Type at least 2 characters to search
            </div>
          ) : searchResults.length === 0 && !isSearching ? (
            <div className="text-center text-gray-500 py-8">
              No messages found for "{debouncedQuery}"
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div
                  key={result.conversationId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  {/* Conversation Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {result.conversationAvatar ? (
                        <img
                          src={result.conversationAvatar}
                          alt={result.conversationName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        result.conversationType === 'group' ? (
                          <Users size={20} className="text-gray-500" />
                        ) : (
                          <MessageCircle size={20} className="text-gray-500" />
                        )
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {highlightText(result.conversationName, debouncedQuery)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {result.conversationType === 'group' ? 'Group' : 'Direct Message'}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-2">
                    {result.messages.slice(0, 3).map((message) => (
                      <div
                        key={message._id}
                        className="flex items-start gap-2 p-2 bg-gray-50 rounded"
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {message.sender.profilePicture ? (
                            <img
                              src={message.sender.profilePicture}
                              alt={message.sender.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-600">
                              {message.sender.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {message.sender.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {renderMessageContent(message)}
                        </div>
                      </div>
                    ))}
                    {result.messages.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{result.messages.length - 3} more messages
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            {searchResults.length > 0 && `Found ${searchResults.length} conversation${searchResults.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatSearch; 