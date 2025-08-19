import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import { FiBell, FiMoreVertical, FiEdit2, FiTrash2, FiUserPlus, FiUserMinus, FiSearch, FiPaperclip, FiSmile, FiUserCheck, FiArrowUp, FiArrowDown, FiRepeat, FiShoppingCart, FiSettings } from 'react-icons/fi';
import { Pin, Download, File, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '@/storage/authStore';
import { toast } from 'react-toastify';
import ChatSearch from './ChatSearch';
import ChatRoomHeader from '@/components/3605 Feed/ChatRoomHeader';
import EditGroupModal from '@/components/3605 Feed/EditGroupModal';
import AboutButtonModal from '@/components/3605 Feed/AboutButtonModal';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';

interface Message {
  _id?: string;
  sender: string | any;
  recipient?: string | any;
  group?: string | any;
  content: string;
  createdAt?: string;
  readBy?: string[];
  messageType?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

interface ChatRoomProps {
  userId: string;
  recipientId: string;
  chatType: 'personal' | 'group';
  chatName: string;
  setSelectedChat?: (chat: any) => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ userId: _userId, recipientId, chatType, chatName, setSelectedChat }) => {
  const { user } = useAuthStore();
  const userId = user?._id || _userId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showAboutButtonModal, setShowAboutButtonModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupPrivacy, setEditGroupPrivacy] = useState('public');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const groupIdRef = useRef<string | null>(null);
  const [onlineMap, setOnlineMap] = useState<{ [userId: string]: boolean }>({});
  const [readByMap, setReadByMap] = useState<{ [messageId: string]: string[] }>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);

  // Dummy admin check (replace with real logic)
  const isAdmin = chatType === 'group' && userId === 'CURRENT_USER_ID';

  // Filtered messages based on search
  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:8000', {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    // Debug: Listen for all group avatar events
    newSocket.on('group:avatar-updated', (data) => {
      console.log('Received group:avatar-updated event:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch cart and notification counts
  const fetchCounts = async () => {
    try {
      const [cartRes, notificationRes] = await Promise.all([
        axios.get('/api/cart/count', { withCredentials: true }),
        axios.get('/api/notifications/count', { withCredentials: true })
      ]);
      setCartCount(cartRes.data.count || 0);
      setNotificationCount(notificationRes.data.count || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // Debug: Log when group avatar changes
  useEffect(() => {
    if (groupInfo?.avatar) {
      console.log('Group avatar updated in ChatRoom:', groupInfo.avatar);
    }
  }, [groupInfo?.avatar]);

  // Fetch group details when group chat is selected
  useEffect(() => {
    if (chatType === 'group' && recipientId) {
      setGroupLoading(true);
      setGroupError(null);
      axios.get(`/api/group/${recipientId}`, { withCredentials: true })
        .then(res => {
          setGroupInfo(res.data.group);
          setGroupLoading(false);
        })
        .catch(() => {
          setGroupInfo(null);
          setGroupLoading(false);
          setGroupError('Failed to load group info.');
        });
    } else {
      setGroupInfo(null);
      setGroupLoading(false);
      setGroupError(null);
    }
  }, [chatType, recipientId]);

  // Real-time group updates via Socket.io
  useEffect(() => {
    if (!socket || chatType !== 'group' || !recipientId) return;

    groupIdRef.current = recipientId;

    const handleGroupUpdated = (data: { groupId: string }) => {
      if (data.groupId === recipientId) {
        axios.get(`/api/group/${recipientId}`, { withCredentials: true })
          .then(res => setGroupInfo(res.data.group))
          .catch(() => setGroupInfo(null));
        toast.info('Group updated');
      }
    };

    const handleGroupAvatarUpdated = (data: { groupId: string; avatar: string }) => {
      if (data.groupId === recipientId) {
        console.log('Group avatar updated via socket:', data);
        // Update group info immediately with the new avatar
        setGroupInfo(prev => prev ? { ...prev, avatar: data.avatar } : null);
        // Also fetch the complete updated group info
        axios.get(`/api/group/${recipientId}`, { withCredentials: true })
          .then(res => setGroupInfo(res.data.group))
          .catch(() => setGroupInfo(null));
      }
    };

    const handleGroupDeleted = (data: { groupId: string }) => {
      if (data.groupId === recipientId) {
        toast.error('This group has been deleted.');
        if (setSelectedChat) setSelectedChat(null);
      }
    };

    const handleGroupPresence = (data: { groupId: string, online: string[] }) => {
      if (data.groupId === recipientId && groupInfo?.members) {
        const map: { [userId: string]: boolean } = {};
        groupInfo.members.forEach((m: any) => {
          map[m._id] = data.online.includes(m._id);
        });
        setOnlineMap(map);
      }
    };

    socket.on('group-updated', handleGroupUpdated);
    socket.on('group:avatar-updated', handleGroupAvatarUpdated);
    socket.on('group-deleted', handleGroupDeleted);
    socket.on('group-presence', handleGroupPresence);

    return () => {
      socket.off('group-updated', handleGroupUpdated);
      socket.off('group:avatar-updated', handleGroupAvatarUpdated);
      socket.off('group-deleted', handleGroupDeleted);
      socket.off('group-presence', handleGroupPresence);
    };
  }, [socket, chatType, recipientId, setSelectedChat, groupInfo]);

  // Listen for message-read events and update readByMap
  useEffect(() => {
    if (!socket) return;

    const handleMessageRead = (data: { messageId: string, userId: string }) => {
      setReadByMap(prev => {
        const arr = prev[data.messageId] || [];
        if (!arr.includes(data.userId)) {
          return { ...prev, [data.messageId]: [...arr, data.userId] };
        }
        return prev;
      });
    };

    socket.on('message-read', handleMessageRead);
    return () => {
      socket.off('message-read', handleMessageRead);
    };
  }, [socket]);

  // Mark messages as read when rendered
  useEffect(() => {
    if (!messages || !userId) return;
    messages.forEach(msg => {
      if (msg._id && msg.sender !== userId && !(msg.readBy || []).includes(userId)) {
        axios.post('/api/chat/mark-read', { messageId: msg._id }, { withCredentials: true });
      }
    });
  }, [messages, userId]);

  // Listen for group-typing events
  useEffect(() => {
    if (!socket) return;

    const handleGroupTyping = (data: { groupId: string, userId: string, typing: boolean }) => {
      if (data.groupId === recipientId && data.userId !== userId) {
        setTypingUsers(prev => [...prev, data.userId]);
      }
    };

    socket.on('group-typing', handleGroupTyping);
    return () => {
      socket.off('group-typing', handleGroupTyping);
    };
  }, [socket, recipientId, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };
    
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0) {
      const scrollToBottom = () => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
          });
        }
      };
      
      const timeoutId = setTimeout(scrollToBottom, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [recipientId, chatType]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
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
    if (fileType.includes('pdf')) return <File size={16} />;
    if (fileType.includes('word') || fileType.includes('document')) return <File size={16} />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <File size={16} />;
    return <File size={16} />;
  };

  // Send message function
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (!socket) {
      toast.error('Not connected to server');
      return;
    }

    setIsUploading(true);
    try {
      if (selectedFile) {
        // Send file message
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('content', newMessage);
        
        if (chatType === 'group') {
          formData.append('groupId', recipientId);
        } else {
          formData.append('recipientId', recipientId);
        }
        
        await axios.post('/api/messages/send-file', formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        setSelectedFile(null);
        setFilePreview(null);
      } else {
        // Send text message via Socket.IO
        const text = newMessage.trim();
        const data: any = {
          roomName: recipientId,
          text,
          sender: userId,
        };
        
        if (chatType === 'group') {
          data.groupId = recipientId;
        } else {
          data.recipientId = recipientId;
        }
        
        console.log('Sending message:', data);
        socket.emit('send_message', data);
      }
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Error sending message: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle navigation to chat from search results
  const handleNavigateToChat = (chatId: string, chatType: 'personal' | 'group') => {
    toast.info(`Navigating to ${chatType === 'group' ? 'group' : 'chat'}...`);
  };

  // Group management handlers
  const handleAddMember = () => {
    setShowAddMemberModal(true);
  };

  const handleEditGroupName = () => {
    setEditGroupName(groupInfo?.name || chatName);
    setEditGroupDesc(groupInfo?.description || '');
    setEditGroupPrivacy(groupInfo?.isPrivate ? 'private' : 'public');
    setShowEditGroupModal(true);
  };

  const handleEditGroupDescription = () => {
    setEditGroupName(groupInfo?.name || chatName);
    setEditGroupDesc(groupInfo?.description || '');
    setEditGroupPrivacy(groupInfo?.isPrivate ? 'private' : 'public');
    setShowEditGroupModal(true);
  };

  const handleRemoveMembers = () => {
    setShowRemoveMemberModal(true);
  };

  const handleDeleteGroup = async () => {
    try {
      await axios.post(`/api/group/delete`, { groupId: recipientId }, { withCredentials: true });
      toast.success('Group deleted successfully');
      if (setSelectedChat) setSelectedChat(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleViewGroupInfo = () => {
    setShowAboutButtonModal(true);
  };

  const handleGroupUpdateFromModal = () => {
    // Refresh group info when updated from AboutButtonModal
    if (chatType === 'group' && recipientId) {
      setGroupLoading(true);
      setGroupError(null);
      axios.get(`/api/group/${recipientId}`, { withCredentials: true })
        .then(res => {
          setGroupInfo(res.data.group);
          setGroupLoading(false);
        })
        .catch(() => {
          setGroupInfo(null);
          setGroupLoading(false);
          setGroupError('Failed to load group info.');
        });
    }
  };

  const handleToggleGroupPrivacy = async () => {
    try {
      const newPrivacy = groupInfo?.isPrivate ? 'public' : 'private';
      await axios.put(`/api/group/${recipientId}`, {
        isPrivate: !groupInfo?.isPrivate
      }, { withCredentials: true });
      toast.success(`Group made ${newPrivacy}`);
    } catch (error) {
      console.error('Error toggling group privacy:', error);
      toast.error('Failed to update group privacy');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await axios.post(`/api/group/${recipientId}/leave`, {}, { withCredentials: true });
      toast.success('Left group successfully');
      if (setSelectedChat) setSelectedChat(null);
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const handleSaveGroupChanges = async (data: { name: string; description: string; isPrivate: boolean }) => {
    setIsEditingGroup(true);
    try {
      await axios.put(`/api/group/${recipientId}`, {
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate
      }, { withCredentials: true });
      toast.success('Group updated successfully');
      setShowEditGroupModal(false);
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    } finally {
      setIsEditingGroup(false);
    }
  };

  const handleGroupUpdate = () => {
    // Refresh group info when group is updated
    if (chatType === 'group' && recipientId) {
      setGroupLoading(true);
      setGroupError(null);
      axios.get(`/api/group/${recipientId}`, { withCredentials: true })
        .then(res => {
          setGroupInfo(res.data.group);
          setGroupLoading(false);
        })
        .catch(() => {
          setGroupInfo(null);
          setGroupLoading(false);
          setGroupError('Failed to load group info.');
        });
    }
  };

  const handleGroupDelete = () => {
    toast.success('Group deleted successfully');
    if (setSelectedChat) setSelectedChat(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      {chatType === 'personal' ? (
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={groupInfo?.profilePicture || '/default-profile.svg'}
              alt={chatName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-base text-gray-900">{chatName}</span>
              <span className={`text-xs font-medium ${groupInfo?.isOnline ? 'text-blue-500' : 'text-gray-400'}`}>{groupInfo?.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition relative">
              <FiShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition relative">
              <FiBell size={18} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition"><FiSettings size={18} /></button>
          </div>
        </div>
      ) : (
        <ChatRoomHeader
          groupName={chatName}
          groupId={recipientId}
          groupAvatar={groupInfo?.avatar}
          onCall={() => {/* Handle voice call */}}
          onVideoCall={() => {/* Handle video call */}}
          onAddMember={handleAddMember}
          onLeaveGroup={handleLeaveGroup}
          onEditGroupName={handleEditGroupName}
          onEditGroupDescription={handleEditGroupDescription}
          onRemoveMembers={handleRemoveMembers}
          onDeleteGroup={handleDeleteGroup}
          onViewGroupInfo={handleViewGroupInfo}
          onToggleGroupPrivacy={handleToggleGroupPrivacy}
          isAdmin={groupInfo?.admins?.includes(userId)}
          isOwner={groupInfo?.owner === userId}
          memberCount={groupInfo?.members?.length || 0}
          groupDescription={groupInfo?.description || ''}
          isPrivate={groupInfo?.isPrivate || false}
        />
      )}

      {/* Loading spinner or error */}
      {chatType === 'group' && groupLoading && (
        <div className="flex items-center justify-center py-4">
          <span className="loader mr-2"></span> Loading group info...
        </div>
      )}
      {chatType === 'group' && groupError && (
        <div className="text-red-500 text-center py-2">{groupError}</div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white p-4 space-y-3 scroll-smooth">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400">Start the conversation!</p>
          </div>
        ) : (
          (() => {
            // Group messages by date
            const groups: { [key: string]: Message[] } = {};
            filteredMessages.forEach(msg => {
              const date = msg.createdAt ? format(new Date(msg.createdAt), 'yyyy-MM-dd') : 'unknown';
              if (!groups[date]) groups[date] = [];
              groups[date].push(msg);
            });
            const sortedDates = Object.keys(groups).sort();
            return sortedDates.map((date) => {
              // Determine label
              let label = '';
              const dateObj = date !== 'unknown' ? new Date(date) : null;
              if (dateObj && isToday(dateObj)) label = 'Today';
              else if (dateObj && isYesterday(dateObj)) label = 'Yesterday';
              else if (dateObj && isThisWeek(dateObj)) label = format(dateObj, 'EEEE');
              else if (dateObj) label = format(dateObj, 'MMMM d, yyyy');
              else label = '';
              return (
                <React.Fragment key={date}>
                  <div className="flex items-center justify-center my-4">
                    <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-4 py-1 rounded-full shadow-sm">
                      {label}
                    </span>
                  </div>
                  {groups[date].map((msg: Message, index: number) => {
                    const isOwnMessage = msg.sender === userId || msg.sender?._id === userId;
                    return (
                      <div
                        key={msg._id || `${date}-${index}`}
                        className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                        style={{ animation: 'fadeInUp 0.3s ease-out', animationDelay: `${index * 0.05}s` }}
                      >
                        {/* Avatar for received messages */}
                        {!isOwnMessage && (
                          <div className="flex flex-col items-end mr-2">
                            <img
                              src={msg.sender?.profilePicture || '/default-profile.svg'}
                              alt={msg.sender?.name || 'User'}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 mb-1"
                            />
                          </div>
                        )}
                        <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                          {/* Sender name for group chats */}
                          {!isOwnMessage && chatType === 'group' && msg.sender?.name && (
                            <span className="text-xs font-semibold text-gray-700 mb-1 ml-1">{msg.sender?.name}</span>
                          )}
                          <div
                            className={`rounded-xl px-4 py-2 shadow-md ${isOwnMessage
                              ? 'bg-blue-100 text-blue-900 rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'}
                              font-serif text-sm whitespace-pre-line`}
                          >
                            {msg.content}
                          </div>
                          <span className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-400' : 'text-gray-400'} font-normal`}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                        </div>
                        {/* Avatar for sent messages */}
                        {isOwnMessage && (
                          <div className="flex flex-col items-end ml-2">
                            <img
                              src={user?.profilePicture || '/default-profile.svg'}
                              alt={user?.name || 'You'}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 mb-1"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            });
          })()
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-100 p-4 shadow-sm">
        {/* File preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg shadow-sm" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-sm">
                    {getFileIcon(selectedFile.type)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                onClick={removeSelectedFile}
                className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-end gap-3">
          {/* Emoji button */}
          <button 
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-200 group"
            title="Emoji"
          >
            <FiSmile size={20} className="group-hover:scale-110 transition-transform duration-200" />
          </button>
          
          {/* File attachment button */}
          <input
            type="file"
            id="file-input"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          />
          <label
            htmlFor="file-input"
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-200 cursor-pointer group"
            title="Attach file"
          >
            <FiPaperclip size={20} className="group-hover:scale-110 transition-transform duration-200" />
          </label>
          
          {/* Message input field */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 resize-none"
              style={{ 
                cursor: 'text',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
              }}
            />
            
            {/* Character counter (optional) */}
            {newMessage.length > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-gray-400">
                  {newMessage.length}/1000
                </span>
              </div>
            )}
          </div>
          
          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={isUploading || (!newMessage.trim() && !selectedFile)}
            className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              newMessage.trim() || selectedFile
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Typing indicator */}
        {chatType === 'group' && typingUsers.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 animate-pulse">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>
              {typingUsers
                .map(uid => groupInfo?.members?.find((m: any) => m._id === uid)?.name || 'Someone')
                .join(', ')}
              {typingUsers.length === 1 ? ' is typing...' : ' are typing...'}
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditGroupModal
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        onSave={handleSaveGroupChanges}
        initialData={{
          name: groupInfo?.name || chatName,
          description: groupInfo?.description || '',
          isPrivate: groupInfo?.isPrivate || false
        }}
        isLoading={isEditingGroup}
      />

      {/* Chat Search Modal */}
      <ChatSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigateToChat={handleNavigateToChat}
        currentChatId={recipientId}
        currentChatType={chatType}
      />

      <AboutButtonModal
        isOpen={showAboutButtonModal}
        onClose={() => setShowAboutButtonModal(false)}
        groupId={recipientId}
        currentUserId={userId}
        onGroupUpdate={handleGroupUpdateFromModal}
        onGroupDelete={() => {
          if (setSelectedChat) setSelectedChat(null);
        }}
      />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatRoom;
