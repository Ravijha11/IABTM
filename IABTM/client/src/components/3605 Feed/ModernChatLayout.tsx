import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/storage/authStore';
import { useSocket } from '@/hooks/useSocket';
import axios from 'axios';
import { toast } from 'react-toastify';
import CreateRoomModal from './CreateRoomModal';
import StartNewChatModal from './StartNewChatModal';

// Modern Icons
const MessageIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M19 12c0-2.21-1.79-4-4-4" />
    <path d="M19 12c0 2.21-1.79 4-4 4" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Types
interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isUser: boolean;
  timestamp: Date;
  senderId?: string;
  senderAvatar?: string;
}

interface Chat {
  id: string;
  name: string;
  type: 'personal' | 'group';
  profilePicture?: string;
  memberCount?: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isMicEnabled?: boolean;
  isOnline?: boolean;
}

interface User {
  _id: string;
  name: string;
  profilePicture?: string;
  isOnline?: boolean;
}

// Utility Functions
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
};

// Main Component
const ModernChatLayout: React.FC = () => {
  const { user } = useAuthStore();
  const { socket, isConnected } = useSocket();
  
  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStartNewChatModal, setShowStartNewChatModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', handleNewMessage);
    socket.on('typing-indicator', handleTypingIndicator);
    socket.on('user-status', handleUserStatus);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('typing-indicator', handleTypingIndicator);
      socket.off('user-status', handleUserStatus);
    };
  }, [socket, selectedChat]);

  // Load chats from API
  const loadChats = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Loading chats...');
      
      // Test API connection first
      try {
        const testRes = await axios.get('/api/messages/test');
        console.log('✅ API test successful:', testRes.data);
      } catch (testError: any) {
        console.error('❌ API test failed:', testError.response?.status, testError.response?.data);
      }
      
      // Load personal conversations
      const personalRes = await axios.get('/api/messages/conversations');
      console.log('Personal conversations response:', personalRes.data);
      
      // Handle both old and new response formats
      let personalData = personalRes.data.data;
      if (personalRes.data.data && personalRes.data.data.personal) {
        personalData = personalRes.data.data.personal;
      }
      
      const personalChats: Chat[] = personalData?.map((conv: any) => ({
        id: [user?._id, conv.recipient._id].sort().join('_'), // Create consistent chat ID
        name: conv.recipient.name,
        type: 'personal' as const,
        profilePicture: conv.recipient.profilePicture,
        lastMessage: conv.lastMessage?.content,
        lastMessageTime: conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt) : undefined,
        unreadCount: conv.unreadCount || 0,
        isOnline: conv.recipient.isOnline
      })) || [];

      // Load groups
      const groupsRes = await axios.get('/api/group/user-groups');
      console.log('Groups response:', groupsRes.data);
      const groupChats: Chat[] = groupsRes.data.data?.map((group: any) => ({
        id: group._id,
        name: group.name,
        type: 'group' as const,
        profilePicture: group.avatar,
        memberCount: group.members?.length || 0,
        lastMessage: group.lastMessage?.content,
        lastMessageTime: group.lastMessage?.createdAt ? new Date(group.lastMessage.createdAt) : undefined,
        unreadCount: group.unreadCount || 0,
        isMicEnabled: group.isMicEnabled || group.audioRoom?.enabled
      })) || [];

      setChats([...personalChats, ...groupChats]);
      console.log('Loaded chats:', { personal: personalChats.length, groups: groupChats.length });
      
      // If no chats found, this is normal for new users
      if (personalChats.length === 0 && groupChats.length === 0) {
        console.log('ℹ️ No chats found - this is normal for new users');
      }
    } catch (error: any) {
      console.error('Error loading chats:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Please log in to view chats');
      } else if (error.response?.status === 404) {
        toast.error('Chat service not available');
      } else {
        toast.error('Failed to load chats');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected chat
  const loadMessages = async (chatId: string, chatType: 'personal' | 'group') => {
    try {
      let endpoint;
      if (chatType === 'personal') {
        // Extract the other user's ID from the chat ID (format: user1_user2)
        const userIds = chatId.split('_');
        const recipientId = userIds.find(id => id !== user?._id);
        endpoint = `/api/messages/direct/${recipientId}`;
      } else {
        endpoint = `/api/messages/group/${chatId}`;
      }
      
      const response = await axios.get(endpoint);
      const messagesData: Message[] = response.data.data.messages?.map((msg: any) => ({
        id: msg._id,
        sender: msg.sender.name,
        senderId: msg.sender._id,
        senderAvatar: msg.sender.profilePicture,
        content: msg.content,
        time: formatTime(new Date(msg.createdAt)),
        isUser: msg.sender._id === user?._id,
        timestamp: new Date(msg.createdAt)
      })) || [];
      
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Don't show error for new chats with no messages
      if (chatType === 'personal') {
        setMessages([]);
      } else {
        toast.error('Failed to load messages');
      }
    }
  };

  // Handle chat selection
  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id, chat.type);
    
    // Join socket room
    if (socket && isConnected) {
      const roomName = chat.type === 'personal' 
        ? chat.id // chat.id is already the room name for personal chats
        : chat.id;
      socket.emit('joinRoom', { roomName });
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const messageContent = newMessage.trim();
    const currentTime = new Date();
    
    // Optimistic UI update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: user.name,
      senderId: user._id,
      senderAvatar: user.profilePicture,
      content: messageContent,
      time: formatTime(currentTime),
      isUser: true,
      timestamp: currentTime
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    // Send via socket
    if (socket && isConnected) {
      let recipientId;
      if (selectedChat.type === 'personal') {
        // Extract the other user's ID from the chat ID (format: user1_user2)
        const userIds = selectedChat.id.split('_');
        recipientId = userIds.find(id => id !== user._id);
      }
      
      const messageData = {
        text: messageContent,
        roomName: selectedChat.id, // chat.id is already the room name
        groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
        recipientId: recipientId
      };

      socket.emit('send_message', messageData, (response: any) => {
        if (response?.success) {
          // Update temp message with real ID
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempMessage.id 
                ? { ...msg, id: response.message._id }
                : msg
            )
          );
        } else {
          toast.error('Failed to send message');
          // Remove temp message on failure
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        }
      });
    }
  };

  // Handle new message from socket
  const handleNewMessage = (data: any) => {
    if (!selectedChat) return;

    const newMsg: Message = {
      id: data._id,
      sender: data.sender?.name || 'Unknown',
      senderId: data.sender?._id,
      senderAvatar: data.sender?.profilePicture,
      content: data.content,
      time: formatTime(new Date(data.createdAt)),
      isUser: data.sender?._id === user?._id,
      timestamp: new Date(data.createdAt)
    };

    setMessages(prev => {
      // Check for duplicates
      const exists = prev.some(msg => msg.id === newMsg.id);
      if (exists) return prev;
      return [...prev, newMsg];
    });
  };

  // Handle typing indicators
  const handleTypingIndicator = (data: any) => {
    if (data.roomName === selectedChat?.id) {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user !== data.userId);
        if (data.isTyping) {
          return [...filtered, data.userId];
        }
        return filtered;
      });
    }
  };

  // Handle user status updates
  const handleUserStatus = (data: any) => {
    setChats(prev => 
      prev.map(chat => 
        chat.id === data.userId 
          ? { ...chat, isOnline: data.isOnline }
          : chat
      )
    );
  };

  // Typing handlers
  const handleTypingStart = () => {
    if (!selectedChat || !socket) return;
    
    setIsTyping(true);
    socket.emit('typing', {
      roomName: selectedChat.id,
      isTyping: true
    });
  };

  const handleTypingStop = () => {
    if (!selectedChat || !socket) return;
    
    setIsTyping(false);
    socket.emit('typing', {
      roomName: selectedChat.id,
      isTyping: false
    });
  };

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      handleTypingStart();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 1000);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle room creation
  const handleRoomCreated = (room: any) => {
    const newChat: Chat = {
      id: room._id,
      name: room.name,
      type: 'group',
      profilePicture: room.avatar,
      memberCount: room.members?.length || 0,
      isMicEnabled: room.isMicEnabled || room.audioRoom?.enabled
    };
    
    setChats(prev => [newChat, ...prev]);
    setSelectedChat(newChat);
    loadMessages(newChat.id, newChat.type);
    
    toast.success(`Room "${room.name}" created successfully!`);
  };

  // Handle new personal chat started
  const handleNewChatStarted = (chatId: string, friendName: string) => {
    console.log('Starting new chat with:', { chatId, friendName });
    
    // Create a new personal chat entry
    const newChat: Chat = {
      id: chatId,
      name: friendName,
      type: 'personal',
      lastMessage: 'Chat started',
      lastMessageTime: new Date(),
      unreadCount: 0
    };
    
    // Add to chats list and select it
    setChats(prev => [newChat, ...prev]);
    setSelectedChat(newChat);
    
    // Join the socket room for this chat
    if (socket && isConnected) {
      socket.emit('joinRoom', { roomName: chatId });
    }
    
    // Load messages (will be empty for new chats)
    loadMessages(newChat.id, newChat.type);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStartNewChatModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Start New Chat"
              >
                <MessageIcon />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Create Group"
              >
                <PlusIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageIcon />
              <p className="mt-2">Welcome to IABTM 3605 Chat!</p>
              <p className="text-sm text-gray-400 mb-4">You don't have any conversations yet. Start by chatting with friends or creating a group.</p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowStartNewChatModal(true)}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  💬 Start New Chat
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  👥 Create Group
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedChat?.id === chat.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      {chat.profilePicture ? (
                        <img
                          src={chat.profilePicture}
                          alt={chat.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                          {getInitials(chat.name)}
                        </div>
                      )}
                      
                      {/* Online indicator for personal chats */}
                      {chat.type === 'personal' && chat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                      
                      {/* Audio room indicator for groups */}
                      {chat.type === 'group' && chat.isMicEnabled && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <MicIcon />
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                        {chat.lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {formatDate(chat.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                      </div>
                      
                      {chat.type === 'group' && (
                        <p className="text-xs text-gray-500 mt-1">
                          {chat.memberCount} members
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedChat.profilePicture ? (
                    <img
                      src={selectedChat.profilePicture}
                      alt={selectedChat.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                      {getInitials(selectedChat.name)}
                    </div>
                  )}
                  
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedChat.name}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedChat.type === 'personal' 
                        ? (selectedChat.isOnline ? 'Online' : 'Offline')
                        : `${selectedChat.memberCount} members`
                      }
                    </p>
                  </div>
                </div>
                
                {selectedChat.type === 'group' && selectedChat.isMicEnabled && (
                  <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                    <MicIcon />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${message.isUser ? 'order-2' : 'order-1'}`}>
                    {!message.isUser && (
                      <div className="flex items-center gap-2 mb-1">
                        {message.senderAvatar ? (
                          <img
                            src={message.senderAvatar}
                            alt={message.sender}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                            {getInitials(message.sender)}
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-600">{message.sender}</span>
                      </div>
                    )}
                    
                    <div
                      className={`p-3 rounded-lg ${
                        message.isUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${message.isUser ? 'text-right' : 'text-left'}`}>
                      {message.time}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-sm text-gray-600">
                        {typingUsers.length === 1 ? 'Someone is typing...' : 'Multiple people are typing...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageIcon />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Select a chat</h3>
              <p className="mt-2 text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Room Creation Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />

      {/* Start New Chat Modal */}
      <StartNewChatModal
        isOpen={showStartNewChatModal}
        onClose={() => setShowStartNewChatModal(false)}
        onChatStarted={handleNewChatStarted}
      />
    </div>
  );
};

export default ModernChatLayout; 