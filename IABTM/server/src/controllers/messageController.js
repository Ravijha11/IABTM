import mongoose from 'mongoose';
import Message from '../models/messageModel.js';
import Chat from '../models/chatModel.js';
import Group from '../models/groupModel.js';
import User from '../models/userModel.js';
import ApiError from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Send a new message
export const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, groupId, content, messageType = 'text' } = req.body;
  const senderId = req.user.id;

  // Validate required fields
  if (!content || !content.trim()) {
    throw new ApiError(400, "Message content is required");
  }

  if (!recipientId && !groupId) {
    throw new ApiError(400, "Either recipientId or groupId is required");
  }

  // Build message data
  const messageData = {
    sender: senderId,
    content: content.trim(),
    messageType
  };

  // Handle personal message
  if (recipientId) {
    console.log('🔍 Looking for recipient:', recipientId);
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      console.log('❌ Recipient not found:', recipientId);
      throw new ApiError(404, "Recipient not found");
    }
    console.log('✅ Recipient found:', recipient.name);
    messageData.recipient = recipientId;
    
    // Create or get existing personal chat
    console.log('🔍 Looking for existing chat between:', senderId, 'and', recipientId);
    let chat = await Chat.findOne({
      type: 'personal',
      participants: {
        $all: [senderId, recipientId],
        $size: 2
      }
    });

    if (!chat) {
      console.log('➕ Creating new personal chat');
      // Create new personal chat
      chat = new Chat({
        type: 'personal',
        participants: [senderId, recipientId],
        createdBy: senderId
      });
      await chat.save();
      console.log('✅ Created new personal chat:', chat._id);
    } else {
      console.log('✅ Found existing personal chat:', chat._id);
    }

    // Update chat with last message
    chat.lastMessage = content;
    chat.lastMessageTime = new Date();
    chat.unreadCount = (chat.unreadCount || 0) + 1;
    await chat.save();
    console.log('✅ Updated chat with new message');
  }

  // Handle group message
  if (groupId) {
    console.log('🔍 Looking for group:', groupId);
    const group = await Group.findById(groupId);
    if (!group) {
      console.log('❌ Group not found:', groupId);
      throw new ApiError(404, "Group not found");
    }
    console.log('✅ Group found:', group.name);
    
    const memberIds = group.members.map(String);
    console.log('🔍 Checking if user is member. User:', senderId, 'Members:', memberIds);
    if (!memberIds.includes(senderId)) {
      console.log('❌ User not a member of group');
      throw new ApiError(403, "You are not a member of this group");
    }
    console.log('✅ User is member of group');
    messageData.group = groupId;
  }

  // Create and save message
  const message = new Message(messageData);
  await message.save();
  await message.populate('sender', 'name profilePicture isOnline');
  if (recipientId) {
    await message.populate('recipient', 'name profilePicture isOnline');
  }
  if (groupId) {
    await message.populate('group', 'name avatar');
  }

  // Emit real-time event
  if (global.io) {
    if (recipientId) {
      // Personal message
      const roomName = [senderId, recipientId].sort().join('_');
      global.io.to(roomName).emit('new-message', {
        message,
        chatType: 'personal',
        recipientId
      });
      
      // Emit personal chat update
      global.io.to(senderId).emit('personal-chat-updated', {
        recipientId,
        lastMessage: content,
        lastMessageTime: new Date()
      });
      global.io.to(recipientId).emit('personal-chat-updated', {
        recipientId: senderId,
        lastMessage: content,
        lastMessageTime: new Date()
      });
    } else if (groupId) {
      // Group message
      global.io.to(groupId).emit('new-message', {
        message,
        chatType: 'group',
        groupId
      });
    }
  }

  res.status(201).json(
    new ApiResponse(201, "Message sent successfully", message)
  );
});

// Get direct messages between two users with cursor-based pagination
export const getDirectMessages = asyncHandler(async (req, res) => {
  const { recipientId } = req.params;
  const userId = req.user.id;
  const { limit = 50, cursor } = req.query;

  // Validate recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new ApiError(404, "Recipient not found");
  }

  // Build query with cursor-based pagination
  let query = {
    $or: [
      { sender: userId, recipient: recipientId },
      { sender: recipientId, recipient: userId }
    ],
    deleted: { $ne: true }
  };

  // Add cursor filter if provided
  if (cursor) {
    const cursorMessage = await Message.findById(cursor);
    if (cursorMessage) {
      query.createdAt = { $lt: cursorMessage.createdAt };
    }
  }

  // Get messages with optimized query
  const messages = await Message.find(query)
    .populate('sender', 'name profilePicture isOnline')
    .populate('recipient', 'name profilePicture isOnline')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 1) // Get one extra to check if there are more
    .lean();

  // Check if there are more messages
  const hasMore = messages.length > parseInt(limit);
  const messagesToReturn = hasMore ? messages.slice(0, parseInt(limit)) : messages;
  const nextCursor = hasMore ? messages[parseInt(limit) - 1]._id : null;

  // Mark messages as read in background (don't block response)
  Message.updateMany(
    {
      sender: recipientId,
      recipient: userId,
      'deliveryStatus.readBy.userId': { $ne: userId }
    },
    {
      $push: {
        'deliveryStatus.readBy': {
          userId: userId,
          readAt: new Date()
        }
      },
      $set: {
        'deliveryStatus.read': true,
        status: 'read'
      }
    }
  ).exec().catch(err => console.error('Error marking messages as read:', err));

  res.status(200).json(
    new ApiResponse(200, "Messages retrieved successfully", {
      messages: messagesToReturn.reverse(), // Show oldest first
      pagination: {
        hasMore,
        nextCursor,
        limit: parseInt(limit)
      }
    })
  );
});

// Get group messages with cursor-based pagination
export const getGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const { limit = 50, cursor } = req.query;

  // Validate group exists and user is a member
  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  if (!group.members.map(String).includes(userId)) {
    throw new ApiError(403, "You are not a member of this group");
  }

  // Build query with cursor-based pagination
  let query = {
    group: groupId,
    deleted: { $ne: true }
  };

  // Add cursor filter if provided
  if (cursor) {
    const cursorMessage = await Message.findById(cursor);
    if (cursorMessage) {
      query.createdAt = { $lt: cursorMessage.createdAt };
    }
  }

  // Get messages with optimized query
  const messages = await Message.find(query)
    .populate('sender', 'name profilePicture isOnline')
    .populate('group', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 1) // Get one extra to check if there are more
    .lean();

  // Check if there are more messages
  const hasMore = messages.length > parseInt(limit);
  const messagesToReturn = hasMore ? messages.slice(0, parseInt(limit)) : messages;
  const nextCursor = hasMore ? messages[parseInt(limit) - 1]._id : null;

  // Mark messages as read in background (don't block response)
  Message.updateMany(
    {
      group: groupId,
      sender: { $ne: userId },
      'deliveryStatus.readBy.userId': { $ne: userId }
    },
    {
      $push: {
        'deliveryStatus.readBy': {
          userId: userId,
          readAt: new Date()
        }
      },
      $set: {
        'deliveryStatus.read': true,
        status: 'read'
      }
    }
  ).exec().catch(err => console.error('Error marking messages as read:', err));

  res.status(200).json(
    new ApiResponse(200, "Messages retrieved successfully", {
      messages: messagesToReturn.reverse(), // Show oldest first
      pagination: {
        hasMore,
        nextCursor,
        limit: parseInt(limit)
      }
    })
  );
});

// Get user conversations (for sidebar) - REWRITTEN TO USE CHAT MODEL
export const getUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log('🔍 getUserConversations called for user:', userId);

  try {
    // Get personal conversations using Chat model (like groups)
    console.log('🔍 Starting personal conversations fetch...');
    
    const personalChats = await Chat.find({
      type: 'personal',
      participants: userId
    })
    .populate('participants', 'name profilePicture isOnline')
    .populate('createdBy', 'name profilePicture isOnline')
    .sort({ lastMessageTime: -1, updatedAt: -1 })
    .lean();
    
    console.log('📦 Found personal chats:', personalChats.length);
    
    // Format personal conversations
    const personalConversations = personalChats.map(chat => {
      // Find the other participant (not the current user)
      const otherParticipant = chat.participants.find(
        participant => participant._id.toString() !== userId
      );
      
      if (!otherParticipant) {
        console.warn('⚠️ Chat without other participant:', chat._id);
        return null;
      }
      
      return {
        recipient: otherParticipant,
        lastMessage: {
          _id: chat._id,
          content: chat.lastMessage || '',
          createdAt: chat.lastMessageTime || chat.updatedAt,
          sender: chat.createdBy
        },
        unreadCount: chat.unreadCount || 0
      };
    }).filter(Boolean); // Remove null entries
    
    console.log('✅ Personal conversations processed:', personalConversations.length);

    // Get group conversations using Group model (working approach)
    console.log('🔍 Starting group conversations fetch...');
    
    const userGroups = await Group.find({
      members: userId
    })
    .populate('members', 'name profilePicture isOnline')
    .populate('creator', 'name profilePicture isOnline')
    .sort({ updatedAt: -1 })
    .lean();
    
    console.log('📦 Found user groups:', userGroups.length);
    
    // Format group conversations
    const groupConversations = userGroups.map(group => {
      // Get the last message for this group
      return {
          group: {
          _id: group._id,
          name: group.name,
          avatar: group.avatar,
          isMicEnabled: group.isMicEnabled,
          'audioRoom.enabled': group.audioRoom?.enabled,
          memberCount: group.members?.length || 0
          },
          lastMessage: {
          _id: group._id,
          content: group.lastMessage || '',
          createdAt: group.lastMessageTime || group.updatedAt,
          sender: group.creator
        },
        unreadCount: group.unreadCount || 0
      };
    });
    
    console.log('✅ Group conversations processed:', groupConversations.length);

    console.log('Personal conversations found:', personalConversations.length);
    console.log('Group conversations found:', groupConversations.length);
    
    // Ensure we always return a valid response structure
    const responseData = {
      personal: personalConversations || [],
      groups: groupConversations || []
    };
    
    console.log('✅ Final response data:', {
      personalCount: responseData.personal.length,
      groupsCount: responseData.groups.length,
      hasPersonalData: responseData.personal.length > 0,
      hasGroupsData: responseData.groups.length > 0
    });
    
    // Return response in the same format as before
    res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully",
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error in getUserConversations:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    
    // Return error in the same format
    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations",
      error: error.message
    });
  }
});

// Mark messages as read
export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { messageIds, chatId, chatType } = req.body;
  const userId = req.user.id;

  if (!messageIds || !Array.isArray(messageIds)) {
    throw new ApiError(400, "Message IDs array is required");
  }

  // Mark messages as read
  await Message.updateMany(
    {
      _id: { $in: messageIds },
      sender: { $ne: userId }
    },
    {
    $push: {
      'deliveryStatus.readBy': {
        userId: userId,
        readAt: new Date()
      }
    },
    $set: {
      'deliveryStatus.read': true,
      status: 'read'
    }
    }
  );

  // Update chat unread count if chatId provided
  if (chatId && chatType === 'personal') {
    await Chat.findOneAndUpdate(
      {
        _id: chatId,
        participants: userId
      },
      {
        $set: { unreadCount: 0 }
      }
    );
  }

  res.status(200).json(
    new ApiResponse(200, "Messages marked as read successfully")
  );
});

// Delete a message
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Check if user is the sender
  if (message.sender.toString() !== userId) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  // Soft delete
  message.deleted = true;
  await message.save();

  res.status(200).json(
    new ApiResponse(200, "Message deleted successfully")
  );
});

// Edit a message
export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Message content is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Check if user is the sender
  if (message.sender.toString() !== userId) {
    throw new ApiError(403, "You can only edit your own messages");
  }

  // Check if message is recent (within 15 minutes)
  const messageAge = Date.now() - message.createdAt.getTime();
  if (messageAge > 15 * 60 * 1000) {
    throw new ApiError(400, "Messages can only be edited within 15 minutes");
  }

  message.content = content.trim();
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  res.status(200).json(
    new ApiResponse(200, "Message edited successfully", message)
  );
});

// Add reaction to message
export const addReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { reaction } = req.body;
  const userId = req.user.id;

  if (!reaction) {
    throw new ApiError(400, "Reaction is required");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Remove existing reaction from this user
  message.reactions = message.reactions.filter(
    r => r.userId.toString() !== userId
  );

  // Add new reaction
  message.reactions.push({
    userId: userId,
    reaction: reaction,
    createdAt: new Date()
  });

  await message.save();

  res.status(200).json(
    new ApiResponse(200, "Reaction added successfully", message)
  );
});

// Remove reaction from message
export const removeReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Remove user's reaction
  message.reactions = message.reactions.filter(
    r => r.userId.toString() !== userId
  );

  await message.save();

  res.status(200).json(
    new ApiResponse(200, "Reaction removed successfully", message)
  );
});

// Search messages
export const searchMessages = asyncHandler(async (req, res) => {
  const { query, chatId, chatType } = req.query;
  const userId = req.user.id;

  if (!query || !query.trim()) {
    throw new ApiError(400, "Search query is required");
  }

  let searchQuery = {
    content: { $regex: query, $options: 'i' },
    deleted: { $ne: true }
  };

  // Add chat-specific filters
  if (chatId && chatType === 'personal') {
    // For personal chats, search messages between two users
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      throw new ApiError(403, "Access denied");
    }
    
    const otherParticipant = chat.participants.find(p => p.toString() !== userId);
    searchQuery.$or = [
      { sender: userId, recipient: otherParticipant },
      { sender: otherParticipant, recipient: userId }
    ];
  } else if (chatId && chatType === 'group') {
    // For group chats, search messages in the group
    const group = await Group.findById(chatId);
    if (!group || !group.members.includes(userId)) {
      throw new ApiError(403, "Access denied");
    }
    searchQuery.group = chatId;
  }

  const messages = await Message.find(searchQuery)
    .populate('sender', 'name profilePicture')
    .populate('recipient', 'name profilePicture')
    .populate('group', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.status(200).json(
    new ApiResponse(200, "Search completed successfully", { messages })
  );
}); 