import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { FiSend, FiPaperclip, FiSmile, FiMoreVertical } from 'react-icons/fi';
import { useAuthStore } from '@/storage/authStore';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'react-toastify';

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isUser: boolean;
  timestamp: Date;
  messageType?: 'text' | 'file';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  readBy?: Array<{ userId: string; timestamp: Date }>;
}

interface Chat {
  id: string;
  name: string;
  type: 'group' | 'personal';
  profilePicture?: string;
  memberCount?: number;
  onlineCount?: number;
  creator?: string;
  isMicEnabled?: boolean;
  isOnline?: boolean;
  members?: any[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

interface OptimizedChatRoomProps {
  selectedChat: Chat | null;
  onChatUpdate?: (chatId: string, lastMessage: string, timestamp: Date) => void;
}

const OptimizedChatRoom: React.FC<OptimizedChatRoomProps> = ({ 
  selectedChat, 
  onChatUpdate 
}) => {
  const { user } = useAuthStore();
  const userId = user?._id;
  const userName = user?.name || 'Unknown User';

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [lastCursor, setLastCursor] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Socket connection
  const { socket, isConnected, sendMessage: sendSocketMessage, joinRoom, leaveRoom } = useSocket();

  // Deduplicate messages function
  const deduplicateMessages = useCallback((messages: Message[]): Message[] => {
    const seen = new Set();
    return messages.filter(msg => {
      const key = `${msg.id}-${msg.content}-${msg.sender}-${msg.timestamp.getTime()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, []);

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    if (!selectedChat || !userId) return;

    setIsLoadingMessages(true);
    setMessages([]);
    setHasMoreMessages(true);
    setLastCursor(null);

    try {
      const params = selectedChat.type === 'group' 
        ? { groupId: selectedChat.id, limit: 50 }
        : { recipientId: selectedChat.id, limit: 50 };
      
      console.log('📥 Loading initial messages with params:', params);
      
      const response = await axios.get('/api/messages', { 
        params,
        withCredentials: true
      });

      console.log('📥 Initial messages response:', response.data);
      
      if (response.data.success) {
        const rawMessages = response.data.data?.messages || response.data.data || [];
        const formattedMessages = rawMessages.map((msg: any, index: number) => ({
          id: msg._id || msg.id || `loaded-${selectedChat.id}-${index}-${Date.now()}`,
          sender: msg.sender?.name || msg.sender || 'Unknown',
          content: msg.content || msg.message || '',
          time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Now',
          isUser: (msg.sender?._id === userId) || (msg.sender === userId) || (typeof msg.sender === 'string' && msg.sender === userId),
          timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          messageType: msg.messageType || 'text',
          mediaUrl: msg.mediaUrl || msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          fileType: msg.fileType,
          readBy: msg.readBy || []
        }));
        
        setMessages(formattedMessages);
        
        // Set pagination info
        if (response.data.data?.pagination) {
          const pagination = response.data.data.pagination;
          setHasMoreMessages(pagination.hasMore || false);
          setLastCursor(pagination.nextCursor || null);
          console.log('📄 Pagination info:', pagination);
        }
        
        // Scroll to bottom after messages are loaded
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        console.error('❌ Failed to load messages:', response.data.message);
        toast.error(response.data.message || 'Failed to load messages');
      }
    } catch (error: any) {
      console.error('❌ Error loading messages:', error);
      toast.error(error.response?.data?.message || 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedChat, userId]);

  // Load more messages with cursor-based pagination
  const loadMoreMessages = useCallback(async () => {
    if (!selectedChat || isLoadingMore || !hasMoreMessages || !lastCursor) return;
    
    setIsLoadingMore(true);
    try {
      const params = selectedChat.type === 'group' 
        ? { groupId: selectedChat.id, cursor: lastCursor, limit: 50 }
        : { recipientId: selectedChat.id, cursor: lastCursor, limit: 50 };
      
      console.log('📥 Loading more messages with params:', params);
      
      const response = await axios.get('/api/messages', { 
        params,
        withCredentials: true
      });

      console.log('📥 Load more response:', response.data);
      
      if (response.data.success) {
        const newMessages = (response.data.data?.messages || response.data.data || []).map((msg: any, index: number) => ({
          id: msg._id || msg.id || `loaded-${selectedChat.id}-${index}-${Date.now()}`,
          sender: msg.sender?.name || msg.sender || 'Unknown',
          content: msg.content || msg.message || '',
          time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Now',
          isUser: (msg.sender?._id === userId) || (msg.sender === userId) || (typeof msg.sender === 'string' && msg.sender === userId),
          timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          messageType: msg.messageType || 'text',
          mediaUrl: msg.mediaUrl || msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          fileType: msg.fileType,
          readBy: msg.readBy || []
        }));
        
        const pagination = response.data.data?.pagination;
        
        // Store current scroll position
        const container = messagesContainerRef.current;
        const scrollHeightBefore = container?.scrollHeight || 0;
        
        // Prepend older messages to the beginning and deduplicate
        setMessages(prev => deduplicateMessages([...newMessages, ...prev]));
        setHasMoreMessages(pagination?.hasMore || false);
        setLastCursor(pagination?.nextCursor || null);
        
        // Maintain scroll position after new messages are added
        setTimeout(() => {
          if (container) {
            const scrollHeightAfter = container.scrollHeight;
            const scrollDiff = scrollHeightAfter - scrollHeightBefore;
            container.scrollTop = scrollDiff;
          }
        }, 100);
        
        console.log(`📥 Loaded ${newMessages.length} more messages. Has more: ${pagination?.hasMore}`);
      }
    } catch (error: any) {
      console.error('❌ Error loading more messages:', error);
      toast.error('Failed to load more messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedChat, userId, isLoadingMore, hasMoreMessages, lastCursor, deduplicateMessages]);

  // Send message function
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedChat || !userId) return;
    
    const messageContent = newMessage.trim();
    const currentTime = new Date();
    const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // Create optimistic message immediately for instant UI feedback
    const optimisticMsg: Message = {
      id: `temp-${selectedChat.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: userName,
      content: messageContent,
      time: timeString,
      isUser: true,
      timestamp: currentTime,
    };
    
    // Add optimistic message to UI immediately
    setMessages(prev => deduplicateMessages([...prev, optimisticMsg]));
    setNewMessage('');
    
    // Update chat list with new message
    if (onChatUpdate) {
      onChatUpdate(selectedChat.id, messageContent, currentTime);
    }
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    // Send message via socket
    const messageData = {
      text: messageContent,
      roomName: selectedChat.type === 'group' ? selectedChat.id : [userId, selectedChat.id].sort().join('_'),
      groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
      recipientId: selectedChat.type === 'personal' ? selectedChat.id : undefined,
      sender: userId,
    };
    
    console.log('📤 Sending message via socket:', messageData);
    
    try {
      const success = await sendSocketMessage(messageData);
      if (success) {
        console.log('✅ Message sent successfully via socket');
        // Remove optimistic message and let the real message come through socket
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMsg.id));
      } else {
        console.log('❌ Socket send failed, falling back to API');
        // Fallback to API if socket fails
        await sendMessageViaAPI(messageContent, optimisticMsg);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Fallback to API
      await sendMessageViaAPI(messageContent, optimisticMsg);
    }
  }, [newMessage, selectedChat, userId, userName, sendSocketMessage, deduplicateMessages, onChatUpdate]);

  // API fallback for sending messages
  const sendMessageViaAPI = useCallback(async (content: string, tempMessage: Message) => {
    try {
      console.log('📡 Sending message via API fallback...');
      
      const messageData = {
        content: content,
        groupId: selectedChat?.type === 'group' ? selectedChat.id : undefined,
        recipientId: selectedChat?.type === 'personal' ? selectedChat.id : undefined,
      };
      
      const response = await axios.post('/api/messages/send-message', messageData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        console.log('✅ Message sent successfully via API');
        // Update the message with the real ID from server
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, id: response.data.data?._id || response.data.data?.id || `api-${selectedChat?.id}-${Date.now()}` }
              : msg
          )
        );
      } else {
        console.error('❌ API send failed:', response.data);
        // Remove the message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ API send error:', error);
      // Remove the message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast.error('Failed to send message. Please try again.');
    }
  }, [selectedChat]);

  // Handle new messages from socket
  const handleNewMessage = useCallback((data: any) => {
    console.log('📨 Received new message:', data);
    
    // Only add message if it's for the current chat
    if (selectedChat && (
      (selectedChat.type === 'group' && data.groupId === selectedChat.id) ||
      (selectedChat.type === 'personal' && (
        data.recipientId === selectedChat.id || 
        data.sender?._id === selectedChat.id ||
        data.roomName === selectedChat.id
      ))
    )) {
      const newMsg: Message = {
        id: data._id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: data.sender?.name || data.sender || 'Unknown',
        content: data.content || data.message || '',
        time: data.createdAt ? new Date(data.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Now',
        isUser: (data.sender?._id === userId) || (data.sender === userId),
        timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
        messageType: data.messageType || 'text',
        mediaUrl: data.mediaUrl || data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        readBy: data.readBy || []
      };

      // Add message to UI immediately
      setMessages(prev => deduplicateMessages([...prev, newMsg]));

      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

      // Update chat list with new message
      if (onChatUpdate) {
        onChatUpdate(selectedChat.id, newMsg.content, newMsg.timestamp);
      }
    }
  }, [selectedChat, userId, deduplicateMessages, onChatUpdate]);

  // Handle typing indicators
  const handleTypingIndicator = useCallback((data: any) => {
    console.log('⌨️ Typing indicator:', data);
    if (selectedChat && data.roomName === selectedChat.id) {
      setTypingUsers(prev => {
        const newTypingUsers = data.isTyping 
          ? [...prev.filter(id => id !== data.userId), data.userId]
          : prev.filter(id => id !== data.userId);
        return newTypingUsers;
      });
    }
  }, [selectedChat]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 Setting up socket event listeners');

    // Listen for new messages
    socket.on('new-message', handleNewMessage);

    // Listen for typing indicators
    socket.on('typing-indicator', handleTypingIndicator);

    return () => {
      console.log('🔌 Cleaning up socket event listeners');
      socket.off('new-message');
      socket.off('typing-indicator');
    };
  }, [socket, isConnected, handleNewMessage, handleTypingIndicator]);

  // Load messages when chat changes
  useEffect(() => {
    if (selectedChat && userId) {
      // Join room for real-time messages
      if (isConnected) {
        if (selectedChat.type === 'group') {
          joinRoom(selectedChat.id);
        } else {
          const roomName = [userId, selectedChat.id].sort().join('_');
          joinRoom(roomName);
        }
      }
      
      // Load initial messages
      loadInitialMessages();
    }
  }, [selectedChat, userId, isConnected, joinRoom, loadInitialMessages]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop } = messagesContainerRef.current;
    
    // Load more messages when user scrolls to top
    if (scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  // Handle key press for sending messages
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socket || !isConnected || !selectedChat) return;
    
    // Emit typing start
    socket.emit('typing-start', { 
      roomName: selectedChat.type === 'group' ? selectedChat.id : [userId, selectedChat.id].sort().join('_'),
      userId 
    });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', { 
        roomName: selectedChat.type === 'group' ? selectedChat.id : [userId, selectedChat.id].sort().join('_'),
        userId 
      });
    }, 2000);
  }, [socket, isConnected, selectedChat, userId]);

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">Select a chat to start messaging</div>
          <div className="text-gray-300 text-sm">Choose from your conversations or start a new one</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {selectedChat.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{selectedChat.name}</div>
            <div className="text-sm text-gray-500">
              {selectedChat.type === 'group' ? `${selectedChat.memberCount || 0} members` : 
               selectedChat.isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <FiMoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {/* Loading indicator for more messages */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Messages */}
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.time}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-500">Typing...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <FiPaperclip className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <FiSmile className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptimizedChatRoom; 