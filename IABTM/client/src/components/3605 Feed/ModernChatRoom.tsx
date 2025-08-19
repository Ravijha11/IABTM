import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/storage/authStore';
import { useSocket } from '@/hooks/useSocket';
import { useEventBus } from '@/utils/pubSub';
import { useRecentlyViewedChats } from '@/hooks/useRecentlyViewedChats';
import { usePersonalChatsStore } from '@/store/personalChatsStore';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AudioRoomProvider } from './AudioRoomStateManager';
import AudioRoomButton from './AudioRoomButton';
import StartRoomModal from './StartRoomModal';
import StartPersonalChatModal from './StartPersonalChatModal';
import AddUsersModal from './AddUsersModal';
import AboutButtonModal from './AboutButtonModal';
import FileUploadModal from './FileUploadModal';
import { debounce, throttle, createTypingDebounce } from '@/utils/performanceUtils';
import { chatEvents } from '@/utils/pubSub';
import { binarySearchByTimestamp } from '@/utils/searchAlgorithms';

// Modern high-tech icons
const SpeakerIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M19 12c0-2.21-1.79-4-4-4" />
    <path d="M19 12c0 2.21-1.79 4-4 4" />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Message type
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
  
  // Audio room properties
  audioRoom?: {
    enabled: boolean;
    isActive: boolean;
    roomName: string;
    hostId: string;
    participants: number;
    maxParticipants: number;
  };
}

// Helper to get initials from group or user name
function getInitials(name: string) {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Helper to format date for chat messages
function formatMessageDate(date: Date | undefined | null): string {
  if (!date) return 'Unknown Date';
  
  try {
  const now = new Date();
  const messageDate = new Date(date);
  
  // Reset time to compare only dates
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (messageDay.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    // Format as "Monday, January 15" or "January 15, 2023" if different year
    const currentYear = now.getFullYear();
    const messageYear = messageDate.getFullYear();
    
    if (messageYear === currentYear) {
      return messageDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    }
  } catch (error) {
    console.warn('Error formatting message date:', error);
    return 'Unknown Date';
  }
}

// Helper to check if two dates are on the same day
function isSameDay(date1: Date | undefined | null, date2: Date | undefined | null): boolean {
  if (!date1 || !date2) return false;
  
  try {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1.getTime() === d2.getTime();
  } catch (error) {
    console.warn('Error comparing dates:', error);
    return false;
  }
}

const ModernChatRoom = () => {
  const { user } = useAuthStore();
  const userId = user?._id || '';
  const userName = user?.name || 'You';
  
  const searchParams = useSearchParams();
  
  // Get URL parameters for personal chat
  const chatType = searchParams?.get('chat');
  const recipientId = searchParams?.get('recipientId');
  const recipientName = searchParams?.get('recipientName');
  
  // Debug user information
  useEffect(() => {
    console.log('🔍 User info:', { 
      userId, 
      userName, 
      userExists: !!user,
      userData: user 
    });
  }, [user, userId, userName]);

  // Debug URL parameters
  useEffect(() => {
    console.log('🔍 URL Parameters:', { 
      chatType, 
      recipientId, 
      recipientName 
    });
    // Reset the URL params handled ref when parameters change
    urlParamsHandledRef.current = false;
  }, [chatType, recipientId, recipientName]);
  
  // Recently viewed chats hook
  const { 
    recentChats, 
    addRecentChat, 
    updateUnreadCount, 
    updateLastMessage 
  } = useRecentlyViewedChats();

  // Event bus for pub/sub pattern
  const { subscribe, publish } = useEventBus();

  // State for groups and personal chats
  const [groupChats, setGroupChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  // Global personal chats store
  const {
    personalChats: rawPersonalChats,
    setPersonalChats,
    addPersonalChat,
    updatePersonalChat,
    ensureChatInList: ensureChatInGlobalList,
    moveChatToTop: moveChatToTopGlobal,
    setLoading: setPersonalChatsLoading,
    setError: setPersonalChatsError,
    clearError: clearPersonalChatsError
  } = usePersonalChatsStore();

  // Ensure personalChats is always an array
  const personalChats = Array.isArray(rawPersonalChats) ? rawPersonalChats : [];
  
  // Ref to track if we've already handled URL parameters to prevent infinite loops
  const urlParamsHandledRef = useRef(false);

  // Use global store loading state
  const loadingPersonalChats = usePersonalChatsStore(state => state.loading);
  const personalChatsError = usePersonalChatsStore(state => state.error);

  // Wrapper function to set selected chat and ensure it's in the list
  const selectChat = (chat: Chat | null) => {
    setSelectedChat(chat);
    if (chat && chat.type === 'personal') {
      // Convert Chat to PersonalChat type
      const personalChat = {
        id: chat.id,
        name: chat.name,
        type: 'personal' as const,
        profilePicture: chat.profilePicture,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        unreadCount: chat.unreadCount,
        isOnline: chat.isOnline,
        isMicEnabled: false
      };
      ensureChatInGlobalList(personalChat);
    }
  };
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Real-time state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Use the new socket hook
  const { socket, isConnected, isConnecting, error: socketError, sendMessage: sendSocketMessage, joinRoom, leaveRoom } = useSocket();
  
  // Enhanced chat features
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [showUnreadIndicator, setShowUnreadIndicator] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal state
  const [showStartRoomModal, setShowStartRoomModal] = useState(false);
  const [showAddUsersModal, setShowAddUsersModal] = useState(false);
  const [showStartPersonalChatModal, setShowStartPersonalChatModal] = useState(false);
  const [pendingRoomDetails, setPendingRoomDetails] = useState<{ roomTitle: string; micAccess: boolean } | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // File sharing state
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);



  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [lastCursor, setLastCursor] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Debounced and throttled functions
  const debouncedTypingIndicator = useMemo(
    () => createTypingDebounce(1000),
    []
  );



  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      // Perform search logic here
      console.log('Searching for:', query);
    }, 300),
    []
  );

  const throttledScrollToBottom = useMemo(
    () => throttle(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100),
    []
  );

  // Enhanced message read/unread tracking
  const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const messageObserverRef = useRef<IntersectionObserver | null>(null);

  // Enhanced mark messages as read with intersection observer
  const markMessagesAsRead = async (messageIds: string[] = []) => {
    if (!selectedChat || !userId) return;
    
    try {
      console.log('📖 Marking messages as read for chat:', selectedChat.id);
      
      // If no specific message IDs provided, get all unread messages
      const idsToMark = messageIds.length > 0 ? messageIds : 
        messages
          .filter(msg => !msg.isUser && !msg.readBy?.some(read => read.userId === userId))
          .map(msg => msg.id);
      
      if (idsToMark.length === 0) {
        console.log('📖 No unread messages to mark');
        return;
      }
      
      console.log('📖 Marking', idsToMark.length, 'messages as read');
      
      const response = await axios.post('/api/messages/mark-read', {
        messageIds: idsToMark,
        chatId: selectedChat.id,
        chatType: selectedChat.type
      }, { withCredentials: true });
      
      if (response.data.success) {
        console.log('✅ Messages marked as read successfully');
        
        // Update local state
        setReadMessages(prev => new Set([...prev, ...idsToMark]));
        setUnreadMessages(prev => {
          const newSet = new Set(prev);
          idsToMark.forEach(id => newSet.delete(id));
          return newSet;
        });
        
        // Update message read status in UI
        setMessages(prev => prev.map(msg => 
          idsToMark.includes(msg.id) 
            ? { ...msg, readBy: [...(msg.readBy || []), { userId, timestamp: new Date() }] }
            : msg
        ));
        
        // Update unread count for this chat
        updateChatUnreadCount(selectedChat.id, -idsToMark.length);
        
        // Emit read status via socket
        socket?.emit('message_read_enhanced', {
          messageIds: idsToMark,
          roomId: selectedChat.id,
          readBy: userId
        });
        
      } else {
        console.error('❌ Failed to mark messages as read:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Error marking messages as read:', error);
      console.error('❌ Error response:', error.response?.data);
    }
  };

  // Update chat unread count in the sidebar
  const updateChatUnreadCount = (chatId: string, change: number) => {
    setGroupChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, unreadCount: Math.max(0, (chat.unreadCount || 0) + change) }
        : chat
    ));
    
    setPersonalChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, unreadCount: Math.max(0, (chat.unreadCount || 0) + change) }
        : chat
    ));
  };

  // Setup intersection observer for automatic read detection
  useEffect(() => {
    if (!selectedChat || !userId) return;

    // Cleanup previous observer
    if (messageObserverRef.current) {
      messageObserverRef.current.disconnect();
    }

    // Create new intersection observer
    messageObserverRef.current = new IntersectionObserver(
      (entries) => {
        const unreadMessageIds: string[] = [];
        
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId && !readMessages.has(messageId) && !unreadMessages.has(messageId)) {
              unreadMessageIds.push(messageId);
            }
          }
        });
        
        // Mark messages as read if any unread messages came into view
        if (unreadMessageIds.length > 0) {
          markMessagesAsRead(unreadMessageIds);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // Message is considered "read" when 50% visible
      }
    );

    // Observe all unread messages
    const unreadMessageElements = document.querySelectorAll('[data-message-id]');
    unreadMessageElements.forEach(element => {
      const messageId = element.getAttribute('data-message-id');
      if (messageId && !readMessages.has(messageId)) {
        messageObserverRef.current?.observe(element);
      }
    });

    return () => {
      if (messageObserverRef.current) {
        messageObserverRef.current.disconnect();
      }
    };
  }, [selectedChat, userId, messages, readMessages, unreadMessages]);

  // Mark all messages as read when entering a chat
  useEffect(() => {
    if (selectedChat && userId) {
      const unreadMessageIds = messages
        .filter(msg => !msg.isUser && !msg.readBy?.some(read => read.userId === userId))
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        // Small delay to ensure UI is rendered
        setTimeout(() => {
          markMessagesAsRead(unreadMessageIds);
        }, 500);
      }
    }
  }, [selectedChat?.id, userId]);

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
    setLoadingGroups(true);
    setGroupError(null);
      try {
        console.log('🔍 Fetching groups for user:', userId);
        const response = await axios.get('/api/group/my-groups', { withCredentials: true });
        console.log('📦 Groups response:', response.data);
        
        if (response.data.success) {
          const groups = response.data.data.map((group: any) => ({
            id: group._id,
            name: group.name,
            type: 'group' as const,
            profilePicture: group.avatar,
            memberCount: group.members?.length || 0,
            onlineCount: group.onlineCount || 0,
            
            members: group.members || [],
            lastMessage: group.lastMessage || '',
            lastMessageTime: group.lastMessageTime || new Date(),
            unreadCount: group.unreadCount || 0
          }));
          console.log('✅ Groups processed:', groups);
        setGroupChats(groups);
        } else {
          console.error('❌ Groups API returned success: false:', response.data);
          setGroupError('Failed to load groups');
        }
      } catch (error: any) {
        console.error('❌ Error fetching groups:', error);
        console.error('❌ Error response:', error.response?.data);
        setGroupError(error.response?.data?.message || 'Failed to load groups');
        toast.error('Failed to load groups');
      } finally {
        setLoadingGroups(false);
      }
    };

    if (userId) {
      fetchGroups();
    }
  }, [userId]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Fetch personal chats from backend
  useEffect(() => {
    // Don't fetch if user is not authenticated
    if (!user || !user._id) {
      console.log('❌ User not authenticated, skipping personal chats fetch');
      setPersonalChatsLoading(false);
      setPersonalChatsError('Please log in to view personal chats');
      return;
    }
    
    setPersonalChatsLoading(true);
    clearPersonalChatsError();
    
    console.log('🔍 Fetching personal chats for user:', userId);
    
    axios.get('/api/conversations', { withCredentials: true })
      .then(res => {
        console.log('📦 Personal chats response:', res.data);
        console.log('📦 Response status:', res.status);
        
        if (!res.data.success) {
          console.error('❌ Personal chats API returned success: false:', res.data);
          setPersonalChats([]);
          setPersonalChatsError('Failed to load personal chats');
          return;
        }
        
        // Extract personal conversations from the response
        const personalConversations = res.data.data?.personal || [];
        console.log('📦 Raw personal conversations:', personalConversations);
        
        const conversations = personalConversations
          .filter((conv: any) => conv && conv.recipient && conv.recipient._id)
          .map((conv: any) => ({
            id: conv.recipient._id,
            name: conv.recipient.name || 'Unknown User',
            type: 'personal' as const,
            profilePicture: conv.recipient.profilePicture,
            lastMessage: conv.lastMessage?.content || '',
            lastMessageTime: conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt) : new Date(),
            unreadCount: conv.unreadCount || 0,
            isOnline: conv.recipient.isOnline || false,
            isMicEnabled: false
          }))
          .filter((chat: any, index: number, array: any[]) => 
            array.findIndex((c: any) => c.id === chat.id) === index
          );
        
        console.log('✅ Personal chats processed:', conversations);
        setPersonalChats(conversations);
      })
      .catch(error => {
        console.error('❌ Error fetching personal chats:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        
        // Set empty array to prevent map errors
        setPersonalChats([]);
        
        // Handle different error types with better messages
        if (error.response?.status === 401) {
          const errorMessage = 'Please log in to view personal chats';
          setPersonalChatsError(errorMessage);
          toast.error('Authentication required. Please log in.');
        } else if (error.response?.status === 500) {
          const errorMessage = 'Server error. Please try again later.';
          setPersonalChatsError(errorMessage);
          toast.error('Server error. Please try again later.');
        } else {
          const errorMessage = error.response?.data?.message || 'Failed to load personal chats';
          setPersonalChatsError(errorMessage);
          toast.error('Failed to load personal chats');
        }
      })
      .finally(() => {
        setPersonalChatsLoading(false);
      });
  }, [user, userId, chatType, recipientId, recipientName]);

  // Handle URL parameter selection separately to avoid infinite loops
  useEffect(() => {
    if (chatType === 'personal' && recipientId && recipientName && !selectedChat && personalChats.length > 0 && !urlParamsHandledRef.current) {
      urlParamsHandledRef.current = true;
      
      // Check if the chat already exists in personalChats
      const existingChat = personalChats.find((chat: any) => chat.id === recipientId);
      if (existingChat) {
        console.log('🎯 Selecting existing personal chat from URL params:', existingChat);
        selectChat(existingChat);
      } else {
        // Create new personal chat if it doesn't exist
        console.log('🎯 Creating new personal chat from URL params:', { recipientId, recipientName });
        
        // Create the chat on the backend first
        const createChatOnBackend = async () => {
          try {
            const response = await axios.post('/api/chats', {
              memberId: recipientId
            }, { withCredentials: true });
            
            if (response.data.success) {
              console.log('✅ Personal chat created on backend from URL params:', response.data);
            } else {
              console.warn('⚠️ Backend chat creation failed from URL params, but continuing locally:', response.data);
            }
          } catch (backendError: any) {
            console.warn('⚠️ Backend chat creation failed from URL params, but continuing locally:', backendError.response?.data || backendError.message);
            // Continue with local creation even if backend fails
          }
        };
        
        // Call the async function
        createChatOnBackend();
        
        const newPersonalChat = {
          id: recipientId,
          name: decodeURIComponent(recipientName),
          type: 'personal' as const,
          profilePicture: '',
          isMicEnabled: false,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: 0,
        };
        addPersonalChat(newPersonalChat);
        selectChat(newPersonalChat);
      }
    }
  }, [chatType, recipientId, recipientName, personalChats]);

  // Socket connection is now handled by useSocket hook
  // Debug: Listen for all group avatar events
  useEffect(() => {
    if (!socket) return;
    
    const handleGroupAvatarUpdated = (data: any) => {
      console.log('ModernChatRoom received group:avatar-updated event:', data);
    };
    
    socket.on('group:avatar-updated', handleGroupAvatarUpdated);
    
    return () => {
      socket.off('group:avatar-updated', handleGroupAvatarUpdated);
    };
  }, [socket]);

  // Real-time group update logic
  useEffect(() => {
    if (!socket) return;
    const handleGroupUpdated = (updatedGroup: any) => {
      // Validate the updated group data
      if (!updatedGroup || (!updatedGroup._id && !updatedGroup.id)) {
        console.warn('Received invalid group update data:', updatedGroup);
        return;
      }

      const groupId = updatedGroup._id || updatedGroup.id;
      setGroupChats(prev =>
        prev.map(group =>
          group.id === groupId
            ? {
                ...group,
                profilePicture: updatedGroup.profilePicture,
                memberCount: updatedGroup.memberCount || 0,
                onlineCount: updatedGroup.onlineCount || 0,
                name: updatedGroup.name || group.name,
                members: updatedGroup.members || [],
              }
            : group
        )
      );
      if (selectedChat && selectedChat.id === groupId) {
        setSelectedChat(prev =>
          prev
            ? {
                ...prev,
                profilePicture: updatedGroup.profilePicture,
                memberCount: updatedGroup.memberCount || 0,
                onlineCount: updatedGroup.onlineCount || 0,
                name: updatedGroup.name || prev.name,
                members: updatedGroup.members || [],
              }
            : prev
        );
      }
    };
    socket.on('group-updated', handleGroupUpdated);
    
    const handleGroupAvatarUpdated = (data: { groupId: string; avatar: string }) => {
      console.log('Group avatar updated in ModernChatRoom:', data);
      
      // Update group in the list
      setGroupChats(prev =>
        prev.map(group =>
          group.id === data.groupId
            ? {
                ...group,
                profilePicture: data.avatar,
              }
            : group
        )
      );
      
      // Update selected chat if it's the same group
      if (selectedChat && selectedChat.id === data.groupId) {
        setSelectedChat(prev =>
          prev
            ? {
                ...prev,
                profilePicture: data.avatar,
              }
            : prev
        );
      }
    };
    
    socket.on('group:avatar-updated', handleGroupAvatarUpdated);
    
    return () => {
      socket.off('group-updated', handleGroupUpdated);
      socket.off('group:avatar-updated', handleGroupAvatarUpdated);
    };
  }, [socket, selectedChat]);

  // Join/leave room on chat switch
  useEffect(() => {
    if (!socket || !selectedChat) return;
    
    // Authenticate socket connection first
    socket.emit('authenticate');
    
    // Join appropriate room based on chat type
    if (selectedChat.type === 'group') {
      socket.emit('joinRoom', { roomName: selectedChat.id });
    } else {
      // For personal chats, join a room with both user IDs sorted
      const roomName = [userId, selectedChat.id].sort().join('_');
      socket.emit('joinRoom', { roomName });
    }
    
    return () => {
      if (selectedChat.type === 'group') {
        socket.emit('leaveRoom', { roomName: selectedChat.id });
      } else {
        const roomName = [userId, selectedChat.id].sort().join('_');
        socket.emit('leaveRoom', { roomName });
      }
    };
  }, [socket, selectedChat, userId]);

  // Enhanced socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 Setting up socket event listeners');

    // Listen for new messages
    socket.on('new-message', (data: any) => {
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
        if (selectedChat.type === 'personal') {
          moveChatToTopGlobal(selectedChat.id, newMsg.content, newMsg.timestamp);
        }

        // Mark message as read
        markMessagesAsRead([newMsg.id]);
      }
    });

    // Listen for typing indicators
    socket.on('typing-indicator', (data: any) => {
      console.log('⌨️ Typing indicator:', data);
      if (selectedChat && data.roomName === selectedChat.id) {
        setTypingUsers(prev => {
          const newTypingUsers = data.isTyping 
            ? [...prev.filter(id => id !== data.userId), data.userId]
            : prev.filter(id => id !== data.userId);
          return newTypingUsers;
        });
      }
    });

    // Listen for message delivery status
    socket.on('message-delivered', (data: any) => {
      console.log('✅ Message delivered:', data);
      // Update message delivery status in UI
    });

    // Listen for message read status
    socket.on('message-read', (data: any) => {
      console.log('👁️ Message read:', data);
      // Update message read status in UI
    });

    // Listen for personal chat updates
    socket.on('personal-chat-updated', (data: any) => {
      console.log('🔄 Personal chat updated:', data);
      refreshPersonalChats();
    });

    // Listen for user status changes
    socket.on('user-status', (data: any) => {
      console.log('👤 User status changed:', data);
      // Update online status in personal chats
      setPersonalChats((prev: any[]) => 
        prev.map((chat: any) => 
          chat.id === data.userId 
            ? { ...chat, isOnline: data.isOnline }
            : chat
        )
      );
    });

    return () => {
      console.log('🔌 Cleaning up socket event listeners');
      socket.off('new-message');
      socket.off('typing-indicator');
      socket.off('message-delivered');
      socket.off('message-read');
      socket.off('personal-chat-updated');
      socket.off('user-status');
    };
  }, [socket, isConnected, selectedChat, userId]);

  // Enhanced message loading with cursor-based pagination
  useEffect(() => {
    if (!selectedChat) return;
    console.log('🔍 Loading messages for chat:', selectedChat.id, 'Type:', selectedChat.type);
    
    setIsLoadingMessages(true);
    setMessages([]); // Clear previous messages
    setHasMoreMessages(true);
    setLastCursor(null);
    
    // Join the appropriate room for real-time messages
    if (isConnected) {
      console.log('🔌 Joining room for chat:', selectedChat.id);
      
      // Join appropriate room based on chat type
      if (selectedChat.type === 'group') {
        joinRoom(selectedChat.id);
        console.log('✅ Joined group room:', selectedChat.id);
      } else {
        // For personal chats, create a room name from both user IDs
        const roomName = [userId, selectedChat.id].sort().join('_');
        joinRoom(roomName);
        console.log('✅ Joined personal room:', roomName);
      }
    } else {
      console.warn('⚠️ Socket not connected, cannot join room');
    }
    
    // Load initial messages
    const loadInitialMessages = async () => {
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
          
          // Mark messages as read
          if (formattedMessages.length > 0) {
            markMessagesAsRead();
          }
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
    };

    loadInitialMessages();
  }, [selectedChat, userId, isConnected, joinRoom]);

  // Enhanced load more messages function with cursor-based pagination
  const loadMoreMessages = async () => {
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
  };

  // Enhanced send message function
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) {
      console.log('❌ Cannot send message: no content or no selected chat');
      return;
    }
    
    const messageContent = newMessage.trim();
    const currentTime = new Date();
    const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    console.log('📤 Starting message send process...');
    console.log('💬 Message content:', messageContent);
    console.log('👤 User ID:', userId);
    console.log('🔗 Socket connected:', isConnected);
    console.log('💬 Selected chat:', selectedChat);
    
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
    
    // Ensure the selected chat is in the personal chats list
    if (selectedChat.type === 'personal') {
      ensureChatInGlobalList(selectedChat as any);
    }
    
    // Move chat to top immediately when user sends a message
    moveChatToTopGlobal(selectedChat.id, messageContent, currentTime);
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    // Prepare message data for both socket and API
    const messageData = {
      text: messageContent,
      roomName: selectedChat.type === 'group' ? selectedChat.id : [userId, selectedChat.id].sort().join('_'),
      groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
      recipientId: selectedChat.type === 'personal' ? selectedChat.id : undefined,
      sender: userId,
    };
    
    console.log('📤 Prepared message data:', messageData);
    
    // Try socket first, then fallback to API
    let messageSent = false;
    
    if (isConnected && socket) {
      try {
        console.log('🔌 Attempting to send via socket...');
        const success = await sendSocketMessage(messageData);
        if (success) {
          console.log('✅ Message sent successfully via socket');
          messageSent = true;
          // Remove optimistic message and let the real message come through socket
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMsg.id));
        } else {
          console.log('❌ Socket send failed, trying API fallback');
        }
      } catch (error) {
        console.error('❌ Socket send error:', error);
      }
    } else {
      console.log('❌ Socket not connected, using API directly');
    }
    
    // Fallback to API if socket failed or not connected
    if (!messageSent) {
      try {
        console.log('📡 Sending message via API fallback...');
        await sendMessageViaAPI(messageContent, optimisticMsg);
        messageSent = true;
      } catch (error) {
        console.error('❌ API send also failed:', error);
        // Remove optimistic message if both socket and API failed
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMsg.id));
        toast.error('Failed to send message. Please try again.');
      }
    }
  };

  // API fallback for sending messages
  const sendMessageViaAPI = async (content: string, tempMessage: Message) => {
    try {
      console.log('📡 Sending message via API fallback...');
      
      if (!selectedChat) {
        throw new Error('No selected chat');
      }
      
      const messageData = {
        content: content,
        groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
        recipientId: selectedChat.type === 'personal' ? selectedChat.id : undefined,
      };
      
      console.log('📡 API message data:', messageData);
      console.log('📡 API endpoint: /api/messages/send-message');
      
      const response = await axios.post('/api/messages/send-message', messageData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 API response status:', response.status);
      console.log('📡 API response data:', response.data);
      
      if (response.data.success) {
        console.log('✅ Message sent successfully via API');
        // Update the message with the real ID from server
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, id: response.data.data?._id || response.data.data?.id || `api-${selectedChat.id}-${Date.now()}` }
              : msg
          )
        );
        
        // Update personal chat list with new message and move to top
        if (selectedChat.type === 'personal') {
          setPersonalChats((prev: any[]) => {
            const updated = prev.map((chat: any) => 
              chat.id === selectedChat.id 
                ? { ...chat, lastMessage: content, lastMessageTime: new Date() }
                : chat
            );
            return sortChatsByActivity(updated);
          });
        }
        
        // Update group chat list if it's a group message
        if (selectedChat.type === 'group') {
          setGroupChats(prev => {
            const updated = prev.map(chat => 
              chat.id === selectedChat.id 
                ? { ...chat, lastMessage: content, lastMessageTime: new Date() }
                : chat
            );
            return sortChatsByActivity(updated);
          });
        }
      } else {
        console.error('❌ API send failed:', response.data);
        throw new Error(response.data.message || 'API send failed');
      }
    } catch (error: any) {
      console.error('❌ API send error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Remove the message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      
      // Show appropriate error message
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You are not authorized to send messages in this chat.');
      } else if (error.response?.status === 404) {
        toast.error('Chat not found. Please refresh and try again.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
      
      throw error; // Re-throw to be handled by caller
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Enhanced typing indicator with debounce
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing-start', { roomId: selectedChat?.id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing-stop', { roomId: selectedChat?.id });
    }, 2000); // 2 second debounce
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      socket?.emit('typing-stop', { roomId: selectedChat?.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Send push notification
  const sendPushNotification = (message: any) => {
    if (notificationPermission === 'granted' && (message.sender?._id !== userId && message.sender !== userId)) {
      const notification = new Notification(`New message from ${message.sender?.name}`, {
        body: message.content,
        icon: message.sender?.profilePicture || '/default-profile.svg',
        badge: '/default-profile.svg',
        tag: `message-${selectedChat?.id}`,
        requireInteraction: false,
        silent: false
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        // Scroll to the message
        const messageElement = document.getElementById(`message-${message._id || message.id}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth' });
        }
      };
    }
  };

  // Enhanced typing indicator with rate limiting
  const handleTypingStartEnhanced = () => {
    if (!selectedChat) return;

    debouncedTypingIndicator(() => {
      // Stop typing indicator
      socket?.emit('typing-stop', { roomId: selectedChat.id });
    });

    // Start typing indicator
    chatEvents.publishTypingStart(userId, selectedChat.id);
  };



  // Enhanced search with binary search
  const handleSearch = (query: string) => {
    debouncedSearch(query);
  };

  // Jump to message by timestamp
  const handleJumpToMessage = (timestamp: Date | string) => {
    // Convert messages to the expected format
    const convertedMessages = messages.map(msg => ({
      _id: msg.id,
      createdAt: msg.timestamp,
      content: msg.content,
      sender: msg.sender
    }));
    
    const index = binarySearchByTimestamp(convertedMessages, timestamp);

    if (index === -1) {
      toast.error('Message not found');
    }
  };

  // Function to deduplicate messages
  const deduplicateMessages = (messages: Message[]): Message[] => {
    const seen = new Set();
    return messages.filter(msg => {
      const key = `${msg.id}-${msg.content}-${msg.sender}-${msg.timestamp.getTime()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  // Handle receiving messages (legacy event)
  const handleReceive = (data: any) => {
    console.log('📨 Received message via receive_message:', data);
    // This is a legacy event, use handleNewMessage instead
    handleNewMessage(data);
  };

  // Function to refresh personal chats
  const refreshPersonalChats = async () => {
    // Don't fetch if user is not authenticated
    if (!user || !user._id) {
      console.log('❌ User not authenticated, skipping personal chats refresh');
      setPersonalChatsError('Please log in to view personal chats');
      return;
    }
    
    try {
      console.log('🔍 Fetching personal chats for user:', userId);
      const response = await axios.get('/api/conversations', { withCredentials: true });
      console.log('📦 Personal chats response:', response.data);
      
      if (response.data.success) {
        // Extract personal conversations from the response
        const personalConversations = response.data.data?.personal || [];
        console.log('📦 Raw personal conversations:', personalConversations);
        
        const conversations = personalConversations
          .filter((conv: any) => conv && conv.recipient && conv.recipient._id)
          .map((conv: any) => ({
            id: conv.recipient._id,
            name: conv.recipient.name || 'Unknown User',
            type: 'personal' as const,
            profilePicture: conv.recipient.profilePicture,
            lastMessage: conv.lastMessage?.content || '',
            lastMessageTime: conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt) : new Date(),
            unreadCount: conv.unreadCount || 0,
            isOnline: conv.recipient.isOnline || false,
            isMicEnabled: false,
          }))
          .filter((chat: any, index: number, array: any[]) => 
            array.findIndex((c: any) => c.id === chat.id) === index
          );
        
        console.log('✅ Personal chats processed:', conversations);
        setPersonalChats(conversations);
        
        // If we have URL parameters, make sure the chat is selected
        if (chatType === 'personal' && recipientId && recipientName) {
          const existingChat = conversations.find((chat: any) => chat.id === recipientId);
          if (existingChat && !selectedChat) {
            console.log('🎯 Selecting personal chat from URL params:', existingChat);
            selectChat(existingChat);
          }
        }
      } else {
        console.error('❌ Personal chats API returned success: false:', response.data);
        setPersonalChatsError('Failed to load personal chats');
      }
    } catch (error: any) {
      console.error('❌ Error fetching personal chats:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setPersonalChatsError('Please log in to view personal chats');
        toast.error('Authentication required. Please log in.');
      } else if (error.response?.status === 500) {
        setPersonalChatsError('Server error. Please try again later.');
        toast.error('Server error. Please try again later.');
      } else {
        setPersonalChatsError(error.response?.data?.message || 'Failed to load personal chats');
        toast.error('Failed to load personal chats');
      }
    }
  };

  // Enhanced chat sorting and unread count management
  const sortChatsByActivity = (chats: Chat[]): Chat[] => {
    return [...chats].sort((a, b) => {
      // First, sort by unread count (unread chats first)
      if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1;
      if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1;
      
      // Then sort by last message timestamp (most recent first)
      const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      
      return bTime - aTime;
    });
  };

  // Ensure chat exists in personal chats list when selected
  const ensureChatInList = (chat: Chat) => {
    if (chat.type === 'personal') {
      setPersonalChats(prev => {
        const chatExists = prev.some(c => c.id === chat.id);
        if (!chatExists) {
          console.log('➕ Adding selected chat to personal chats list:', chat.name);
          // Create a proper chat entry with all required fields
          const newChatEntry: Chat = {
            id: chat.id,
            name: chat.name,
            type: 'personal',
            profilePicture: chat.profilePicture,
            lastMessage: chat.lastMessage || '',
            lastMessageTime: chat.lastMessageTime || new Date(),
            unreadCount: chat.unreadCount || 0,
            isOnline: chat.isOnline || false,
            isMicEnabled: false
          };
          return [newChatEntry, ...prev];
        }
        return prev;
      });
    }
  };

  // Move chat to top when new message arrives
  const moveChatToTop = (chatId: string, lastMessage: string, lastMessageTime: Date) => {
    setGroupChats(prev => {
      const updated = prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, lastMessage, lastMessageTime, unreadCount: (chat.unreadCount || 0) + 1 }
          : chat
      );
      return sortChatsByActivity(updated);
    });
    
    setPersonalChats(prev => {
      const updated = prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, lastMessage, lastMessageTime, unreadCount: (chat.unreadCount || 0) + 1 }
          : chat
      );
      return sortChatsByActivity(updated);
    });
  };



  // Enhanced message receiving with chat sorting
    const handleNewMessage = (data: any) => {
      console.log('📨 Received new message:', data);
      
      // Check if this message belongs to the currently selected chat
      const isCurrentChat = selectedChat && (
        (selectedChat.type === 'personal' && 
         (data.recipientId === selectedChat.id || data.sender?._id === selectedChat.id)) ||
        (selectedChat.type === 'group' && data.groupId === selectedChat.id)
      );
      
      if (isCurrentChat) {
        console.log('✅ Message belongs to current chat, adding to messages');
        
        // Add message to current chat
        const newMessage: Message = {
          id: data._id || `temp_${Date.now()}`,
          sender: data.sender?._id || data.sender || 'unknown',
          content: data.content || data.message || '',
          time: formatMessageDate(new Date(data.createdAt || Date.now())),
          isUser: data.sender?._id === userId,
          timestamp: new Date(data.createdAt || Date.now()),
          messageType: 'text'
        };
        
        setMessages(prev => {
          const updated = [newMessage, ...prev];
          return deduplicateMessages(updated);
        });
        
        // Mark message as read if it's from someone else
        if (data.sender?._id !== userId) {
          markMessagesAsRead([data._id]);
          updateChatUnreadCount(selectedChat.id, -1);
        }
        
        // Update last message in chat list
        moveChatToTop(selectedChat.id, data.content || data.message || '', new Date(data.createdAt || Date.now()));
        
      } else {
        console.log('❌ Message does not belong to current chat, updating chat list');
        
        // Handle messages for personal chats that may not exist in the list yet
        if (data.recipientId || data.sender?._id) {
          const chatId = data.recipientId || data.sender?._id;
          const senderName = data.sender?.name || data.sender || 'Unknown User';
          
          setPersonalChats(prev => {
            // Check if chat already exists
            const existingChat = prev.find(chat => chat.id === chatId);
            
            if (existingChat) {
              // Update existing chat and move to top
              const updated = prev.map(chat => 
                chat.id === chatId 
                  ? { 
                      ...chat, 
                      lastMessage: data.content || data.message || '', 
                      lastMessageTime: new Date(data.createdAt || Date.now()),
                      unreadCount: chat.id !== selectedChat?.id ? (chat.unreadCount || 0) + 1 : (chat.unreadCount || 0)
                    }
                  : chat
              );
              return sortChatsByActivity(updated);
            } else {
              // Create new chat entry for first-time conversation
              console.log('🆕 Creating new chat entry for:', chatId, senderName);
              const newChat: Chat = {
                id: chatId,
                name: senderName,
                type: 'personal',
                profilePicture: data.sender?.profilePicture,
                lastMessage: data.content || data.message || '',
                lastMessageTime: new Date(data.createdAt || Date.now()),
                unreadCount: chatId !== selectedChat?.id ? 1 : 0,
                isOnline: data.sender?.isOnline || false
              };
              
              // Add new chat to the top of the list
              return sortChatsByActivity([newChat, ...prev]);
            }
          });
        }
        
        // Handle group messages
        if (data.groupId) {
          setGroupChats(prev => {
            const existingGroup = prev.find(chat => chat.id === data.groupId);
            
            if (existingGroup) {
              const updated = prev.map(chat => 
                chat.id === data.groupId 
                  ? { 
                      ...chat, 
                      lastMessage: data.content || data.message || '', 
                      lastMessageTime: new Date(data.createdAt || Date.now()),
                      unreadCount: chat.id !== selectedChat?.id ? (chat.unreadCount || 0) + 1 : (chat.unreadCount || 0)
                    }
                  : chat
              );
              return sortChatsByActivity(updated);
            }
            return prev;
          });
        }
      }
    };

    // Enhanced typing indicator handlers
    const handleTypingIndicator = (data: any) => {
      if (data.roomId === selectedChat?.id) {
        setTypingUsers(data.typingUsers || []);
      }
    };

    // Enhanced message delivery/read status handlers
    const handleMessageDelivered = (data: any) => {
      console.log('Message delivered:', data);
      // Update message delivery status in UI if needed
    };

    const handleMessageRead = (data: any) => {
      console.log('Message read:', data);
      // Update message read status in UI if needed
    };

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('🔌 Socket not ready:', { socket: !!socket, isConnected });
      return;
    }

    console.log('🔌 Setting up socket event listeners');
    console.log('🔌 Socket ID:', socket.id);
    console.log('🔌 User ID:', userId);

    // Listen for new messages
    socket.on('new-message', handleNewMessage);

    // Listen for typing indicators
    socket.on('typing-indicator', handleTypingIndicator);

    // Listen for message delivery status
    socket.on('message-delivered', handleMessageDelivered);

    // Listen for message read status
    socket.on('message-read', handleMessageRead);

    // Listen for personal chat updates
    socket.on('personal-chat-updated', (data: any) => {
      console.log('🔄 Personal chat updated:', data);
      refreshPersonalChats();
    });

    // Listen for user status changes
    socket.on('user-status', (data: any) => {
      console.log('👤 User status changed:', data);
      // Update online status in personal chats
      setPersonalChats((prev: any[]) => 
        prev.map((chat: any) => 
          chat.id === data.userId 
            ? { ...chat, isOnline: data.isOnline }
            : chat
        )
      );
    });

    // Listen for authentication events
    socket.on('authenticated', (data: any) => {
      console.log('✅ Socket authenticated:', data);
    });

    socket.on('auth_error', (error: any) => {
      console.error('❌ Socket authentication error:', error);
    });

    // Listen for connection events
    socket.on('connect', () => {
      console.log('🔌 Socket connected in chat room');
    });

    socket.on('disconnect', (reason: string) => {
      console.log('🔌 Socket disconnected in chat room:', reason);
    });

    return () => {
      console.log('🔌 Cleaning up socket event listeners');
      socket.off('new-message');
      socket.off('typing-indicator');
      socket.off('message-delivered');
      socket.off('message-read');
      socket.off('personal-chat-updated');
      socket.off('user-status');
      socket.off('authenticated');
      socket.off('auth_error');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, isConnected, selectedChat, userId]);

  // Handle file upload
  const handleFileUpload = async (fileData: {
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }) => {
    if (!selectedChat || !socket) return;

    setUploadingFile(true);
    try {
      // Create file message
      const fileMessage = {
        text: `📎 ${fileData.fileName}`,
        roomName: selectedChat.type === 'group' ? selectedChat.id : [userId, selectedChat.id].sort().join('_'),
        groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
        recipientId: selectedChat.type === 'personal' ? selectedChat.id : undefined,
        sender: userId,
        messageType: 'file',
        mediaUrl: fileData.url,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        fileType: fileData.fileType
      };

      // Send file message via socket
      socket.emit('send_message', fileMessage, (response: any) => {
        if (response && response.success) {
          toast.success('File sent successfully');
          setShowFileUploadModal(false);
        } else {
          toast.error('Failed to send file');
        }
      });

      // Refresh personal chats if this was a personal chat
      if (selectedChat.type === 'personal') {
        refreshPersonalChats();
      }
    } catch (error) {
      console.error('Error sending file:', error);
      toast.error('Failed to send file');
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle file button click
  const handleFileButtonClick = () => {
    if (!selectedChat) {
      toast.error('Please select a chat first');
      return;
    }
    setShowFileUploadModal(true);
  };

  const handleAddGroup = (newGroup: Chat) => {
    setGroupChats(prev => {
      // Check if group already exists to avoid duplicates
      const groupExists = prev.some((chat: Chat) => chat.id === newGroup.id);
      if (groupExists) {
        return prev;
      }
      return [...prev, newGroup];
    });
  };

  // Handle group creation from StartRoomModal
  useEffect(() => {
    if (!socket) return;
    
    const handleGroupCreated = (group: Chat) => {
      // Validate the group data
      if (!group || !group.id) {
        console.warn('Received invalid group created data:', group);
        return;
      }
      
      setGroupChats(prev => {
        // Check if group already exists to avoid duplicates
        const groupExists = prev.some(g => g.id === group.id);
        if (groupExists) {
          return prev;
        }
        return [...prev, group];
      });
      setSelectedChat(group);
      setShowStartRoomModal(false);
    };
    
    socket.on('group-created', handleGroupCreated);
    return () => {
      socket.off('group-created', handleGroupCreated);
    };
  }, [socket]);

  const handleProceedRoom = (roomTitle: string, micAccess: boolean) => {
    setPendingRoomDetails({ roomTitle, micAccess });
    setShowStartRoomModal(false);
    setShowAddUsersModal(true);
  };

  const handleStartPersonalChat = async (friendId: string, friendName: string) => {
    try {
      // Validate inputs
      if (!friendId || friendId === 'undefined' || friendId === 'null') {
        console.error('❌ Invalid friendId provided:', friendId);
        toast.error('Invalid friend ID. Please try again.');
        return;
      }

      if (!friendName || friendName === 'undefined' || friendName === 'null') {
        console.error('❌ Invalid friendName provided:', friendName);
        toast.error('Invalid friend name. Please try again.');
        return;
      }

      console.log('🚀 Starting personal chat with:', friendId, friendName);
      
      // Fetch user details for the friend
      const userDetails = await fetchUserDetails(friendId);
      
      // Create a new personal chat object
      const newChat: Chat = {
        id: friendId,
        name: friendName,
        type: 'personal',
        profilePicture: userDetails?.profilePicture,
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
        isOnline: false
      };

      // Check if chat already exists locally
      const chatExists = personalChats.some(chat => chat.id === friendId);
      
      if (chatExists) {
        // Move existing chat to top with updated timestamp
        const existingChat = personalChats.find(chat => chat.id === friendId)!;
        const updatedChat = { ...existingChat, lastMessageTime: new Date() };
        console.log('🔄 Moving existing chat to top:', friendName);
        setPersonalChats([updatedChat, ...personalChats.filter(chat => chat.id !== friendId)]);
      } else {
        // Create the chat on the backend first
        console.log('🔄 Creating personal chat on backend...');
        try {
          const response = await axios.post('/api/chats', {
            memberId: friendId
          }, { withCredentials: true });
          
          if (response.data.success) {
            console.log('✅ Personal chat created on backend:', response.data);
          } else {
            console.warn('⚠️ Backend chat creation failed, but continuing locally:', response.data);
          }
        } catch (backendError: any) {
          console.warn('⚠️ Backend chat creation failed, but continuing locally:', backendError.response?.data || backendError.message);
          // Continue with local creation even if backend fails
        }
        
        // Add to local state
        console.log('➕ Adding new chat to list:', friendName);
        setPersonalChats([newChat, ...personalChats]);
        
        // Refresh personal chats from backend to ensure consistency
        setTimeout(() => {
          refreshPersonalChats().catch((refreshError) => {
            console.warn('⚠️ Failed to refresh personal chats:', refreshError);
          });
        }, 1000); // Small delay to ensure backend has processed the creation
      }

      // Select the new chat
      selectChat(newChat);
      
      // Join personal chat room via socket
      if (socket) {
        const roomName = [userId, friendId].sort().join('_');
        console.log('🔌 Joining personal chat room:', roomName);
        socket.emit('joinRoom', { roomName });
      }
      
      // Show success message
      toast.success(`Started chat with ${friendName}`);
      
      console.log('✅ Personal chat started successfully');
    } catch (error: any) {
      console.error('❌ Error starting personal chat:', error);
      toast.error('Failed to start chat. Please try again.');
    }
  };



  // Handle new messages and notifications
  useEffect(() => {
    if (!socket) return;
    
    const handleGroupAdded = (payload: { groupId: string; groupName: string }) => {
      // Validate the payload
      if (!payload || !payload.groupId || !payload.groupName) {
        console.warn('Received invalid group added payload:', payload);
        return;
      }
      
      const newGroup: Chat = {
        id: payload.groupId,
        name: payload.groupName,
        type: 'group',
        isMicEnabled: false,
        memberCount: 1,
        onlineCount: 1,
      };
      
      setGroupChats(prev => {
        // Check if group already exists to avoid duplicates
        const groupExists = prev.some(g => g.id === newGroup.id);
        if (groupExists) {
          return prev;
        }
        return [...prev, newGroup];
      });
      toast.success(`Added to group: ${payload.groupName}`);
    };
    
    const handleNotification = ({ message }: any) => {
      toast.info(message);
    };
    
    socket.on('group-added', handleGroupAdded);
    socket.on('notification', handleNotification);
    
    return () => {
      socket.off('group-added', handleGroupAdded);
      socket.off('notification', handleNotification);
    };
  }, [socket, selectedChat, userId]);

  const handleAboutButtonClick = () => {
    setShowAboutModal(true);
  };

  const handleGroupUpdate = () => {
    // Refresh group list
    window.location.reload();
  };

  const handleGroupDelete = () => {
    setGroupChats(prev => {
      const updated = prev.filter(group => group.id !== selectedChat?.id);
      if (updated.length > 0) {
        setSelectedChat(updated[0]);
      } else if (updated.length === 0) {
        setSelectedChat(null);
      }
      return updated;
    });
  };

  const handleAddMember = async (memberId: string) => {
    if (!selectedChat) return;
    
    try {
      const response = await axios.post('/api/group/add-member', {
        groupId: selectedChat.id,
        memberId: memberId
      });
      
      if (response.data.statusCode === 200) {
        toast.success('Member added successfully!');
        // Optionally refresh the group data or update the UI
        // You might want to fetch updated group info here
      } else {
        toast.error(response.data.message || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member. Please try again.');
    }
  };

  // Function to fetch user details for a personal chat
  const fetchUserDetails = async (userId: string) => {
    try {
      // Validate userId before making the request
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('❌ Invalid userId provided to fetchUserDetails:', userId);
        return null;
      }

      console.log('🔍 Fetching user details for userId:', userId);
      const response = await axios.get(`/api/user/${userId}`, { withCredentials: true });
      
      if (response.data.success) {
        const userData = response.data.data;
        console.log('✅ User details fetched successfully:', userData);
        return {
          id: userData._id,
          name: userData.name,
          profilePicture: userData.profilePicture || '',
        };
      }
    } catch (error: any) {
      console.error('❌ Error fetching user details:', error);
      if (error.response?.status === 400) {
        console.error('❌ Bad request - invalid user ID format');
      } else if (error.response?.status === 404) {
        console.error('❌ User not found');
      }
    }
    return null;
  };

  // Add chat to recently viewed when selected
  useEffect(() => {
    if (selectedChat) {
      addRecentChat({
        id: selectedChat.id,
        type: selectedChat.type,
        name: selectedChat.name,
        unreadCount: selectedChat.unreadCount || 0,
        lastMessage: selectedChat.lastMessage,
        profilePicture: selectedChat.profilePicture
      });
    }
  }, [selectedChat, addRecentChat]);

  // Update unread count when new messages arrive
  useEffect(() => {
    if (selectedChat && unreadCount > 0) {
      updateUnreadCount(selectedChat.id, unreadCount);
    }
  }, [unreadCount, selectedChat, updateUnreadCount]);

  // Update last message when new message is received
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.content) {
        updateLastMessage(selectedChat.id, lastMessage.content);
      }
    }
  }, [messages, selectedChat, updateLastMessage]);

  // Enhanced message sending with rate limiting
  const sendMessage = async (content: string) => {
    console.log('🚀 sendMessage called with:', { content, selectedChat, socket: !!socket, isConnected });
    
    if (!content.trim() || !selectedChat || !socket) {
      console.warn('❌ Cannot send message:', { 
        hasContent: !!content.trim(), 
        hasSelectedChat: !!selectedChat, 
        hasSocket: !!socket 
      });
      return;
    }

    try {
      console.log('📤 Sending message:', { 
        content: content.substring(0, 50) + '...', 
        chatType: selectedChat.type, 
        chatId: selectedChat.id 
      });

      const messageData = {
        content: content.trim(),
        ...(selectedChat.type === 'group' 
          ? { groupId: selectedChat.id }
          : { recipientId: selectedChat.id }
        )
      };

      console.log('📦 Message data:', messageData);

      // Create optimistic message immediately for instant UI feedback
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: userName,
        content: content.trim(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isUser: true,
        timestamp: new Date(),
      };

      // Add optimistic message to UI immediately
      setMessages(prev => deduplicateMessages([...prev, optimisticMsg]));
      setNewMessage('');

      // Scroll to bottom immediately
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        // Also scroll the container to bottom
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);

      // Send via Socket.IO for real-time delivery
      console.log('📡 Emitting socket event:', 'send_message', messageData);
      socket.emit('send_message', messageData);

      // Also send via REST API for persistence
      const response = await axios.post('/api/messages', messageData, {
        withCredentials: true
      });

      console.log('✅ Message sent successfully:', response.data);

      // Update the optimistic message with the real message ID from server
      if (response.data.success && response.data.data?._id) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMsg.id 
              ? { ...msg, id: response.data.data._id }
              : msg
          )
        );
      }

      // Update last message in chat list
      if (selectedChat.type === 'group') {
        setGroupChats(prev =>
          prev.map(chat =>
            chat.id === selectedChat.id
              ? { ...chat, lastMessage: content.trim(), lastMessageTime: new Date() }
              : chat
          )
        );
      } else {
        setPersonalChats(prev =>
          prev.map(chat =>
            chat.id === selectedChat.id
              ? { ...chat, lastMessage: content.trim(), lastMessageTime: new Date() }
              : chat
          )
        );
      }

    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Remove the optimistic message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
      
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      
      if (isAtBottom) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    }
  }, [messages]);

  // Handle scroll to load more messages
  const handleScroll = () => {
    if (!messagesContainerRef.current || isLoadingMore || !hasMoreMessages) return;
    
    const { scrollTop } = messagesContainerRef.current;
    
    // Load more messages when user scrolls to the top (within 100px)
    if (scrollTop < 100) {
      loadMoreMessages();
    }
  };

  // Add scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messagesContainerRef, isLoadingMore, hasMoreMessages]);

  // Comprehensive test function to verify all functionality
  const runComprehensiveTest = async () => {
    console.log('🧪 Starting comprehensive chat functionality test...');
    
    try {
      // Test 1: User authentication
      console.log('🧪 Test 1: User Authentication');
      console.log('✅ User ID:', userId);
      console.log('✅ User Name:', userName);
      console.log('✅ User exists:', !!user);
      
      // Test 2: Socket connection
      console.log('🧪 Test 2: Socket Connection');
      console.log('✅ Socket connected:', !!socket);
      console.log('✅ Socket ID:', socket?.id);
      
      // Test 3: Groups loading
      console.log('🧪 Test 3: Groups Loading');
      console.log('✅ Groups count:', groupChats.length);
      console.log('✅ Groups data:', groupChats);
      
      // Test 4: Personal chats loading
      console.log('🧪 Test 4: Personal Chats Loading');
      console.log('✅ Personal chats count:', personalChats.length);
      console.log('✅ Personal chats data:', personalChats);
      
      // Test 5: Selected chat
      console.log('🧪 Test 5: Selected Chat');
      console.log('✅ Selected chat:', selectedChat);
      
      // Test 6: Messages loading
      console.log('🧪 Test 6: Messages Loading');
      console.log('✅ Messages count:', messages.length);
      console.log('✅ Messages data:', messages.slice(0, 3)); // Show first 3 messages
      
      // Test 7: API endpoints
      console.log('🧪 Test 7: API Endpoints');
      try {
        const groupsResponse = await axios.get('/api/group/my-groups', { withCredentials: true });
        console.log('✅ Groups API working:', groupsResponse.status === 200);
      } catch (error: any) {
        console.error('❌ Groups API failed:', error.response?.status);
      }
      
      try {
        const conversationsResponse = await axios.get('/api/messages/conversations', { withCredentials: true });
        console.log('✅ Conversations API working:', conversationsResponse.status === 200);
      } catch (error: any) {
        console.error('❌ Conversations API failed:', error.response?.status);
      }
      
      console.log('🎉 Comprehensive test completed!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  };

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat && userId) {
      console.log('🔄 Loading messages for selected chat:', selectedChat.id, selectedChat.type);
      setIsLoadingMessages(true);
      setMessages([]); // Clear previous messages
      setHasMoreMessages(true);
      setLastCursor(null);
      
      // Join the appropriate room for real-time messages
      if (socket && isConnected) {
        console.log('🔌 Joining room for chat:', selectedChat.id);
        
        // Authenticate socket connection first
        socket.emit('authenticate');
        
        // Join appropriate room based on chat type
        if (selectedChat.type === 'group') {
          socket.emit('joinRoom', { roomName: selectedChat.id });
          console.log('✅ Joined group room:', selectedChat.id);
        } else {
          // For personal chats, create a room name from both user IDs
          const roomName = [userId, selectedChat.id].sort().join('_');
          socket.emit('joinRoom', { roomName });
          console.log('✅ Joined personal room:', roomName);
        }
      } else {
        console.warn('⚠️ Socket not connected, cannot join room');
      }
      
      // Load initial messages
      const loadInitialMessages = async () => {
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
              setHasMoreMessages(pagination.page < pagination.pages);
              setLastCursor(pagination.page < pagination.pages ? pagination.page + 1 : null);
            }
            
            console.log(`✅ Loaded ${formattedMessages.length} initial messages`);
            
            // Scroll to bottom after messages load
            setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
              }
            }, 100);
          }
        } catch (error) {
          console.error('❌ Error loading initial messages:', error);
          toast.error('Failed to load messages');
        } finally {
          setIsLoadingMessages(false);
        }
      };
      
      loadInitialMessages();
    }
  }, [selectedChat, userId]);

  // Run test on component mount
  useEffect(() => {
    if (userId && socket) {
      setTimeout(runComprehensiveTest, 2000); // Wait for everything to load
    }
  }, [userId, socket, groupChats.length, personalChats.length]);

  // Test message fetching specifically
  const testMessageFetching = async () => {
    console.log('🧪 Testing message fetching...');
    
    if (!selectedChat) {
      console.log('❌ No chat selected for testing');
      return;
    }
    
    try {
      console.log('🧪 Testing messages for chat:', selectedChat.id, 'Type:', selectedChat.type);
      
      const params = selectedChat.type === 'group' 
        ? { groupId: selectedChat.id, limit: 10 }
        : { recipientId: selectedChat.id, limit: 10 };
      
      console.log('🧪 Test params:', params);
      
      const response = await axios.get('/api/messages', { 
        params,
        withCredentials: true 
      });
      
      console.log('🧪 Test response status:', response.status);
      console.log('🧪 Test response data:', response.data);
      
      if (response.data.success) {
        console.log('✅ Message fetching test PASSED');
        console.log('✅ Messages found:', response.data.data?.length || 0);
        console.log('✅ Sample messages:', response.data.data?.slice(0, 3));
      } else {
        console.error('❌ Message fetching test FAILED');
        console.error('❌ Error:', response.data.message);
      }
      
    } catch (error: any) {
      console.error('❌ Message fetching test ERROR');
      console.error('❌ Error:', error.response?.data || error.message);
      console.error('❌ Status:', error.response?.status);
    }
  };

  // Run message fetching test when chat changes
  useEffect(() => {
    if (selectedChat) {
      setTimeout(testMessageFetching, 1000); // Wait a bit for the main fetch to complete
    }
  }, [selectedChat]);

  // Debug function to test groups API directly
  const debugGroupsAPI = async () => {
    console.log('🧪 Debugging Groups API...');
    console.log('🔍 Current user ID:', userId);
    console.log('🔍 User data:', user);
    
    try {
      // Test 1: Check if user is authenticated
      console.log('📋 Test 1: Authentication check');
      if (!user || !userId) {
        console.error('❌ User not authenticated');
        return;
      }
      console.log('✅ User is authenticated');
      
      // Test 2: Call groups API directly
      console.log('📋 Test 2: Calling groups API');
      const response = await axios.get('/api/group/my-groups', { 
        withCredentials: true 
      });
      
      console.log('📦 Raw API response:', response);
      console.log('📦 Response status:', response.status);
      console.log('📦 Response data:', response.data);
      
      if (response.data.success) {
        console.log('✅ API call successful');
        console.log('✅ Groups found:', response.data.data?.length || 0);
        console.log('✅ Sample group:', response.data.data?.[0]);
      } else {
        console.error('❌ API returned success: false');
        console.error('❌ Error message:', response.data.message);
      }
      
    } catch (error: any) {
      console.error('❌ Groups API test failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error config:', error.config);
    }
  };

  // Run debug test when component mounts
  useEffect(() => {
    if (userId) {
      setTimeout(debugGroupsAPI, 1000); // Wait a bit for everything to load
    }
  }, [userId]);

  // Manual test function for debugging
  const testSocketConnection = () => {
    console.log('🧪 Testing socket connection...');
    console.log('🔗 Socket connected:', socket?.connected);
    console.log('🔗 Socket ID:', socket?.id);
    console.log('🎯 Selected chat:', selectedChat);
    console.log('👤 User ID:', userId);
    
    if (!socket?.connected) {
      console.error('❌ Socket not connected!');
      toast.error('Socket not connected. Check server status.');
      return;
    }
    
    // Test authentication first
    console.log('🔐 Testing socket authentication...');
    socket.emit('authenticate');
    
    // Test emit a simple event
    socket.emit('test_connection', { message: 'Hello from client' }, (response: any) => {
      console.log('✅ Test connection response:', response);
      toast.success('Socket connection test successful!');
    });
    
    // Test sending a message
    if (selectedChat) {
      const testMessage = {
        text: 'Test message from debug button',
        roomName: selectedChat.type === 'group' ? selectedChat.id : [userId, selectedChat.id].sort().join('_'),
        groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
        recipientId: selectedChat.type === 'personal' ? selectedChat.id : undefined,
        sender: userId,
      };
      
      console.log('🧪 Sending test message:', testMessage);
      socket.emit('send_message', testMessage, (response: any) => {
        console.log('🧪 Test message response:', response);
        if (response?.success) {
          toast.success('Test message sent successfully!');
        } else {
          toast.error('Test message failed: ' + (response?.error || 'Unknown error'));
        }
      });
    }
  };

  // Periodic refresh of personal chats (every 30 seconds)
  useEffect(() => {
    if (!user || !user._id) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh of personal chats');
      refreshPersonalChats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, userId]);

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    refreshPersonalChats();
    toast.success('Chats refreshed');
  };

  // Debug function to test personal chat creation
  const testPersonalChat = async () => {
    try {
      console.log('🧪 Testing personal chat creation...');
      
      // Get current user ID
      if (!user?._id) {
        toast.error('User not authenticated');
        return;
      }
      
      // Create a test message to another user (you can replace with actual user ID)
      const testRecipientId = '507f1f77bcf86cd799439011'; // Replace with actual user ID
      const testContent = `Test message from ${user.name} at ${new Date().toLocaleTimeString()}`;
      
      const response = await axios.post('/api/messages/test-personal-chat', {
        senderId: user._id,
        recipientId: testRecipientId,
        content: testContent
      }, { withCredentials: true });
      
      if (response.data.success) {
        console.log('✅ Test personal chat created:', response.data);
        toast.success('Test personal chat created successfully');
        
        // Refresh personal chats to show the new conversation
        setTimeout(() => {
          refreshPersonalChats();
        }, 1000);
      } else {
        console.error('❌ Test personal chat failed:', response.data);
        toast.error('Failed to create test personal chat');
      }
    } catch (error: any) {
      console.error('❌ Test personal chat error:', error);
      toast.error('Error creating test personal chat');
    }
  };

  // Debug function to test conversations API
  const testConversationsAPI = async () => {
    try {
      console.log('🧪 Testing conversations API...');
      
      const response = await axios.get('/api/conversations', { withCredentials: true });
      console.log('📦 Conversations API response:', response.data);
      
      if (response.data.success) {
        toast.success(`Found ${response.data.data?.personal?.length || 0} personal chats`);
      } else {
        toast.error('Conversations API failed');
      }
    } catch (error: any) {
      console.error('❌ Conversations API error:', error);
      toast.error('Error testing conversations API');
    }
  };

  // Debug function to test the specific scenario
  const testPersonalChatInSidebar = async () => {
    try {
      console.log('🧪 Testing personal chat in sidebar...');
      console.log('📊 Current personal chats:', personalChats);
      console.log('🎯 Selected chat:', selectedChat);
      
      if (selectedChat && selectedChat.type === 'personal') {
        console.log('✅ Selected chat is personal, ensuring it\'s in the list...');
        
        // Force add the chat to personal chats list
        setPersonalChats(prev => {
          const chatExists = prev.some(chat => chat.id === selectedChat.id);
          if (!chatExists) {
            console.log('➕ Force adding chat to personal chats list:', selectedChat.name);
            const newChatEntry: Chat = {
              id: selectedChat.id,
              name: selectedChat.name,
              type: 'personal',
              profilePicture: selectedChat.profilePicture,
              lastMessage: selectedChat.lastMessage || '',
              lastMessageTime: selectedChat.lastMessageTime || new Date(),
              unreadCount: selectedChat.unreadCount || 0,
              isOnline: selectedChat.isOnline || false,
              isMicEnabled: false
            };
            return [newChatEntry, ...prev];
          }
          return prev;
        });
        
        // Force refresh personal chats
        await refreshPersonalChats();
        
        console.log('📊 Personal chats after refresh:', personalChats);
        toast.success('Personal chat should now appear in sidebar');
      } else {
        console.log('❌ No personal chat selected');
        toast.error('Please select a personal chat first');
      }
    } catch (error: any) {
      console.error('❌ Test error:', error);
      toast.error('Error testing personal chat in sidebar');
    }
  };

  // Test message sending function
  const testMessageSending = async () => {
    if (!selectedChat) {
      console.log('❌ No chat selected for testing');
      toast.error('Please select a chat first');
      return;
    }

    console.log('🧪 Testing message sending...');
    console.log('💬 Selected chat:', selectedChat);
    console.log('👤 User ID:', userId);
    console.log('🔗 Socket connected:', isConnected);
    console.log('🔌 Socket object:', socket);

    // Test API endpoint
    try {
      const testMessage = {
        content: 'Test message from debug function',
        groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
        recipientId: selectedChat.type === 'personal' ? selectedChat.id : undefined,
      };

      console.log('📡 Testing API with data:', testMessage);
      const response = await axios.post('/api/messages/send-message', testMessage, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ API test successful:', response.data);
      toast.success('API test successful');
    } catch (error: any) {
      console.error('❌ API test failed:', error.response?.data || error.message);
      toast.error(`API test failed: ${error.response?.data?.message || error.message}`);
    }

    // Test socket if connected
    if (isConnected && socket) {
      try {
        const socketMessage = {
          text: 'Test socket message',
          roomName: selectedChat.type === 'group' ? selectedChat.id : [userId, selectedChat.id].sort().join('_'),
          groupId: selectedChat.type === 'group' ? selectedChat.id : undefined,
          recipientId: selectedChat.type === 'personal' ? selectedChat.id : undefined,
          sender: userId,
        };

        console.log('🔌 Testing socket with data:', socketMessage);
        const success = await sendSocketMessage(socketMessage);
        console.log('✅ Socket test result:', success);
        if (success) {
          toast.success('Socket test successful');
        } else {
          toast.error('Socket test failed');
        }
      } catch (error) {
        console.error('❌ Socket test failed:', error);
        toast.error(`Socket test failed: ${error}`);
      }
    } else {
      console.log('❌ Socket not available for testing');
      toast.error('Socket not connected');
    }
  };

  // Test chat creation function
  const testChatCreation = async () => {
    if (!selectedChat) {
      console.log('❌ No chat selected for testing');
      toast.error('Please select a chat first');
      return;
    }

    console.log('🧪 Testing chat creation...');
    console.log('💬 Selected chat:', selectedChat);

    try {
      // Test the debug endpoint to see existing chats
      const chatsResponse = await axios.get('/api/messages/debug/chats', {
        withCredentials: true
      });
      console.log('📊 Existing chats:', chatsResponse.data);

      // Test creating a personal chat
      if (selectedChat.type === 'personal') {
        const testChatData = {
          senderId: userId,
          recipientId: selectedChat.id,
          content: 'Test chat creation message'
        };

        console.log('📡 Testing chat creation with data:', testChatData);
        const response = await axios.post('/api/messages/test-personal-chat', testChatData, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ Chat creation test successful:', response.data);
        toast.success('Chat creation test successful');
      } else {
        console.log('❌ Selected chat is not personal, skipping chat creation test');
        toast.error('Please select a personal chat for this test');
      }
    } catch (error: any) {
      console.error('❌ Chat creation test failed:', error.response?.data || error.message);
      toast.error(`Chat creation test failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // Ensure selected chat is in personal chats list when URL parameters change
  useEffect(() => {
    if (chatType === 'personal' && recipientId && recipientName && selectedChat) {
      console.log('🔗 URL parameters detected, ensuring chat is in list:', selectedChat.name);
      ensureChatInGlobalList(selectedChat);
    }
  }, [chatType, recipientId, recipientName, selectedChat]);

  return (
    <AudioRoomProvider>
      <div className="w-full h-screen flex overflow-hidden bg-white">
        {/* Fixed Sidebar - Groups List (left) */}
        <div className="w-[248px] h-screen bg-white shadow flex flex-col flex-shrink-0 border border-[#E5E5E5]">
          {/* Scrollable Chat List */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-2 p-2">
              {/* Loading States */}
              {(loadingGroups || loadingPersonalChats) && (
                <div className="text-center text-[#8F8F8F] py-4">Loading chats...</div>
              )}
              
              {/* Error States */}
              {groupError && (
                <div className="text-center text-red-500 py-2 text-sm">{groupError}</div>
              )}
              {personalChatsError && (
                <div className="text-center text-red-500 py-2 text-sm">{personalChatsError}</div>
              )}

              {/* Empty State - Show when no chats are loading and no chats exist */}
              {!loadingGroups && !loadingPersonalChats && personalChats.length === 0 && groupChats.length === 0 && (
                <div className="text-center text-[#8F8F8F] py-8">
                  <div className="mb-4">
                    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="mx-auto text-[#BDBDBD]">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium mb-2">No chats yet</div>
                  <div className="text-xs">Click the + button to start a conversation or create a group</div>
                </div>
              )}

              {/* Personal Chats Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2 mt-2">
                  <div className="text-xs font-semibold text-[#8F8F8F]">Personal Chats</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleManualRefresh}
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      title="Refresh Chats"
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-600">
                        <path d="M1 4v6h6M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                      </svg>
                    </button>
                    {user && user._id && (
                      <button
                        onClick={() => setShowStartPersonalChatModal(true)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        title="Start New Chat"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-600">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {loadingPersonalChats ? (
                  <div className="text-center text-[#8F8F8F] py-2 text-sm">Loading personal chats...</div>
                ) : personalChats && Array.isArray(personalChats) && personalChats.length > 0 ? (
                  <div className="space-y-1">
                    {personalChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => selectChat(chat)}
                        className={`w-[248px] h-[52px] flex items-center justify-between px-3 py-[14px] rounded-[8px] cursor-pointer font-normal text-[16px] leading-[120%] transition-colors duration-200 ${
                          selectedChat?.id === chat.id 
                            ? 'text-[#222] bg-[#F5F5F5]' 
                            : 'text-[#8F8F8F] hover:bg-gray-50'
                        }`}
                        style={{ fontFamily: 'Satoshi, Inter, Segoe UI, Arial, sans-serif' }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Profile Picture */}
                          {chat.profilePicture ? (
                            <img
                              src={chat.profilePicture}
                              alt={chat.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#E8E8E8] flex items-center justify-center text-sm font-bold text-[#8F8F8F] flex-shrink-0">
                              {getInitials(chat.name)}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[14px] truncate">{chat.name}</div>
                            {chat.lastMessage && (
                              <div className="text-[12px] text-[#BDBDBD] truncate">
                                {chat.lastMessage.length > 30 ? chat.lastMessage.substring(0, 30) + '...' : chat.lastMessage}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Unread Badge */}
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            <div className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[#8F8F8F] py-4 text-sm">
                    {!user || !user._id ? (
                      <>
                        <div className="mb-2">Please log in to view personal chats</div>
                        <div className="text-xs">You need to be authenticated to see your conversations</div>
                      </>
                    ) : (
                      <>
                        <div className="mb-2">No personal chats yet</div>
                        <div className="text-xs">Click the + button to start a conversation</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Groups Section */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-[#8F8F8F] mb-2 mt-4">Groups</div>
                {loadingGroups ? (
                  <div className="text-center text-[#8F8F8F] py-2 text-sm">Loading groups...</div>
                ) : groupChats.length > 0 ? (
                  <div className="space-y-1">
                    {groupChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => selectChat(chat)}
                        className={`w-[248px] h-[52px] flex items-center justify-between px-3 py-[14px] rounded-[8px] cursor-pointer font-normal text-[16px] leading-[120%] transition-colors duration-200 ${
                          selectedChat?.id === chat.id 
                            ? 'text-[#222] bg-[#F5F5F5]' 
                            : 'text-[#8F8F8F] hover:bg-gray-50'
                        }`}
                        style={{ fontFamily: 'Satoshi, Inter, Segoe UI, Arial, sans-serif' }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Audio Room Indicator */}
                          {chat.isMicEnabled && (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 flex-shrink-0">
                              <path d="M11 5L6 9H2v6h4l5 4V5z" />
                              <path d="M19 12c0-2.21-1.79-4-4-4" />
                              <path d="M19 12c0 2.21-1.79 4-4 4" />
                            </svg>
                          )}
                          
                          {/* Profile Picture */}
                          {chat.profilePicture ? (
                            <img
                              src={chat.profilePicture}
                              alt={chat.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#E8E8E8] flex items-center justify-center text-sm font-bold text-[#8F8F8F] flex-shrink-0">
                              {getInitials(chat.name)}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[14px] truncate">{chat.name}</div>
                            <div className="text-[12px] text-[#BDBDBD]">
                              {chat.memberCount || 0} members
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[#8F8F8F] py-4 text-sm">
                    <div className="mb-2">No groups yet</div>
                    <div className="text-xs">Create a group to start chatting</div>
                  </div>
                )}
              </div>
              
              {/* Start Room Button - Only show when there are groups or when not in empty state */}
              {(!loadingGroups && !loadingPersonalChats) && (groupChats.length > 0 || personalChats.length > 0) && (
                <button 
                  className="w-[220px] h-[47px] flex items-center justify-center gap-2 mt-2 rounded-[8px] font-normal text-[16px] leading-[120%]"
                  style={{ color: 'rgba(47, 128, 237, 1)', background: 'transparent', border: 'none' }}
                  onClick={() => setShowStartRoomModal(true)}
                >
                  <span className="text-[20px] font-bold" style={{ color: 'rgba(47, 128, 237, 1)' }}>+</span> Start Your Room
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area (right) */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white shadow border border-[#E5E5E5]">
          {selectedChat ? (
            <>
              {/* Fixed Chat Header - Always Visible */}
              <div className="flex-shrink-0 flex items-center justify-between border-b border-[#E5E5E5] px-6 py-3 bg-white z-10">
                <div className="flex items-center gap-4">
                  {/* Profile Picture */}
                  {selectedChat.profilePicture ? (
                    <img
                      src={selectedChat.profilePicture}
                      alt={selectedChat.name}
                      style={{ width: 40, height: 40, borderRadius: 80, background: 'rgba(232, 232, 232, 1)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{ width: 40, height: 40, borderRadius: 80, background: 'rgba(232, 232, 232, 1)' }}
                      className="flex items-center justify-center text-lg font-bold text-[#8F8F8F]"
                    >
                      {getInitials(selectedChat.name)}
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    {/* Group/Chat Name */}
                    <div
                      style={{ width: 272, height: 25, fontFamily: 'Satoshi', fontWeight: 700, fontSize: 16, lineHeight: '120%', letterSpacing: 0, color: 'rgba(46, 46, 46, 1)', borderRadius: 6, paddingLeft: 8, display: 'flex', alignItems: 'center', background: 'none' }}
                    >
                      {selectedChat.name}
                      {selectedChat.isMicEnabled && (
                        <div className="ml-2 flex items-center gap-1">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="text-blue-500">
                            <path d="M11 5L6 9H2v6h4l5 4V5z" />
                            <path d="M19 12c0-2.21-1.79-4-4-4" />
                            <path d="M19 12c0 2.21-1.79 4-4 4" />
                          </svg>
                          <span className="text-xs text-blue-500 font-medium">Audio Enabled</span>
                        </div>
                      )}
                    </div>
                    {/* Online/Offline Status - Different for Personal vs Group */}
                    <div
                      style={{ width: 272, height: 19, fontFamily: 'Satoshi', fontWeight: 400, fontSize: 16, lineHeight: '120%', letterSpacing: 0, background: 'transparent', color: 'rgba(143, 143, 143, 1)', borderRadius: 6, paddingLeft: 8, marginTop: 2, display: 'flex', alignItems: 'center' }}
                    >
                      {selectedChat.type === 'personal' ? (
                        <span className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${selectedChat.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span>{selectedChat.isOnline ? 'Online' : 'Offline'}</span>
                        </span>
                      ) : (
                        selectedChat.memberCount ? `${selectedChat.memberCount} members, ${selectedChat.onlineCount || 0} online, ${selectedChat.memberCount - (selectedChat.onlineCount || 0)} offline` : 'No members'
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right side buttons - About Button and Group Type Button */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Test Button - Only show in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="flex gap-2">
                      <button
                        onClick={testMessageFetching}
                        className="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        title="Test Message Fetching"
                      >
                        Test Messages
                      </button>
                      <button
                        onClick={testSocketConnection}
                        className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="Test Socket Connection"
                      >
                        Test Socket
                      </button>
                      <button
                        onClick={() => {
                          const testMsg = {
                            id: `test-${Date.now()}`,
                            sender: 'Test User',
                            content: 'This is a test message',
                            time: new Date().toLocaleTimeString(),
                            isUser: false,
                            timestamp: new Date(),
                          };
                          setMessages(prev => [...prev, testMsg]);
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Add Test Message"
                      >
                        Add Test
                      </button>
                      {selectedChat?.type === 'personal' && (
                        <button
                          onClick={() => {
                            const testMsg = {
                              id: `personal-test-${Date.now()}`,
                              sender: selectedChat.name,
                              content: 'This is a personal chat test message',
                              time: new Date().toLocaleTimeString(),
                              isUser: false,
                              timestamp: new Date(),
                            };
                            setMessages(prev => [...prev, testMsg]);
                          }}
                          className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                          title="Add Personal Test Message"
                        >
                          Personal Test
                        </button>
                      )}
                      <button
                        onClick={testPersonalChat}
                        className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        title="Test Personal Chat Creation"
                      >
                        Create Personal Chat
                      </button>
                      <button
                        onClick={testConversationsAPI}
                        className="px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        title="Test Conversations API"
                      >
                        Test Chat List
                      </button>
                      <button
                        onClick={testPersonalChatInSidebar}
                        className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Test Personal Chat in Sidebar"
                      >
                        Fix Sidebar
                      </button>
                      <button
                        onClick={testMessageSending}
                        className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="Test Message Sending"
                      >
                        Test Send
                      </button>
                      <button
                        onClick={testChatCreation}
                        className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                        title="Test Chat Creation"
                      >
                        Test Chat
                      </button>
                    </div>
                  )}
                  
                  {/* Group-specific buttons */}
                  {selectedChat.type === 'group' && (
                    <>
                      {/* Text-Only Indicator for non-audio groups */}
                      {(!selectedChat.audioRoom?.enabled) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4" />
                            <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" />
                            <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z" />
                          </svg>
                          <span>Text only</span>
                        </div>
                      )}
                      
                      <button
                        onClick={handleAboutButtonClick}
                        className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-medium"
                        style={{ 
                          fontFamily: 'Satoshi', 
                          fontWeight: 500, 
                          fontSize: 14, 
                          lineHeight: '120%', 
                          letterSpacing: 0, 
                          background: 'transparent', 
                          color: 'rgba(47, 128, 237, 1)', 
                          borderRadius: 6, 
                          border: '1px solid rgba(47, 128, 237, 0.2)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          cursor: 'pointer',
                          minWidth: '80px',
                          height: '32px'
                        }}
                      >
                        About
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable Messages Area - Takes remaining space */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto bg-[#F8F8F8] min-h-0"
                style={{ height: 'calc(100vh - 140px)' }}
              >
                <div className="px-6 py-4 flex flex-col gap-2">
                  {/* Audio Room Button for Groups */}
                  {selectedChat && selectedChat.type === 'group' && selectedChat.isMicEnabled && (
                    <AudioRoomButton
                      groupId={selectedChat.id}
                      groupName={selectedChat.name}
                      userId={userId}
                      userName={userName}
                      isHost={selectedChat.creator === userId} // Check if user is the creator
                    />
                  )}
                  
                  {/* Load More Messages Indicator */}
                  {hasMoreMessages && (
                    <div className="flex justify-center py-2">
                      {isLoadingMore ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          Loading more messages...
                        </div>
                      ) : (
                        <button
                          onClick={loadMoreMessages}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Load More Messages
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Initial Loading Indicator */}
                  {isLoadingMessages && messages.length === 0 && (
                    <div className="flex justify-center py-8">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        Loading messages...
                      </div>
                    </div>
                  )}
                  
                  {/* No More Messages Indicator */}
                  {!hasMoreMessages && messages.length > 0 && (
                    <div className="flex justify-center py-2">
                      <div className="text-xs text-gray-400 px-3 py-1 bg-gray-100 rounded-full">
                        Beginning of conversation
                      </div>
                    </div>
                  )}

                  {/* Messages List */}
                  {!isLoadingMessages && (
                    <div className="mb-2 text-xs text-gray-500">
                      Debug: {messages.length} messages loaded
                    </div>
                  )}
                  {!isLoadingMessages && messages.length > 0 && messages.map((msg, index) => {
                    const messageDate = msg.timestamp ? new Date(msg.timestamp) : new Date();
                    // Check if we need to show a date separator
                    const showDateSeparator = index === 0 || 
                      (index > 0 && !isSameDay(messageDate, messages[index - 1]?.timestamp));
                    // Create a unique key that combines message ID with index to ensure uniqueness
                    const messageKey = `${msg.id}-${index}`;
                    return (
                      <React.Fragment key={messageKey}>
                        {/* Date Separator */}
                        {showDateSeparator && (
                          <div className="flex justify-center my-3">
                            <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-[#E5E5E5]">
                              <span className="text-[12px] text-[#8F8F8F] font-medium" style={{ fontFamily: 'Satoshi, Inter, Segoe UI, Arial, sans-serif' }}>
                                {formatMessageDate(messageDate)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Message */}
                        <div className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-2`}>
                          <div
                            className={`max-w-[60%] px-4 py-2 rounded-[16px] shadow-sm ${msg.isUser ? 'bg-[#2F80ED] text-white rounded-br-[6px]' : 'bg-white text-[#222] rounded-bl-[6px] border border-[#E5E5E5]'}`}
                            style={{ fontFamily: 'Satoshi, Inter, Segoe UI, Arial, sans-serif' }}
                          >
                            {/* Sender name for group chats */}
                            {selectedChat.type === 'group' && !msg.isUser && (
                              <div className={`font-semibold text-[13px] mb-1 text-[#2F80ED]`}>
                                {typeof msg.sender === 'string' ? msg.sender : (msg.sender as any)?.name || 'Unknown'}
                              </div>
                            )}
                            
                            {/* File Message */}
                            {msg.messageType === 'file' && msg.mediaUrl ? (
                              <div className="mb-2">
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14,2 14,8 20,8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10,9 9,9 8,9" />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{msg.fileName}</div>
                                    <div className="text-xs text-gray-500">
                                      {msg.fileSize ? `${(msg.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                                    </div>
                                  </div>
                                </a>
                              </div>
                            ) : null}
                            
                            {/* Text Content */}
                            <div className="text-[14px] leading-[1.4] whitespace-pre-wrap">{typeof msg.content === 'string' ? msg.content : 'Message content unavailable'}</div>
                            
                            {/* Message Status */}
                            <div className={`text-[11px] mt-1 text-right ${msg.isUser ? 'text-blue-100' : 'text-[#8F8F8F]'}`}>
                              {typeof msg.time === 'string' ? msg.time : 'Now'}
                              {msg.isUser && msg.readBy && msg.readBy.length > 0 && (
                                <span className="ml-1">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  
                  {/* No Messages State */}
                  {!isLoadingMessages && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4">
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="mx-auto text-[#BDBDBD]">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-[#222] mb-2">No messages yet</h3>
                      <p className="text-[#8F8F8F]">Start the conversation by sending a message</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Fixed Input Area - Always at Bottom */}
              <div className="flex-shrink-0 flex items-center px-6 py-3 border-t border-[#E5E5E5] bg-white z-10">
                {/* File Upload Button */}
                <button
                  onClick={handleFileButtonClick}
                  disabled={uploadingFile}
                  className="mr-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700"
                  title="Attach file"
                >
                  {uploadingFile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : (
                    <svg 
                      width="16" 
                      height="16" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7,10 12,15 17,10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full px-4 py-2.5 rounded-[20px] border border-[#E5E5E5] bg-[#F8F8F8] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent transition-all duration-200"
                    style={{ fontFamily: 'Satoshi, Inter, Segoe UI, Arial, sans-serif' }}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleTypingStart}
                    onBlur={handleTypingStop}
                    disabled={!selectedChat}
                  />
                </div>
                
                <button
                  className={`ml-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                    newMessage.trim() 
                      ? 'bg-[#2F80ED] hover:bg-[#1E6FD8] shadow-md hover:shadow-lg transform hover:scale-105' 
                      : 'bg-[#E5E5E5] cursor-not-allowed'
                  }`}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    fill="none" 
                    stroke={newMessage.trim() ? "#fff" : "#BDBDBD"} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            /* No Chat Selected State */
            <div className="flex-1 flex items-center justify-center bg-[#F8F8F8]">
              <div className="text-center">
                <div className="mb-4">
                  <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="mx-auto text-[#BDBDBD]">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#222] mb-2">Select a chat</h3>
                <p className="text-[#8F8F8F]">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <StartRoomModal
        open={showStartRoomModal}
        onClose={() => setShowStartRoomModal(false)}
        user={user}
        onProceed={handleProceedRoom}
      />
      <AddUsersModal
        open={showAddUsersModal}
        onClose={() => setShowAddUsersModal(false)}
        onStartRoom={async (selectedUserIds) => {
          if (!pendingRoomDetails) return;
          try {
            console.log('🚀 Creating group with details:', {
              name: pendingRoomDetails.roomTitle,
              isMicEnabled: pendingRoomDetails.micAccess,
              members: selectedUserIds
            });
            
            // Create group with all details
            const res = await axios.post('/api/group/create', {
              name: pendingRoomDetails.roomTitle,
              isMicEnabled: pendingRoomDetails.micAccess,
              members: selectedUserIds
            });
            
            console.log('📦 Group creation response:', res.data);
            
            if (res.data && res.data.data) {
              const newGroup = res.data.data;
              
              // Add the new group to the list
              const groupChat: Chat = {
                id: newGroup._id,
                name: newGroup.name,
                type: 'group',
                profilePicture: newGroup.profilePicture,
                memberCount: newGroup.memberCount || 0,
                onlineCount: newGroup.onlineCount || 0,
                isMicEnabled: newGroup.isMicEnabled || false,
                creator: newGroup.creator?._id || newGroup.creator,
                members: newGroup.members || []
              };
              
              setGroupChats(prev => {
                // Check if group already exists to avoid duplicates
                const groupExists = prev.some(g => g.id === groupChat.id);
                if (groupExists) {
                  return prev;
                }
                return [...prev, groupChat];
              });
              
              // Select the newly created group
              setSelectedChat(groupChat);
              
              // Show success message
              toast.success(`Group "${pendingRoomDetails.roomTitle}" created successfully!${pendingRoomDetails.micAccess ? ' Audio room is enabled.' : ' Text-only chat enabled.'}`);
            } else {
              throw new Error('Invalid response from group creation API');
            }
          } catch (error: any) {
            console.error('❌ Error creating group:', error);
            console.error('❌ Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create group';
            toast.error(errorMessage);
            throw error; // Re-throw to let the modal handle it
          } finally {
            setShowAddUsersModal(false);
            setPendingRoomDetails(null);
          }
        }}
        roomTitle={pendingRoomDetails?.roomTitle || ''}
        micAccess={pendingRoomDetails?.micAccess || false}
      />
      {/* About Button Modal */}
      {selectedChat && selectedChat.type === 'group' && (
        <AboutButtonModal
          isOpen={showAboutModal}
          onClose={() => setShowAboutModal(false)}
          groupId={selectedChat.id}
          currentUserId={userId}
          onGroupUpdate={handleGroupUpdate}
          onGroupDelete={handleGroupDelete}
        />
      )}



      {/* Start Personal Chat Modal */}
      <StartPersonalChatModal
        isOpen={showStartPersonalChatModal}
        onClose={() => setShowStartPersonalChatModal(false)}
        onChatStarted={handleStartPersonalChat}
        currentUserId={userId}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onFileUploaded={handleFileUpload}
        groupId={selectedChat?.type === 'group' ? selectedChat.id : undefined}
      />
    </AudioRoomProvider>
  );
};

export default ModernChatRoom; 