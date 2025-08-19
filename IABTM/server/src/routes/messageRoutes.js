import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  sendMessage,
  getDirectMessages,
  getGroupMessages,
  getUserConversations,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
  searchMessages
} from '../controllers/messageController.js';

const router = express.Router();

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({ message: 'Message API is working' });
});

// Debug endpoint to check chats
router.get('/debug/chats', async (req, res) => {
  try {
    const Chat = (await import('../models/chatModel.js')).default;
    const chats = await Chat.find({}).populate('participants', 'name email');
    res.json({ 
      success: true, 
      message: 'Chats retrieved successfully',
      data: chats 
    });
  } catch (error) {
    console.error('Debug chats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving chats',
      error: error.message
    });
  }
});

// Test message sending endpoint (for debugging)
router.post('/test-send', async (req, res) => {
  try {
    const { content, groupId, recipientId } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    
    // Create a test message
    const Message = (await import('../models/messageModel.js')).default;
    const testMessage = new Message({
      content,
      sender: '507f1f77bcf86cd799439011', // Test user ID
      ...(groupId && { group: groupId }),
      ...(recipientId && { recipient: recipientId })
    });
    
    await testMessage.save();
    
    res.json({ 
      success: true, 
      message: 'Test message created',
      data: testMessage
    });
  } catch (error) {
    console.error('Test message creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating test message',
      error: error.message
    });
  }
});

// Test personal chat creation endpoint
router.post('/test-personal-chat', async (req, res) => {
  try {
    const { senderId, recipientId, content } = req.body;
    
    if (!senderId || !recipientId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'senderId, recipientId, and content are required' 
      });
    }
    
    // Create a test personal message
    const Message = (await import('../models/messageModel.js')).default;
    const Chat = (await import('../models/chatModel.js')).default;
    
    // Create or get existing personal chat
    let chat = await Chat.findOne({
      type: 'personal',
      participants: {
        $all: [senderId, recipientId],
        $size: 2
      }
    });

    if (!chat) {
      // Create new personal chat
      chat = new Chat({
        type: 'personal',
        participants: [senderId, recipientId],
        createdBy: senderId
      });
      await chat.save();
      console.log('✅ Created new personal chat:', chat._id);
    }

    // Create the message
    const testMessage = new Message({
      content,
      sender: senderId,
      recipient: recipientId,
      messageType: 'text'
    });
    
    await testMessage.save();
    
    // Update chat with last message
    chat.lastMessage = content;
    chat.lastMessageTime = new Date();
    chat.unreadCount = (chat.unreadCount || 0) + 1;
    await chat.save();
    
    res.json({ 
      success: true, 
      message: 'Test personal chat message created',
      data: { message: testMessage, chat: chat }
    });
  } catch (error) {
    console.error('Test personal chat creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating test personal chat message',
      error: error.message
    });
  }
});

// Apply JWT verification to all routes
router.use(authenticate);

// Send a new message
router.post('/send-message', sendMessage);

// Get direct messages between two users
router.get('/direct/:recipientId', getDirectMessages);

// Get group messages
router.get('/group/:groupId', getGroupMessages);

// Get user conversations (for sidebar)
router.get('/conversations', getUserConversations);

// Mark messages as read
router.post('/mark-read', markMessagesAsRead);

// Delete a message
router.delete('/:messageId', deleteMessage);

// Edit a message
router.put('/:messageId', editMessage);

// Add reaction to message
router.post('/:messageId/reactions', addReaction);

// Remove reaction from message
router.delete('/:messageId/reactions', removeReaction);

// Search messages
router.get('/search', searchMessages);

export default router;