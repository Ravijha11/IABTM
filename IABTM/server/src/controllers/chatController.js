import Chat from '../models/chatModel.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Create or get existing personal chat
export const createPersonalChat = asyncHandler(async (req, res) => {
  const { memberId } = req.body;
  const currentUserId = req.user.id;

  if (!memberId) {
    throw new ApiError(400, 'Member ID is required');
  }

  // Check if member exists
  const member = await User.findById(memberId);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  // Check if personal chat already exists between these users
  let existingChat = await Chat.findOne({
    type: 'personal',
    participants: {
      $all: [currentUserId, memberId],
      $size: 2
    }
  });

  if (existingChat) {
    // Return existing chat
    await existingChat.populate('participants', 'name email profilePicture isOnline');
    
    return res.status(200).json(
      new ApiResponse(200, existingChat, 'Personal chat retrieved successfully')
    );
  }

  // Create new personal chat
  const newChat = new Chat({
    type: 'personal',
    participants: [currentUserId, memberId],
    createdBy: currentUserId
  });

  await newChat.save();
  await newChat.populate('participants', 'name email profilePicture isOnline');

  res.status(201).json(
    new ApiResponse(201, newChat, 'Personal chat created successfully')
  );
});

// Get all personal chats for current user
export const getPersonalChats = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;

  const personalChats = await Chat.find({
    type: 'personal',
    participants: currentUserId
  }).populate('participants', 'name email profilePicture isOnline');

  // Format chats to show the other participant's info
  const formattedChats = personalChats.map(chat => {
    const otherParticipant = chat.participants.find(
      participant => participant._id.toString() !== currentUserId
    );

    return {
      _id: chat._id,
      type: 'personal',
      participant: otherParticipant,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime,
      unreadCount: chat.unreadCount || 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    };
  });

  res.status(200).json(
    new ApiResponse(200, formattedChats, 'Personal chats retrieved successfully')
  );
});

// Get messages for a specific personal chat
export const getPersonalChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user.id;

  // Verify user is participant in this chat
  const chat = await Chat.findOne({
    _id: chatId,
    type: 'personal',
    participants: currentUserId
  });

  if (!chat) {
    throw new ApiError(404, 'Chat not found or access denied');
  }

  // Get messages for this chat
  const messages = await Message.find({
    chatId: chatId
  })
  .populate('sender', 'name email profilePicture')
  .sort({ createdAt: -1 })
  .limit(50);

  res.status(200).json(
    new ApiResponse(200, { messages: messages.reverse() }, 'Messages retrieved successfully')
  );
}); 