import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Message from '../models/messageModel.js';
import Chat from '../models/chatModel.js';
import Group from '../models/groupModel.js';
import Friend from '../models/friendModel.js';

class RealtimeService {
  constructor(io) {
    this.io = io;
    this.onlineUsers = new Map(); // userId -> Set of socketIds
    this.userSockets = new Map(); // userId -> primary socketId
    this.groupMembers = new Map(); // groupId -> Set of userIds
    this.typingUsers = new Map(); // roomName -> Set of userIds
    
    this.setupEventHandlers();
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);
      let userId = null;

      // Handle authentication
      socket.on('authenticate', async () => {
        try {
          const cookies = socket.handshake.headers.cookie;
          if (!cookies) {
            console.log('❌ No cookies found for socket authentication');
            socket.emit('auth_error', { message: 'No cookies found' });
            return;
          }
          
          const token = cookies.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
          if (!token) {
            console.log('❌ No token found in cookies');
            socket.emit('auth_error', { message: 'No token provided' });
            return;
          }
          
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.user = decoded;
          userId = decoded.id;
          socket.userId = userId;
          
          // Track online user
          if (!this.onlineUsers.has(userId)) {
            this.onlineUsers.set(userId, new Set());
          }
          this.onlineUsers.get(userId).add(socket.id);
          
          // Map user to their primary socket for direct messaging
          this.userSockets.set(userId, socket.id);
          
          // Join personal room
          socket.join(userId.toString());
          console.log(`✅ User ${userId} authenticated and joined their room`);
          
          // Set user online in DB
          await User.findByIdAndUpdate(userId, { isOnline: true });
          
          // Emit user status to all connected clients
          this.io.emit('user-status', { userId, isOnline: true });
          
          // Send confirmation to client
          socket.emit('authenticated', { userId, socketId: socket.id });
          
        } catch (error) {
          console.error('❌ Socket authentication error:', error);
          socket.emit('auth_error', { message: 'Invalid token' });
        }
      });

      // Join room (for group chats)
      socket.on('joinRoom', ({ roomName }) => {
        if (!userId) {
          console.log('❌ User not authenticated, cannot join room');
          return;
        }
        socket.join(roomName);
        console.log(`👥 User ${userId} joined room: ${roomName}`);
        
        // Track group membership
        if (!this.groupMembers.has(roomName)) {
          this.groupMembers.set(roomName, new Set());
        }
        this.groupMembers.get(roomName).add(userId);
        this.emitGroupPresence(roomName);
      });

      // Leave room
      socket.on('leaveRoom', ({ roomName }) => {
        if (!userId) return;
        socket.leave(roomName);
        console.log(`👋 User ${userId} left room: ${roomName}`);
        if (this.groupMembers.has(roomName)) {
          this.groupMembers.get(roomName).delete(userId);
          this.emitGroupPresence(roomName);
        }
      });

      // Enhanced message handling for both personal and group chats
      socket.on('send_message', async (data, callback) => {
        try {
          console.log('📨 Received send_message event:', data);
          const { roomName, text, groupId, recipientId } = data;
          
          if (!userId) {
            console.log('❌ User not authenticated for message sending');
            if (callback) callback({ success: false, error: 'User not authenticated' });
            return;
          }
          
          if (!text || !text.trim()) {
            console.log('❌ Missing message content');
            if (callback) callback({ success: false, error: 'Message content is required' });
            return;
          }
          
          // Build message data
          const messageData = {
            sender: userId,
            content: text.trim(),
          };
          
          let message;
          let roomId;
          
          // Handle group messages
          if (groupId) {
            if (!mongoose.Types.ObjectId.isValid(groupId)) {
              console.log('❌ Invalid group ID format:', groupId);
              if (callback) callback({ success: false, error: 'Invalid group ID format' });
              return;
            }
            messageData.group = groupId;
            roomId = groupId;
            console.log('🔍 Creating group message for group:', groupId);
          }
          
          // Handle personal messages
          else if (recipientId) {
            if (!mongoose.Types.ObjectId.isValid(recipientId)) {
              console.log('❌ Invalid recipient ID format:', recipientId);
              if (callback) callback({ success: false, error: 'Invalid recipient ID format' });
              return;
            }
            messageData.recipient = recipientId;
            roomId = roomName;
            console.log('🔍 Creating personal message for recipient:', recipientId);
          }
          
          // Infer from room name if not provided
          else if (roomName) {
            const ids = roomName.split('_');
            const otherId = ids.find(id => id !== userId);
            if (otherId && mongoose.Types.ObjectId.isValid(otherId)) {
              messageData.recipient = otherId;
              roomId = roomName;
              console.log('🔍 Inferred recipient from room name:', otherId);
            } else if (mongoose.Types.ObjectId.isValid(roomName)) {
              messageData.group = roomName;
              roomId = roomName;
              console.log('🔍 Inferred group from room name:', roomName);
            } else {
              console.log('❌ Could not determine recipient/group from room name:', roomName);
              if (callback) callback({ success: false, error: 'Invalid room name format' });
              return;
            }
          } else {
            console.log('❌ Missing recipientId, groupId, or roomName');
            if (callback) callback({ success: false, error: 'Missing recipientId, groupId, or roomName' });
            return;
          }
          
          // Save message to database
          message = new Message(messageData);
          await message.save();
          
          // Handle chat creation/update for personal messages
          if (messageData.recipient) {
            try {
              // Create or get existing personal chat
              let chat = await Chat.findOne({
                type: 'personal',
                participants: {
                  $all: [userId, messageData.recipient],
                  $size: 2
                }
              });

              if (!chat) {
                // Create new personal chat
                chat = new Chat({
                  type: 'personal',
                  participants: [userId, messageData.recipient],
                  createdBy: userId
                });
                await chat.save();
                console.log('✅ Created new personal chat:', chat._id);
              }

              // Update chat with last message
              chat.lastMessage = messageData.content;
              chat.lastMessageTime = new Date();
              chat.unreadCount = (chat.unreadCount || 0) + 1;
              await chat.save();
              console.log('✅ Updated personal chat with new message');
            } catch (chatError) {
              console.error('❌ Error handling chat creation/update:', chatError);
            }
          }
          
          // Populate sender info
          await message.populate('sender', 'name profilePicture');
          if (messageData.recipient) {
            await message.populate('recipient', 'name profilePicture');
          }
          
          console.log('✅ Message saved to database:', message._id);
          
          // Emit message to appropriate recipients
          if (messageData.group) {
            // Group chat: emit to all group members
            const group = await Group.findById(messageData.group).populate('members', '_id');
            if (group && group.members) {
              const messagePayload = {
                _id: message._id,
                content: message.content,
                sender: message.sender,
                groupId: message.group,
                createdAt: message.createdAt,
                roomName: roomId
              };
              
              group.members.forEach(member => {
                const memberSocketId = this.userSockets.get(member._id.toString());
                if (memberSocketId) {
                  this.io.to(memberSocketId).emit('new-message', messagePayload);
                }
              });
            }
          } else if (messageData.recipient) {
            // Personal chat: emit to both sender and recipient
            const messagePayload = {
              _id: message._id,
              content: message.content,
              sender: message.sender,
              recipient: message.recipient,
              recipientId: message.recipient._id,
              createdAt: message.createdAt,
              roomName: roomId
            };
            
            // Send to recipient
            const recipientSocketId = this.userSockets.get(messageData.recipient);
            if (recipientSocketId) {
              this.io.to(recipientSocketId).emit('new-message', messagePayload);
              // Emit personal chat update to refresh sidebar
              this.io.to(recipientSocketId).emit('personal-chat-updated', {
                chatId: roomId,
                lastMessage: message.content,
                lastMessageTime: message.createdAt,
                sender: message.sender
              });
            }
            
            // Send to sender (for confirmation)
            const senderSocketId = this.userSockets.get(userId);
            if (senderSocketId) {
              this.io.to(senderSocketId).emit('new-message', messagePayload);
              // Emit personal chat update to refresh sidebar
              this.io.to(senderSocketId).emit('personal-chat-updated', {
                chatId: roomId,
                lastMessage: message.content,
                lastMessageTime: message.createdAt,
                sender: message.sender
              });
            }
          }
          
          // Send success callback
          if (callback) {
            callback({ 
              success: true, 
              message: {
                _id: message._id,
                content: message.content,
                sender: message.sender,
                createdAt: message.createdAt
              }
            });
          }
          
        } catch (error) {
          console.error('❌ Socket send_message error:', error);
          if (callback) callback({ success: false, error: error.message });
        }
      });

      // Typing indicators
      socket.on('typing-start', (data) => {
        if (!userId) return;
        
        const { roomName } = data;
        if (!this.typingUsers.has(roomName)) {
          this.typingUsers.set(roomName, new Set());
        }
        this.typingUsers.get(roomName).add(userId);
        
        // Emit typing indicator to other users in the room
        socket.to(roomName).emit('typing-indicator', {
          roomName,
          userId,
          isTyping: true
        });
      });

      socket.on('typing-stop', (data) => {
        if (!userId) return;
        
        const { roomName } = data;
        if (this.typingUsers.has(roomName)) {
          this.typingUsers.get(roomName).delete(userId);
        }
        
        // Emit typing stop to other users in the room
        socket.to(roomName).emit('typing-indicator', {
          roomName,
          userId,
          isTyping: false
        });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log('🔌 Client disconnected:', socket.id);
        
        if (userId) {
          // Remove from online users
          if (this.onlineUsers.has(userId)) {
            this.onlineUsers.get(userId).delete(socket.id);
            if (this.onlineUsers.get(userId).size === 0) {
              this.onlineUsers.delete(userId);
              this.userSockets.delete(userId);
              
              // Set user offline in DB
              await User.findByIdAndUpdate(userId, { isOnline: false });
              
              // Emit user status
              this.io.emit('user-status', { userId, isOnline: false });
            }
          }
          
          // Remove from group memberships
          for (const [roomName, members] of this.groupMembers.entries()) {
            if (members.has(userId)) {
              members.delete(userId);
              this.emitGroupPresence(roomName);
            }
          }
          
          // Remove from typing indicators
          for (const [roomName, typingUsers] of this.typingUsers.entries()) {
            if (typingUsers.has(userId)) {
              typingUsers.delete(userId);
            }
          }
        }
      });
    });
  }

  // Emit group presence
  emitGroupPresence(groupId) {
    const members = this.groupMembers.get(groupId);
    if (members) {
      const onlineMembers = Array.from(members).filter(userId => 
        this.onlineUsers.has(userId)
      );
      
      this.io.to(groupId).emit('group-presence', {
        groupId,
        online: onlineMembers
      });
    }
  }
}

export default RealtimeService; 