import React, { useState, useEffect, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  HiX, 
  HiPencil, 
  HiUserAdd, 
  HiUserRemove, 
  HiStar, 
  HiShieldCheck,
  HiVolumeOff, 
  HiPhotograph,
  HiTrash,
  HiInformationCircle,
  HiCalendar,
  HiClock,
  HiUsers,
  HiCog,
  HiBell,
  HiExclamationCircle,
  HiEye,
  HiDownload,
  HiDocument,
  HiPlay,
  HiMusicNote,
  HiLink,
  HiClipboard,
  HiCheck,
  HiVolumeUp,
  HiSearch
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import axios from 'axios';
import AddMemberModal from './AddMemberModal';

interface Member {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  isOnline?: boolean;
  isMuted?: boolean;
  lastSeen?: string;
}

interface GroupInfo {
  _id: string;
  name: string;
  description?: string;
  creator: string;
  admins: string[];
  members: Member[];
  isMicEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  announcement?: string;
  isInviteOnly?: boolean;
  rules?: string;
  inviteLinks?: string[];
}

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnail?: string;
  uploadedBy: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  uploadedAt: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

interface AboutButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentUserId: string;
  onGroupUpdate?: () => void;
  onGroupDelete?: () => void;
}

const AboutButtonModal: React.FC<AboutButtonModalProps> = ({
  isOpen,
  onClose,
  groupId,
  currentUserId,
  onGroupUpdate,
  onGroupDelete
}) => {
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'settings' | 'media'>('info');
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // New state variables for enhanced functionality
  const [isMuted, setIsMuted] = useState(false);
  const [groupRules, setGroupRules] = useState('');
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [groupMedia, setGroupMedia] = useState<MediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaFilter, setMediaFilter] = useState('all');
  const [mediaSearch, setMediaSearch] = useState('');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [isUpdatingAnnouncement, setIsUpdatingAnnouncement] = useState(false);
  const [isUpdatingRules, setIsUpdatingRules] = useState(false);
  const [isLoadingAuditLog, setIsLoadingAuditLog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check user permissions
  const isOwner = groupInfo?.creator === currentUserId;
  const isAdmin = groupInfo?.admins?.includes(currentUserId) || isOwner;
  const canManage = isAdmin || isOwner;
  const canAddMembers = isAdmin || isOwner; // Only admins can add members
  const canRemoveMembers = isAdmin || isOwner;
  const canEditGroup = isAdmin || isOwner;
  const canDeleteGroup = isOwner;
  const canManageAdmins = isOwner;
  const canMuteMembers = isAdmin || isOwner;
  const canViewAllMembers = true; // All members can view the list

  // Fetch group information when modal opens
  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupInfo();
      fetchGroupMedia();
      fetchUserPreferences();
    }
  }, [isOpen, groupId]);

  // Listen for group updates via socket
  useEffect(() => {
    if (!isOpen || !groupId) return;

    const handleGroupUpdated = (data: any) => {
      if (data.groupId === groupId) {
        console.log('Group updated via socket:', data);
        fetchGroupInfo();
      }
    };

    const handleMemberAdded = (data: any) => {
      if (data.groupId === groupId) {
        console.log('Member added via socket:', data);
        fetchGroupInfo();
      }
    };

    const handleMemberRemoved = (data: any) => {
      if (data.groupId === groupId) {
        console.log('Member removed via socket:', data);
        fetchGroupInfo();
      }
    };

    const handleGroupAvatarUpdated = (data: any) => {
      if (data.groupId === groupId) {
        console.log('Group avatar updated via socket:', data);
        fetchGroupInfo();
      }
    };

    // Add socket listeners if socket is available
    if (typeof window !== 'undefined' && (window as any).socket) {
      const socket = (window as any).socket;
      socket.on('group:updated', handleGroupUpdated);
      socket.on('member:added', handleMemberAdded);
      socket.on('member:removed', handleMemberRemoved);
      socket.on('group:avatar-updated', handleGroupAvatarUpdated);

      return () => {
        socket.off('group:updated', handleGroupUpdated);
        socket.off('member:added', handleMemberAdded);
        socket.off('member:removed', handleMemberRemoved);
        socket.off('group:avatar-updated', handleGroupAvatarUpdated);
      };
    }
  }, [isOpen, groupId]);

  const fetchGroupInfo = async () => {
    setIsLoading(true);
    setIsLoadingMembers(true);
    try {
      const response = await axios.get(`/api/group/${groupId}`, { 
        withCredentials: true 
      });
      const groupData = response.data?.group;
      
      if (!groupData) {
        throw new Error('Group data not found');
      }
      
      // Transform the data to match our interface
      const transformedGroup: GroupInfo = {
        _id: groupData._id,
        name: groupData.name,
        description: groupData.description,
        creator: groupData.creator,
        admins: groupData.admins || [],
        members: (groupData.members || []).map((member: any) => ({
          _id: member._id,
          name: member.name,
          email: member.email,
          profilePicture: member.profilePicture,
          role: groupData.creator === member._id ? 'owner' : 
                groupData.admins?.includes(member._id) ? 'admin' : 'member',
          joinedAt: groupData.createdAt, // We'll use group creation date as joined date
          isOnline: member.isOnline || false,
          isMuted: false, // Not implemented in backend yet
          lastSeen: member.lastSeen
        })),
        isMicEnabled: groupData.isMicEnabled || false,
        createdAt: groupData.createdAt,
        updatedAt: groupData.updatedAt,
        avatar: groupData.avatar,
        announcement: groupData.announcement,
        isInviteOnly: groupData.isInviteOnly || false,
        rules: groupData.rules || '',
        inviteLinks: groupData.inviteLinks || []
      };
      
      setGroupInfo(transformedGroup);
      setEditName(transformedGroup.name);
      setEditDescription(transformedGroup.description || '');
      setAnnouncement(transformedGroup.announcement || '');
      setGroupRules(transformedGroup.rules || '');
      
      // Debug logging to check admin detection
      console.log('Group Data:', transformedGroup);
      console.log('Current User ID:', currentUserId);
      console.log('Group Creator:', transformedGroup.creator);
      console.log('Group Admins:', transformedGroup.admins);
      console.log('Is Owner:', transformedGroup.creator === currentUserId);
      console.log('Is Admin:', transformedGroup.admins?.includes(currentUserId));
    } catch (error: any) {
      console.error('Error fetching group info:', error);
      toast.error('Failed to load group information');
    } finally {
      setIsLoading(false);
      setIsLoadingMembers(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await axios.get(`/api/user/preferences`, { withCredentials: true });
      const preferences = response.data?.preferences;
      
      // Check if user has muted this group
      const mutedGroups = preferences?.mutedGroups || [];
      setIsMuted(mutedGroups.includes(groupId));
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      // Set default state if preferences can't be fetched
      setIsMuted(false);
    }
  };

  const fetchGroupMedia = async () => {
    setIsLoadingMedia(true);
    try {
      const response = await axios.get(`/api/group/${groupId}/media`, { withCredentials: true });
      setGroupMedia(response.data?.media || []);
    } catch (error) {
      console.error('Error fetching group media:', error);
      toast.error('Failed to load group media');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleEditGroup = async () => {
    if (!groupInfo) return;
    
    try {
      await axios.put(`/api/group/${groupId}`, {
        name: editName,
        desc: editDescription
      }, { withCredentials: true });
      
      toast.success('Group updated successfully');
      setIsEditing(false);
      fetchGroupInfo();
      onGroupUpdate?.();
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    }
  };

  const handleUpdateDescription = async () => {
    if (!groupInfo) return;
    
    setIsUpdatingDescription(true);
    try {
      await axios.put(`/api/group/${groupId}`, {
        desc: editDescription
      }, { withCredentials: true });
      
      toast.success('Group description updated successfully');
      fetchGroupInfo();
      onGroupUpdate?.();
    } catch (error) {
      console.error('Error updating group description:', error);
      toast.error('Failed to update group description');
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  const handleAddMember = async (memberId: string) => {
    try {
      await axios.post(`/api/group/${groupId}/members`, {
        member: memberId
      }, { withCredentials: true });
      
      // Don't show success toast here as it will be shown by the modal
      fetchGroupInfo();
      onGroupUpdate?.();
    } catch (error) {
      console.error('Error adding member:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await axios.delete(`/api/group/${groupId}/members/${memberId}`, { withCredentials: true });
      
      toast.success('Member removed successfully');
      fetchGroupInfo();
      onGroupUpdate?.();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };



  const handleUpdateAnnouncement = async () => {
    setIsUpdatingAnnouncement(true);
    try {
      await axios.put(`/api/group/${groupId}/announcement`, {
        announcement: announcement
      }, { withCredentials: true });
      
      toast.success('Announcement updated successfully');
      fetchGroupInfo();
      onGroupUpdate?.();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
    } finally {
      setIsUpdatingAnnouncement(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await axios.delete(`/api/group/${groupId}`, { withCredentials: true });
      toast.success('Group deleted successfully');
      onGroupDelete?.();
      onClose();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group? You will no longer receive notifications and will not be able to re-join.')) {
      return;
    }

    try {
      await axios.post(`/api/group/${groupId}/leave`, { withCredentials: true });
      toast.success('You have left the group.');
      onGroupUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  // Group Settings Functions
  const handleAvatarChange = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canEditGroup) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    await handleUpdateGroupAvatar(file);
  };

  const handleUpdateGroupAvatar = async (file: File) => {
    if (!canEditGroup) return;
    
    setIsUpdatingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await axios.put(`/api/group/${groupId}/avatar`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Avatar update response:', response.data);
      console.log('About to emit socket event for group:', groupId, 'with avatar:', response.data.data?.avatar);
      toast.success('Group avatar updated successfully');
      fetchGroupInfo();
      onGroupUpdate?.();
    } catch (error) {
      console.error('Error updating group avatar:', error);
      toast.error('Failed to update group avatar');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleToggleMuteNotifications = async () => {
    try {
      if (isMuted) {
        // Unmute
        await axios.delete(`/api/group/${groupId}/mute`, { withCredentials: true });
        setIsMuted(false);
        toast.success('Group notifications unmuted');
      } else {
        // Mute
        await axios.post(`/api/group/${groupId}/mute`, {}, { withCredentials: true });
        setIsMuted(true);
        toast.success('Group notifications muted');
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const handleBlockGroup = async () => {
    if (!confirm('Are you sure you want to block this group? You will no longer receive any messages from this group.')) {
      return;
    }
    
    try {
      await axios.post(`/api/group/${groupId}/block`, {}, { withCredentials: true });
      toast.success('Group blocked successfully');
      onGroupDelete?.();
      onClose();
    } catch (error) {
      console.error('Error blocking group:', error);
      toast.error('Failed to block group');
    }
  };

  const handleReportGroup = async (reason: string) => {
    try {
      await axios.post(`/api/group/${groupId}/report`, { reason }, { withCredentials: true });
      toast.success('Group reported successfully');
    } catch (error) {
      console.error('Error reporting group:', error);
      toast.error('Failed to report group');
    }
  };



  const handleUpdateGroupRules = async () => {
    if (!canManage) return;
    
    setIsUpdatingRules(true);
    try {
      await axios.put(`/api/group/${groupId}/rules`, { rules: groupRules }, { withCredentials: true });
      toast.success('Group rules updated successfully');
      fetchGroupInfo();
      onGroupUpdate?.();
    } catch (error) {
      console.error('Error updating group rules:', error);
      toast.error('Failed to update group rules');
    } finally {
      setIsUpdatingRules(false);
    }
  };

  const handleGetAuditLog = async () => {
    if (!canManage) return;
    
    setIsLoadingAuditLog(true);
    try {
      const response = await axios.get(`/api/group/${groupId}/audit-log`, { withCredentials: true });
      setAuditLog(response.data?.auditLog || []);
      setShowAuditLog(true);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      toast.error('Failed to fetch audit log');
    } finally {
      setIsLoadingAuditLog(false);
    }
  };

  // Media Functions
  const handleFilterMediaByType = async (type: string) => {
    setMediaFilter(type);
    setIsLoadingMedia(true);
    try {
      const response = await axios.get(`/api/group/${groupId}/media?type=${type}`, { withCredentials: true });
      setGroupMedia(response.data?.media || []);
    } catch (error) {
      console.error('Error filtering media:', error);
      toast.error('Failed to filter media');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleSearchMedia = async (query: string) => {
    setMediaSearch(query);
    if (!query.trim()) {
      fetchGroupMedia();
      return;
    }
    
    setIsLoadingMedia(true);
    try {
      const response = await axios.get(`/api/group/${groupId}/media?search=${encodeURIComponent(query)}`, { withCredentials: true });
      setGroupMedia(response.data?.media || []);
    } catch (error) {
      console.error('Error searching media:', error);
      toast.error('Failed to search media');
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handlePreviewMedia = async (fileId: string) => {
    try {
      const response = await axios.get(`/api/media/${fileId}/preview`, { withCredentials: true });
      // Handle media preview (could open a modal)
      console.log('Media preview:', response.data);
      toast.info('Media preview feature coming soon');
    } catch (error) {
      console.error('Error previewing media:', error);
      toast.error('Failed to preview media');
    }
  };

  const handleDownloadMedia = async (fileId: string) => {
    try {
      const response = await axios.get(`/api/media/${fileId}/download`, { 
        withCredentials: true,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.headers['content-disposition']?.split('filename=')[1] || 'file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading media:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDeleteMedia = async (fileId: string) => {
    if (!canManage) return;
    
    if (!confirm('Are you sure you want to delete this media file?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/media/${fileId}`, { withCredentials: true });
      toast.success('Media file deleted successfully');
      fetchGroupMedia(); // Refresh media list
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media file');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <HiStar className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <HiShieldCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <HiInformationCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      default:
        return 'Member';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <HiPhotograph className="w-5 h-5 text-green-600" />;
      case 'video':
        return <HiPlay className="w-5 h-5 text-blue-600" />;
      case 'audio':
        return <HiMusicNote className="w-5 h-5 text-purple-600" />;
      default:
        return <HiDocument className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <div className="fixed inset-0 bg-black bg-opacity-25" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  if (!groupInfo) {
    return null;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 font-serif">
                    About {groupInfo.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Tabs */}
                  <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                  {[
                    { id: 'info', label: 'Info', icon: HiInformationCircle },
                      { id: 'members', label: 'Members', icon: HiUserAdd },
                      { id: 'settings', label: 'Settings', icon: HiPencil },
                    { id: 'media', label: 'Media', icon: HiPhotograph }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                </div>

                  {/* Tab Content */}
                  {activeTab === 'info' && (
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        {/* Group Avatar */}
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                          {groupInfo.avatar ? (
                            <img
                              src={groupInfo.avatar}
                              alt={groupInfo.name}
                              className="w-20 h-20 rounded-2xl object-cover"
                            />
                          ) : (
                            getInitials(groupInfo.name)
                          )}
                        </div>

                        {/* Group Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-bold text-gray-900">{groupInfo.name}</h4>
                            {groupInfo.isMicEnabled && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                Audio Enabled
                              </span>
                            )}
                          </div>
                          {groupInfo.description && (
                            <p className="text-gray-600 mb-3">{groupInfo.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <HiCalendar className="w-4 h-4" />
                              Created {formatDate(groupInfo.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <HiClock className="w-4 h-4" />
                              {formatTime(groupInfo.updatedAt)}
                            </div>
                          </div>
                        </div>

                        {/* Edit Button */}
                        {canEditGroup && (
                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <HiPencil className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {/* Edit Form */}
                      {isEditing && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Group Name
                            </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                          </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={handleEditGroup}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditing(false);
                                    setEditName(groupInfo.name);
                                    setEditDescription(groupInfo.description || '');
                                  }}
                              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                      )}

                      {/* Announcement */}
                      {groupInfo.announcement && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <HiInformationCircle className="w-5 h-5 text-blue-600" />
                            <h5 className="font-semibold text-blue-800">Announcement</h5>
                            </div>
                          <p className="text-blue-700">{groupInfo.announcement}</p>
                        </div>
                      )}

                      {/* Danger Zone */}
                      {canDeleteGroup && (
                        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border border-red-200/50">
                          <div className="flex items-center gap-3 mb-4">
                            <HiTrash className="w-6 h-6 text-red-600" />
                            <h5 className="font-semibold text-red-800">Danger Zone</h5>
                          </div>
                          <p className="text-slate-600 mb-4">
                            Once you delete a group, there is no going back. Please be certain.
                          </p>
                        <button
                            onClick={handleDeleteGroup}
                            disabled={isDeleting}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Group'}
                        </button>
                          </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'members' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-bold text-slate-800">Group Members</h4>
                        {canAddMembers && (
                          <button
                            onClick={() => setShowAddMemberModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            <HiUserAdd className="w-4 h-4" />
                            Add Users
                          </button>
                        )}
                      </div>

                      {/* Member Count */}
                      <div className="text-sm text-gray-600">
                        {groupInfo.members.length} member{groupInfo.members.length !== 1 ? 's' : ''}
                        </div>
                        
                      {/* Members List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {isLoadingMembers ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                            <p className="text-gray-500">Loading members...</p>
                          </div>
                        ) : groupInfo.members.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <HiUsers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium text-gray-700 mb-1">No members yet</p>
                            <p className="text-sm text-gray-500 mb-4">This group is empty.</p>
                        {canAddMembers && (
                          <button
                            onClick={() => setShowAddMemberModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            <HiUserAdd className="w-4 h-4" />
                                Invite Users
                          </button>
                        )}
                      </div>
                        ) : (
                          groupInfo.members.map((member) => (
                          <div
                            key={member._id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                              <div className="flex items-center gap-3">
                                {/* Avatar */}
                              <div className="relative">
                                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                {member.profilePicture ? (
                                  <img
                                    src={member.profilePicture}
                                    alt={member.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                      <span className="text-white font-semibold text-sm">
                                    {getInitials(member.name)}
                                      </span>
                                )}
                                  </div>
                                {member.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                              
                                {/* Member Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h5 className="font-semibold text-gray-900">{member.name}</h5>
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                      member.role === 'owner' 
                                        ? 'bg-purple-100 text-purple-800' 
                                        : member.role === 'admin'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {getRoleLabel(member.role)}
                                  </span>
                                </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span>
                                      {member.isOnline ? 'Online' : member.lastSeen ? `Last seen ${formatDate(member.lastSeen)}` : 'Offline'}
                                    </span>
                                    <span>Joined {formatDate(member.joinedAt)}</span>
                                  </div>
                              </div>
                            </div>

                              {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {canRemoveMembers && member._id !== currentUserId && member.role !== 'owner' && (
                                  <button
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setShowRemoveMemberModal(true);
                                    }}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove member"
                                  >
                                    <HiUserRemove className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                                </div>
                              )}
                              
                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-slate-800">Group Settings</h4>
                      
                      {/* General Settings */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <HiCog className="w-5 h-5 text-blue-600" />
                          General Settings
                        </h5>
                        
                        <div className="space-y-4">
                          {/* Group Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Group Name
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                disabled={!canEditGroup}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                              />
                              {canEditGroup && (
                                          <button
                                  onClick={handleEditGroup}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Save
                                          </button>
                                        )}
                            </div>
                          </div>

                          {/* Group Description */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <div className="flex items-start gap-3">
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                disabled={!canEditGroup}
                                rows={3}
                                placeholder="Enter group description..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                              />
                              {canEditGroup && (
                                          <button
                                  onClick={handleUpdateDescription}
                                  disabled={isUpdatingDescription}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                  {isUpdatingDescription ? 'Saving...' : 'Save'}
                                          </button>
                                        )}
                            </div>
                          </div>

                          {/* Group Announcement */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Announcement
                            </label>
                            <div className="flex items-start gap-3">
                              <textarea
                                value={announcement}
                                onChange={(e) => setAnnouncement(e.target.value)}
                                disabled={!canEditGroup}
                                rows={3}
                                placeholder="Enter group announcement..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                              />
                              {canEditGroup && (
                                <button
                                  onClick={handleUpdateAnnouncement}
                                  disabled={isUpdatingAnnouncement}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                  {isUpdatingAnnouncement ? 'Saving...' : 'Save'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Group Avatar */}
                          {canEditGroup && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Group Avatar
                              </label>
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    {groupInfo?.avatar ? (
                                      <img
                                        src={groupInfo.avatar}
                                        alt="Group Avatar"
                                        className="w-16 h-16 rounded-full object-cover"
                                      />
                                    ) : (
                                      groupInfo?.name?.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  {isUpdatingAvatar && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    </div>
                                  )}
                                </div>
                                <button 
                                  onClick={handleAvatarChange}
                                  disabled={isUpdatingAvatar}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                  {isUpdatingAvatar ? 'Uploading...' : 'Change Avatar'}
                                </button>
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileSelect}
                                  className="hidden"
                                  accept="image/*"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notification Settings */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <HiVolumeUp className="w-5 h-5 text-green-600" />
                          Notification Settings
                        </h5>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Mute Notifications</p>
                              <p className="text-sm text-gray-500">Stop receiving notifications from this group</p>
                            </div>
                                          <button
                              onClick={handleToggleMuteNotifications}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              {isMuted ? (
                                <HiVolumeOff className="w-4 h-4 text-red-600" />
                              ) : (
                                <HiVolumeUp className="w-4 h-4 text-green-600" />
                              )}
                              {isMuted ? 'Unmute' : 'Mute'}
                                          </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Block Group</p>
                              <p className="text-sm text-gray-500">Block this group and all its members</p>
                            </div>
                                          <button
                              onClick={handleBlockGroup}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Block
                                          </button>
                            </div>
                          </div>
                      </div>



                      {/* Admin Panel - Only for Admins */}
                      {canManage && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <HiShieldCheck className="w-5 h-5 text-yellow-600" />
                            Admin Panel
                          </h5>
                          
                          <div className="space-y-4">
                            {/* Group Rules */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Group Rules
                              </label>
                              <div className="flex items-start gap-3">
                            <textarea
                                  value={groupRules}
                                  onChange={(e) => setGroupRules(e.target.value)}
                                  disabled={!canManage}
                              rows={3}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                                {canManage && (
                              <button
                                    onClick={handleUpdateGroupRules}
                                    disabled={isUpdatingRules}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                    {isUpdatingRules ? 'Saving...' : 'Save Rules'}
                              </button>
                                )}
                            </div>
                          </div>

                            {/* Audit Log */}
                            <div className="flex items-center justify-between">
                          <div>
                                <p className="font-medium text-gray-900">Audit Log</p>
                                <p className="text-sm text-gray-500">View recent group activities</p>
                              </div>
                                <button
                                onClick={handleGetAuditLog}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                {isLoadingAuditLog ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
                                ) : (
                                  'View Log'
                                )}
                                </button>
                              </div>
                          </div>
                        </div>
                      )}

                      {/* Danger Zone */}
                      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                        <h5 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                          <HiExclamationCircle className="w-5 h-5 text-red-600" />
                          Danger Zone
                        </h5>
                        
                        <div className="space-y-4">
                          {/* Leave Group */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-red-900">Leave Group</p>
                              <p className="text-sm text-red-700">You will no longer be a member of this group</p>
                            </div>
                              <button
                              onClick={handleLeaveGroup}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                              Leave Group
                              </button>
                      </div>

                          {/* Delete Group - Owner Only */}
                      {canDeleteGroup && (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-red-900">Delete Group</p>
                                <p className="text-sm text-red-700">This action cannot be undone. All data will be permanently deleted.</p>
                          </div>
                          <button
                            onClick={handleDeleteGroup}
                            disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDeleting ? 'Deleting...' : 'Delete Group'}
                          </button>
                        </div>
                      )}

                          {/* Report Group */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-red-900">Report Group</p>
                              <p className="text-sm text-red-700">Report this group for inappropriate content</p>
                            </div>
                            <button 
                              onClick={() => handleReportGroup('Inappropriate content')}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'media' && (
                    <div className="space-y-6">
                      <h4 className="text-xl font-bold text-slate-800">Group Media</h4>
                      
                      {/* Media Controls */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <HiPhotograph className="w-5 h-5 text-blue-600" />
                            Shared Media
                          </h5>
                          <div className="flex items-center gap-2">
                            <select 
                              value={mediaFilter}
                              onChange={(e) => handleFilterMediaByType(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="all">All Media</option>
                              <option value="images">Images</option>
                              <option value="videos">Videos</option>
                              <option value="documents">Documents</option>
                              <option value="audio">Audio</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Search media..."
                              value={mediaSearch}
                              onChange={(e) => handleSearchMedia(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                        </div>

                        {/* Media Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {isLoadingMedia ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                              <p className="text-gray-500">Loading media...</p>
                            </div>
                          ) : groupMedia.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <HiPhotograph className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="font-medium text-gray-700 mb-1">No media yet</p>
                              <p className="text-sm text-gray-500 mb-4">Upload some media to get started!</p>
                            </div>
                          ) : (
                            groupMedia.map((item) => (
                              <div
                                key={item.id}
                                className="group relative"
                              >
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  {item.thumbnail ? (
                                    <img
                                      src={item.thumbnail}
                                      alt={item.fileName}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      {getMediaIcon(item.type)}
                                    </div>
                                  )}
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                    <button 
                                      onClick={() => handlePreviewMedia(item.id)}
                                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                      title="Preview"
                                    >
                                      <HiEye className="w-4 h-4 text-gray-700" />
                                    </button>
                                    <button 
                                      onClick={() => handleDownloadMedia(item.id)}
                                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                      title="Download"
                                    >
                                      <HiDownload className="w-4 h-4 text-gray-700" />
                                    </button>
                                    {(canManage || true) && (
                                      <button 
                                        onClick={() => handleDeleteMedia(item.id)}
                                        className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                                        title="Delete"
                                      >
                                        <HiTrash className="w-4 h-4 text-white" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.fileName}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(item.fileSize)} • {formatDate(item.uploadedAt)}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Load More Button */}
                        <div className="mt-6 text-center">
                          <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            Load More Media
                          </button>
                        </div>
                      </div>

                      {/* Media Statistics */}
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4">Media Statistics</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">24</p>
                            <p className="text-sm text-gray-500">Images</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">8</p>
                            <p className="text-sm text-gray-500">Videos</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">12</p>
                            <p className="text-sm text-gray-500">Documents</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">5</p>
                            <p className="text-sm text-gray-500">Audio</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <AddMemberModal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            onAddMember={handleAddMember}
            groupId={groupId}
            existingMembers={groupInfo?.members.map((m: Member) => m._id) || []}
          />
        )}

        {/* Remove Member Modal */}
        {showRemoveMemberModal && (
          <RemoveMemberModal
            isOpen={showRemoveMemberModal}
            onClose={() => {
              setShowRemoveMemberModal(false);
              setSelectedMember(null);
            }}
            onRemoveMember={handleRemoveMember}
            groupId={groupId}
            members={groupInfo?.members as Member[] || []}
            selectedMember={selectedMember}
          />
        )}

        {/* Audit Log Modal */}
        {showAuditLog && (
          <AuditLogModal
            isOpen={showAuditLog}
            onClose={() => setShowAuditLog(false)}
            auditLog={auditLog}
            isLoading={isLoadingAuditLog}
          />
        )}
      </Dialog>
    </Transition>
  );
};

// Remove Member Modal Component
interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRemoveMember: (memberId: string) => Promise<void>;
  groupId: string;
  members: Member[];
  selectedMember: Member | null;
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  isOpen,
  onClose,
  onRemoveMember,
  groupId,
  members,
  selectedMember
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(selectedMember || null);

  useEffect(() => {
    setMemberToRemove(selectedMember);
  }, [selectedMember]);

  const handleRemove = async () => {
    if (!memberToRemove) return;
    
    setIsRemoving(true);
    try {
      await onRemoveMember(memberToRemove._id);
      onClose();
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  // Safely render members list
  const renderMembersList = () => {
    if (!members || members.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No members found
        </div>
      );
    }

    return members.map((member: any) => (
      <div
        key={member._id}
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
          memberToRemove && memberToRemove._id === member._id
            ? 'bg-red-50 border border-red-200'
            : 'hover:bg-gray-50'
        }`}
        onClick={() => setMemberToRemove(member)}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
          {member.profilePicture ? (
            <img
              src={member.profilePicture}
              alt={member.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-xs">
              {member.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{member.name}</p>
          <p className="text-sm text-gray-500">
            {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
          </p>
        </div>
      </div>
    ));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 font-serif mb-4">
                Remove Member
              </Dialog.Title>
              
              {memberToRemove ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to remove <strong>{memberToRemove.name}</strong> from this group?
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRemove}
                      disabled={isRemoving}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isRemoving ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">Select a member to remove:</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {renderMembersList()}
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRemove}
                      disabled={!memberToRemove || isRemoving}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isRemoving ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Audit Log Modal Component
interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLog: AuditLogEntry[];
  isLoading: boolean;
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLog,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLog, setFilteredLog] = useState<AuditLogEntry[]>([]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    setFilteredLog(auditLog);
  }, [auditLog]);

  useEffect(() => {
    const results = auditLog.filter(entry =>
      entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLog(results);
  }, [searchQuery, auditLog]);

  const renderLogEntries = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading audit log...</p>
        </div>
      );
    }

    if (filteredLog.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No entries found for your search.
        </div>
      );
    }

    return filteredLog.map((entry) => (
      <div key={entry.id} className="bg-gray-50 p-4 rounded-lg mb-2">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{entry.userName}</span> {entry.action} on {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
        </p>
        <p className="text-xs text-gray-500 mt-1">{entry.details}</p>
      </div>
    ));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 font-serif mb-4">
                Audit Log
              </Dialog.Title>
              
              <div className="flex items-center gap-2 mb-4">
                <HiSearch className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search audit log..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {renderLogEntries()}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AboutButtonModal; 