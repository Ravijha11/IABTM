import Group from '../models/groupModel.js';
import ApiError from '../utils/ApiError.js';
import { io } from '../../app.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import User from '../models/userModel.js';
import Message from '../models/messageModel.js'; // Added for getGroupMedia
import uploadOnCloudinary from '../utils/cloudinary.js'; // Added for updateGroupAvatar

export const editGroup = async (req, res) => {
  const { groupId } = req.params;
  const { name, desc, privacy } = req.body;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can edit group' });
    if (name) group.name = name;
    if (desc !== undefined) group.description = desc;
    if (privacy) group.privacy = privacy;
    await group.save();
    io.to(groupId).emit('group-updated', { groupId });
    res.status(200).json({ message: 'Group updated', group });
  } catch (err) {
    res.status(500).json({ message: 'Error editing group', error: err.message });
  }
};

export const addGroupMember = async (req, res) => {
  const { groupId } = req.params;
  const { member, members } = req.body;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can add members' });
    let added = false;
    if (Array.isArray(members)) {
      // Add multiple members
      for (const m of members) {
        if (!group.members.map(String).includes(m)) {
          group.members.push(m);
          added = true;
        }
      }
    } else if (member) {
      // Add single member
      if (!group.members.map(String).includes(member)) {
        group.members.push(member);
        added = true;
      }
    }
    if (added) await group.save();
    await group.populate('creator admins members', 'name email profilePicture isOnline');
    io.to(groupId).emit('group-updated', { groupId });
    res.status(200).json({ message: 'Member(s) added', group });
  } catch (err) {
    res.status(500).json({ message: 'Error adding member(s)', error: err.message });
  }
};

export const removeGroupMember = async (req, res) => {
  const { groupId, memberId } = req.params;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can remove members' });
    group.members = group.members.filter(m => m.toString() !== memberId);
    await group.save();
    io.to(groupId).emit('group-updated', { groupId });
    res.status(200).json({ message: 'Member removed', group });
  } catch (err) {
    res.status(500).json({ message: 'Error removing member', error: err.message });
  }
};

export const deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can delete group' });
    await group.deleteOne();
    io.to(groupId).emit('group-deleted', { groupId });
    res.status(200).json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting group', error: err.message });
  }
};

export const getGroupDetails = async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await Group.findById(groupId)
      .populate('members', '_id name profilePicture email')
      .populate('admins', '_id name profilePicture email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching group details', error: err.message });
  }
};

export const updateGroupAvatar = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar file provided' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin
    if (!group.admins.map(String).includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can update group avatar' });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadOnCloudinary(req.file.path, 'group-avatars');
    if (!uploadResult) {
      return res.status(500).json({ success: false, message: 'Failed to upload avatar' });
    }

    // Update group avatar
    group.avatar = uploadResult.secure_url;
    await group.save();

    // Emit socket event
    if (req.io) {
      req.io.to(groupId).emit('group:avatar-updated', { groupId, avatar: uploadResult.secure_url });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Group avatar updated successfully',
      data: { avatar: uploadResult.secure_url }
    });
  } catch (error) {
    console.error('Error updating group avatar:', error);
    res.status(500).json({ success: false, message: 'Error updating group avatar' });
  }
};

export const updateGroupAnnouncement = async (req, res) => {
  const { groupId } = req.params;
  const { announcement } = req.body;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can update announcement' });
    group.announcement = announcement;
    await group.save();
    io.to(groupId).emit('group-updated', { groupId });
    res.status(200).json({ message: 'Announcement updated', group });
  } catch (err) {
    res.status(500).json({ message: 'Error updating announcement', error: err.message });
  }
};

export const promoteAdmin = async (req, res) => {
  const { groupId, userId: promoteId } = req.body;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can promote' });
    if (!group.admins.map(String).includes(promoteId)) {
      group.admins.push(promoteId);
      await group.save();
      io.to(groupId).emit('group-updated', { groupId });
    }
    res.status(200).json({ message: 'User promoted to admin', group });
  } catch (err) {
    res.status(500).json({ message: 'Error promoting admin', error: err.message });
  }
};

export const demoteAdmin = async (req, res) => {
  const { groupId, userId: demoteId } = req.body;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can demote' });
    group.admins = group.admins.filter(a => String(a) !== demoteId);
    await group.save();
    io.to(groupId).emit('group-updated', { groupId });
    res.status(200).json({ message: 'User demoted from admin', group });
  } catch (err) {
    res.status(500).json({ message: 'Error demoting admin', error: err.message });
  }
};

export const removeMember = async (req, res) => {
  const { groupId, memberId } = req.body;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can remove members' });
    group.members = group.members.filter(m => String(m) !== memberId);
    group.admins = group.admins.filter(a => String(a) !== memberId); // Remove admin if admin is removed
    await group.save();
    io.to(groupId).emit('group-updated', { groupId });
    res.status(200).json({ message: 'Member removed', group });
  } catch (err) {
    res.status(500).json({ message: 'Error removing member', error: err.message });
  }
};

export const transferOwnership = async (req, res) => {
  const { groupId, newOwnerId } = req.body;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can transfer ownership' });
    if (!group.admins.map(String).includes(newOwnerId)) group.admins.push(newOwnerId);
    // Optionally, demote current owner if you want single owner
    await group.save();
    io.to(groupId).emit('group-updated', { groupId });
    res.status(200).json({ message: 'Ownership transferred', group });
  } catch (err) {
    res.status(500).json({ message: 'Error transferring ownership', error: err.message });
  }
};

export const pinMessage = async (req, res) => {
  const { groupId, messageId } = req.body;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can pin messages' });
    group.pinnedMessage = messageId;
    await group.save();
    io.to(groupId).emit('group-updated', { groupId });
    res.status(200).json({ message: 'Message pinned', group });
  } catch (err) {
    res.status(500).json({ message: 'Error pinning message', error: err.message });
  }
};

export const unpinMessage = async (req, res) => {
  const { groupId } = req.body;
  const userId = req.user.id;
  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.admins.map(String).includes(userId)) return res.status(403).json({ message: 'Only admins can unpin messages' });
    group.pinnedMessage = undefined;
    await group.save();
    io.to(groupId).emit('group-updated', { groupId });
    res.status(200).json({ message: 'Message unpinned', group });
  } catch (err) {
    res.status(500).json({ message: 'Error unpinning message', error: err.message });
  }
};

// Leave group (user voluntarily leaves)
export const leaveGroup = async (req, res) => {
  const { groupId } = req.body;
  const userId = req.user.id;
  
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Check if user is a member of the group
    if (!group.members.map(String).includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are not a member of this group' 
      });
    }

    // Remove user from members array
    group.members = group.members.filter(m => m.toString() !== userId);
    
    // Remove user from admins array if they are an admin
    group.admins = group.admins.filter(a => a.toString() !== userId);

    // If this was the last member, delete the group
    if (group.members.length === 0) {
      await group.deleteOne();
      io.to(groupId).emit('group-deleted', { groupId });
      return res.status(200).json({ 
        success: true, 
        message: 'Group deleted as you were the last member' 
      });
    }

    // If this was the last admin, promote the first member to admin
    if (group.admins.length === 0 && group.members.length > 0) {
      group.admins.push(group.members[0]);
    }

    await group.save();
    
    // Emit socket event to notify other members
    io.to(groupId).emit('group-updated', { 
      groupId, 
      action: 'member-left', 
      userId 
    });

    res.status(200).json({ 
      success: true, 
      message: 'Successfully left the group',
      data: {
        groupId,
        remainingMembers: group.members.length
      }
    });

  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error leaving group', 
      error: error.message 
    });
  }
};

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, members, isMicEnabled } = req.body;
    const userId = req.user.id;

    if (!name || !userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Group name and user ID are required.' 
      });
    }

    // Ensure host is included
    let allMembers = Array.isArray(members) ? Array.from(new Set([userId, ...members])) : [userId];

    // Generate unique room name for audio room if enabled
    const roomName = isMicEnabled ? `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

    // Create group
    const group = new Group({
      name,
      description,
      creator: userId,
      admins: [userId],
      members: allMembers,
      isMicEnabled: isMicEnabled || false,
      audioRoom: {
        enabled: isMicEnabled || false,
        roomName: roomName,
        maxParticipants: 20,
        isActive: false,
        hostId: isMicEnabled ? userId : null
      }
    });
    await group.save();

    // Optionally, add group to user's groups array
    await User.findByIdAndUpdate(userId, { $addToSet: { groups: group._id } });

    // Populate for frontend
    await group.populate('creator admins members', 'name email profilePicture isOnline');

    // Calculate online count
    const memberCount = group.members.length;
    const onlineCount = group.members.filter(m => m.isOnline).length;

    res.status(201).json({ 
      success: true,
      data: { ...group.toObject(), memberCount, onlineCount }, 
      message: 'Group created successfully.' 
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating group', 
      error: error.message 
    });
  }
};

// Get all groups for the current user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 getUserGroups called for user:', userId);
    
    const groups = await Group.find({ members: userId })
      .populate('creator admins members', 'name email profilePicture isOnline')
      .sort({ createdAt: -1 });
    
    console.log('📦 Found groups:', groups.length);
    
    // Add memberCount and onlineCount to each group
    const groupsWithCounts = groups.map(group => {
      const memberCount = group.members.length;
      const onlineCount = group.members.filter(m => m.isOnline).length;
      return { ...group.toObject(), memberCount, onlineCount };
    });
    
    console.log('✅ Returning groups with counts:', groupsWithCounts.length);
    
    res.status(200).json({ 
      success: true,
      message: 'Groups fetched successfully',
      data: groupsWithCounts 
    });
  } catch (error) {
    console.error('❌ Error in getUserGroups:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching groups', 
      error: error.message 
    });
  }
}; 

// Enhanced Group Management Functions

// Mute/Unmute group notifications
export const muteGroupNotifications = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const isMuting = req.method === 'POST'; // POST = mute, DELETE = unmute

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.map(String).includes(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    if (isMuting) {
      // Add to muted groups in user document
      await User.findByIdAndUpdate(userId, { 
        $addToSet: { mutedGroups: groupId } 
      });
      res.status(200).json({ 
        success: true, 
        message: 'Group notifications muted successfully' 
      });
    } else {
      // Remove from muted groups in user document
      await User.findByIdAndUpdate(userId, { 
        $pull: { mutedGroups: groupId } 
      });
      res.status(200).json({ 
        success: true, 
        message: 'Group notifications unmuted successfully' 
      });
    }
  } catch (error) {
    console.error('Error toggling group notifications:', error);
    res.status(500).json({ success: false, message: 'Error updating notification settings' });
  }
};

// Block group
export const blockGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Add to blocked groups in user document
    await User.findByIdAndUpdate(userId, { 
      $addToSet: { blockedGroups: groupId },
      $pull: { groups: groupId } // Remove from user's groups
    });

    // Remove user from group members
    group.members = group.members.filter(member => member.toString() !== userId);
    if (group.admins.includes(userId)) {
      group.admins = group.admins.filter(admin => admin.toString() !== userId);
    }
    await group.save();

    res.status(200).json({ 
      success: true, 
      message: 'Group blocked successfully' 
    });
  } catch (error) {
    console.error('Error blocking group:', error);
    res.status(500).json({ success: false, message: 'Error blocking group' });
  }
};

// Report group
export const reportGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Create report record (you might want to create a Report model)
    const report = {
      groupId,
      reportedBy: userId,
      reason,
      reportedAt: new Date(),
      status: 'pending'
    };

    // For now, we'll just log it. In a real app, you'd save to a reports collection
    console.log('Group reported:', report);

    res.status(200).json({ 
      success: true, 
      message: 'Group reported successfully' 
    });
  } catch (error) {
    console.error('Error reporting group:', error);
    res.status(500).json({ success: false, message: 'Error reporting group' });
  }
};

// Set chat background
export const setChatBackground = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { theme } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.map(String).includes(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    // Update user's chat background preference for this group
    await User.findByIdAndUpdate(userId, { 
      $set: { [`chatBackgrounds.${groupId}`]: theme } 
    });

    res.status(200).json({ 
      success: true, 
      message: 'Chat background set successfully' 
    });
  } catch (error) {
    console.error('Error setting chat background:', error);
    res.status(500).json({ success: false, message: 'Error setting chat background' });
  }
};

// Toggle join permissions
export const toggleJoinPermissions = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { isInviteOnly } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin
    if (!group.admins.map(String).includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can change join permissions' });
    }

    group.isInviteOnly = isInviteOnly;
    await group.save();

    // Emit socket event
    if (req.io) {
      req.io.to(groupId).emit('group:permissions-updated', { groupId, isInviteOnly });
    }

    res.status(200).json({ 
      success: true, 
      message: `Group is now ${isInviteOnly ? 'invite-only' : 'open to all'}` 
    });
  } catch (error) {
    console.error('Error toggling join permissions:', error);
    res.status(500).json({ success: false, message: 'Error updating join permissions' });
  }
};

// Generate invite link
export const generateInviteLink = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin
    if (!group.admins.map(String).includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can generate invite links' });
    }

    // Generate unique invite link
    const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const inviteLink = `${process.env.FRONTEND_URL}/join-group/${inviteCode}`;

    // Store invite link in group (you might want to create an Invite model)
    group.inviteLinks = group.inviteLinks || [];
    group.inviteLinks.push({
      code: inviteCode,
      createdBy: userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    await group.save();

    res.status(200).json({ 
      success: true, 
      message: 'Invite link generated successfully',
      data: { inviteLink }
    });
  } catch (error) {
    console.error('Error generating invite link:', error);
    res.status(500).json({ success: false, message: 'Error generating invite link' });
  }
};

// Edit group rules
export const editGroupRules = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { rules } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin
    if (!group.admins.map(String).includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can edit group rules' });
    }

    group.rules = rules;
    await group.save();

    // Emit socket event
    if (req.io) {
      req.io.to(groupId).emit('group:rules-updated', { groupId, rules });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Group rules updated successfully' 
    });
  } catch (error) {
    console.error('Error editing group rules:', error);
    res.status(500).json({ success: false, message: 'Error updating group rules' });
  }
};

// Get audit log
export const getAuditLog = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is admin
    if (!group.admins.map(String).includes(userId)) {
      return res.status(403).json({ success: false, message: 'Only admins can view audit log' });
    }

    // For now, return a sample audit log. In a real app, you'd query an audit log collection
    const auditLog = [
      {
        action: 'member_added',
        userId: 'user123',
        userName: 'John Doe',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        details: 'Added by admin'
      },
      {
        action: 'message_deleted',
        userId: 'user456',
        userName: 'Jane Smith',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        details: 'Deleted inappropriate message'
      }
    ];

    res.status(200).json({ 
      success: true, 
      message: 'Audit log retrieved successfully',
      data: auditLog
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({ success: false, message: 'Error retrieving audit log' });
  }
};

// Get group media
export const getGroupMedia = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { type, search } = req.query;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.map(String).includes(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    // Query messages with media for this group
    let query = { group: groupId, messageType: { $in: ['image', 'file', 'video', 'audio'] } };
    
    if (type && type !== 'all') {
      query.messageType = type;
    }

    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } }
      ];
    }

    const mediaMessages = await Message.find(query)
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

    // Transform to media format
    const media = mediaMessages.map(msg => ({
      id: msg._id,
      type: msg.messageType,
      url: msg.media?.url || msg.fileUrl,
      fileName: msg.media?.fileName || msg.fileName,
      fileSize: msg.media?.fileSize || msg.fileSize,
      uploadedBy: msg.sender,
      uploadedAt: msg.createdAt,
      thumbnail: msg.media?.thumbnail || msg.thumbnailUrl
    }));

    res.status(200).json({ 
      success: true, 
      message: 'Group media retrieved successfully',
      data: media
    });
  } catch (error) {
    console.error('Error getting group media:', error);
    res.status(500).json({ success: false, message: 'Error retrieving group media' });
  }
};

// Audio Room Management Functions

export const getAudioRoomToken = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { roomName } = req.body;

    // 1.1. Implement Verbose Logging for Diagnosis
    console.log(`🔍 [AUDIO-ROOM-TOKEN] Received request for group: ${groupId}`);
    console.log('📦 [AUDIO-ROOM-TOKEN] Request Body:', req.body);
    console.log('👤 [AUDIO-ROOM-TOKEN] Authenticated User:', { id: userId, name: req.user.name });

    // 1.2. Add Strict Input Validation
    if (!groupId) {
      console.error('❌ [AUDIO-ROOM-TOKEN] Failed: Missing groupId parameter');
      return res.status(400).json({ 
        success: false, 
        message: 'Group ID is required' 
      });
    }

    if (!userId) {
      console.error('❌ [AUDIO-ROOM-TOKEN] Failed: Missing user authentication');
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    // Find the group and verify membership
    const group = await Group.findById(groupId);
    if (!group) {
      console.error(`❌ [AUDIO-ROOM-TOKEN] Failed: Group ${groupId} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    // Check if user is member
    if (!group.members.map(String).includes(userId)) {
      console.error(`❌ [AUDIO-ROOM-TOKEN] Failed: User ${userId} is not a member of group ${groupId}`);
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a member of this group' 
      });
    }

    // Check if audio room is enabled for this group
    if (!group.audioRoom.enabled && !group.isMicEnabled) {
      console.error(`❌ [AUDIO-ROOM-TOKEN] Failed: Audio room is not enabled for group ${groupId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Audio room is not enabled for this group' 
      });
    }

    console.log(`✅ [AUDIO-ROOM-TOKEN] Group validation passed for group: ${groupId}`);

    // 1.3. Enhanced Room Management Logic
    let activeRoom = group.audioRoom;
    let isHost = false;
    
    // If no active room exists, create one
    if (!activeRoom.isActive) {
      console.log(`🏠 [AUDIO-ROOM-TOKEN] Creating new audio room for group: ${groupId}`);
      
      // Generate unique room name with better uniqueness
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9);
      const livekitRoomName = `audio_${groupId}_${timestamp}_${randomSuffix}`;
      
      // Update group with new audio room
      group.audioRoom = {
        enabled: true,
        roomName: livekitRoomName,
        maxParticipants: 20,
        isActive: true,
        startedAt: new Date(),
        hostId: userId,
        participants: [{
          userId: userId,
          joinedAt: new Date(),
          isMuted: false,
          isSpeaking: false
        }]
      };
      
      await group.save();
      activeRoom = group.audioRoom;
      isHost = true;
      
      console.log(`✅ [AUDIO-ROOM-TOKEN] Created new audio room: ${livekitRoomName}`);
      
      // Emit socket event to notify other group members
      if (global.io) {
        global.io.to(groupId).emit('audio-room-started', {
          groupId,
          roomName: livekitRoomName,
          hostId: userId,
          startedAt: group.audioRoom.startedAt
        });
      }
    } else {
      console.log(`🔗 [AUDIO-ROOM-TOKEN] Using existing audio room: ${activeRoom.roomName}`);
      
      // Check if user is the host
      isHost = activeRoom.hostId.toString() === userId;
      
      // Check if user is already in the room
      const existingParticipant = activeRoom.participants.find(
        p => p.userId.toString() === userId && !p.leftAt
      );

      if (!existingParticipant) {
        // Add user to participants
        group.audioRoom.participants.push({
          userId: userId,
          joinedAt: new Date(),
          isMuted: false,
          isSpeaking: false
        });
        await group.save();
        console.log(`👤 [AUDIO-ROOM-TOKEN] Added user ${userId} to existing room`);
        
        // Emit socket event to notify other participants
        if (global.io) {
          global.io.to(groupId).emit('audio-room-joined', {
            groupId,
            userId,
            joinedAt: new Date()
          });
        }
      } else {
        console.log(`👤 [AUDIO-ROOM-TOKEN] User ${userId} already in room`);
      }
    }

    // 1.4. Generate Access Token
    // Create a simple token for our custom LiveKit server
    const tokenData = {
      roomName: activeRoom.roomName,
      userId: userId,
      groupId: groupId,
      isHost: isHost,
      timestamp: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour expiry
    };
    
    // Simple token generation (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    
    console.log(`✅ [AUDIO-ROOM-TOKEN] Token generated for user ${userId} in room ${activeRoom.roomName}`);

    // 1.5. Return Response
    res.status(200).json({
      success: true,
      message: 'Audio room token generated successfully',
      data: {
        token,
        roomName: activeRoom.roomName,
        hostId: activeRoom.hostId,
        participants: activeRoom.participants.filter(p => !p.leftAt),
        isHost,
        startedAt: activeRoom.startedAt,
        maxParticipants: activeRoom.maxParticipants
      }
    });

  } catch (error) {
    console.error('❌ [AUDIO-ROOM-TOKEN] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating audio room token',
      error: error.message
    });
  }
};

export const startAudioRoom = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    console.log(`🔍 [START-AUDIO-ROOM] Received request for group: ${groupId}`);
    console.log('👤 [START-AUDIO-ROOM] Authenticated User:', { id: userId, name: req.user.name });

    const group = await Group.findById(groupId);
    if (!group) {
      console.error(`❌ [START-AUDIO-ROOM] Group ${groupId} not found`);
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.map(String).includes(userId)) {
      console.error(`❌ [START-AUDIO-ROOM] User ${userId} is not a member of group ${groupId}`);
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    // Check if audio room is enabled for this group
    if (!group.audioRoom.enabled && !group.isMicEnabled) {
      console.error(`❌ [START-AUDIO-ROOM] Audio room is not enabled for group ${groupId}`);
      return res.status(400).json({ success: false, message: 'Audio room is not enabled for this group' });
    }

    // Check if audio room is already active
    if (group.audioRoom.isActive) {
      console.log(`ℹ️ [START-AUDIO-ROOM] Audio room already active for group ${groupId}`);
      return res.status(400).json({ success: false, message: 'Audio room is already active' });
    }

    // Start the audio room
    const livekitRoomName = `audio_${groupId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    group.audioRoom.isActive = true;
    group.audioRoom.startedAt = new Date();
    group.audioRoom.hostId = userId;
    group.audioRoom.roomName = livekitRoomName;
    
    // Add host as first participant
    group.audioRoom.participants = [{
      userId: userId,
      joinedAt: new Date(),
      isMuted: false,
      isSpeaking: false
    }];

    await group.save();

    console.log(`✅ [START-AUDIO-ROOM] Started audio room: ${livekitRoomName}`);

    // Emit socket event
    io.to(groupId).emit('audio-room-started', {
      groupId,
      roomName: livekitRoomName,
      hostId: userId,
      startedAt: group.audioRoom.startedAt
    });

    res.status(200).json({
      success: true,
      message: 'Audio room started successfully',
      data: {
        roomName: livekitRoomName,
        hostId: userId,
        startedAt: group.audioRoom.startedAt
      }
    });
  } catch (error) {
    console.error('❌ [START-AUDIO-ROOM] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting audio room',
      error: error.message
    });
  }
};

export const joinAudioRoom = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    console.log(`🔍 [JOIN-AUDIO-ROOM] Received request for group: ${groupId}`);
    console.log('👤 [JOIN-AUDIO-ROOM] Authenticated User:', { id: userId, name: req.user.name });

    const group = await Group.findById(groupId);
    if (!group) {
      console.error(`❌ [JOIN-AUDIO-ROOM] Group ${groupId} not found`);
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.map(String).includes(userId)) {
      console.error(`❌ [JOIN-AUDIO-ROOM] User ${userId} is not a member of group ${groupId}`);
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    // Check if audio room is active
    if (!group.audioRoom.isActive) {
      console.error(`❌ [JOIN-AUDIO-ROOM] Audio room is not active for group ${groupId}`);
      return res.status(400).json({ success: false, message: 'Audio room is not active' });
    }

    // Check if user is already in the room
    const existingParticipant = group.audioRoom.participants.find(
      p => p.userId.toString() === userId && !p.leftAt
    );

    if (existingParticipant) {
      console.log(`ℹ️ [JOIN-AUDIO-ROOM] User ${userId} already in room`);
      return res.status(400).json({ success: false, message: 'You are already in the audio room' });
    }

    // Add user to participants
    group.audioRoom.participants.push({
      userId: userId,
      joinedAt: new Date(),
      isMuted: false,
      isSpeaking: false
    });

    await group.save();

    console.log(`✅ [JOIN-AUDIO-ROOM] User ${userId} joined audio room`);

    // Emit socket event
    io.to(groupId).emit('audio-room-joined', {
      groupId,
      userId,
      joinedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Joined audio room successfully',
      data: {
        roomName: group.audioRoom.roomName,
        joinedAt: new Date()
      }
    });
  } catch (error) {
    console.error('❌ [JOIN-AUDIO-ROOM] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining audio room',
      error: error.message
    });
  }
};

export const leaveAudioRoom = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    console.log(`🔍 [LEAVE-AUDIO-ROOM] Received request for group: ${groupId}`);
    console.log('👤 [LEAVE-AUDIO-ROOM] Authenticated User:', { id: userId, name: req.user.name });

    const group = await Group.findById(groupId);
    if (!group) {
      console.error(`❌ [LEAVE-AUDIO-ROOM] Group ${groupId} not found`);
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Find and update participant
    const participant = group.audioRoom.participants.find(
      p => p.userId.toString() === userId && !p.leftAt
    );

    if (!participant) {
      console.error(`❌ [LEAVE-AUDIO-ROOM] User ${userId} not in room`);
      return res.status(400).json({ success: false, message: 'You are not in the audio room' });
    }

    participant.leftAt = new Date();
    await group.save();

    console.log(`✅ [LEAVE-AUDIO-ROOM] User ${userId} left audio room`);

    // Emit socket event
    io.to(groupId).emit('audio-room-left', {
      groupId,
      userId,
      leftAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Left audio room successfully'
    });
  } catch (error) {
    console.error('❌ [LEAVE-AUDIO-ROOM] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving audio room',
      error: error.message
    });
  }
};

export const endAudioRoom = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    console.log(`🔍 [END-AUDIO-ROOM] Received request for group: ${groupId}`);
    console.log('👤 [END-AUDIO-ROOM] Authenticated User:', { id: userId, name: req.user.name });

    const group = await Group.findById(groupId);
    if (!group) {
      console.error(`❌ [END-AUDIO-ROOM] Group ${groupId} not found`);
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is host
    if (group.audioRoom.hostId.toString() !== userId) {
      console.error(`❌ [END-AUDIO-ROOM] User ${userId} is not host of group ${groupId}`);
      return res.status(403).json({ success: false, message: 'Only the host can end the audio room' });
    }

    // End the audio room
    group.audioRoom.isActive = false;
    group.audioRoom.endedAt = new Date();
    await group.save();

    console.log(`✅ [END-AUDIO-ROOM] Audio room ended for group ${groupId}`);

    // Emit socket event
    io.to(groupId).emit('audio-room-ended', {
      groupId,
      endedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Audio room ended successfully'
    });
  } catch (error) {
    console.error('❌ [END-AUDIO-ROOM] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending audio room',
      error: error.message
    });
  }
};

export const getAudioRoomStatus = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    console.log(`🔍 [AUDIO-ROOM-STATUS] Received request for group: ${groupId}`);
    console.log('👤 [AUDIO-ROOM-STATUS] Authenticated User:', { id: userId, name: req.user.name });

    const group = await Group.findById(groupId);
    if (!group) {
      console.error(`❌ [AUDIO-ROOM-STATUS] Group ${groupId} not found`);
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.map(String).includes(userId)) {
      console.error(`❌ [AUDIO-ROOM-STATUS] User ${userId} is not a member of group ${groupId}`);
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    console.log(`✅ [AUDIO-ROOM-STATUS] Status retrieved for group: ${groupId}`);

    res.status(200).json({
      success: true,
      message: 'Audio room status fetched successfully',
      data: {
        enabled: group.audioRoom.enabled || group.isMicEnabled,
        isActive: group.audioRoom.isActive,
        roomName: group.audioRoom.roomName,
        hostId: group.audioRoom.hostId,
        startedAt: group.audioRoom.startedAt,
        endedAt: group.audioRoom.endedAt,
        participants: group.audioRoom.participants.filter(p => !p.leftAt).length,
        maxParticipants: group.audioRoom.maxParticipants
      }
    });
  } catch (error) {
    console.error('❌ [AUDIO-ROOM-STATUS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting audio room status',
      error: error.message
    });
  }
}; 