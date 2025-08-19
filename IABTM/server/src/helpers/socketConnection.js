import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import markMessageAsRead from './markMessageAsRead.js';
import Message from '../models/messageModel.js';
import mongoose from 'mongoose';
import Group from '../models/groupModel.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Track online users and group memberships
const onlineUsers = new Map(); // userId -> Set of socketIds
const groupMembers = new Map(); // groupId -> Set of userIds

// Track audio room users per group


// --- FEED REAL-TIME EVENTS ---
let ioInstance = null;

export const setFeedSocketIO = (io) => {
  ioInstance = io;
};

export const emitFeedEvent = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

const emitGroupPresence = (io, groupId) => {
  const members = groupMembers.get(groupId) || new Set();
  const online = Array.from(members).filter(userId => onlineUsers.has(userId));
  io.to(groupId).emit('group-presence', { groupId, online });
};

const initializeSocket = (io) => {
  setFeedSocketIO(io);
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    let userId = null;

    socket.on('authenticate', async () => {
      try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
          console.log('No cookies found for socket authentication');
          socket.emit('auth_error', { message: 'No cookies found' });
          return;
        }
        const token = cookies.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        if (!token) {
          console.log('No token found in cookies');
          socket.emit('auth_error', { message: 'No token provided' });
          return;
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        userId = decoded.id;
        // Track online user
        if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
        onlineUsers.get(userId).add(socket.id);
        // Join personal room
        socket.join(userId.toString());
        console.log(`User ${userId} authenticated and joined their room`);
        // Set user online in DB
        await User.findByIdAndUpdate(userId, { isOnline: true });
        // Emit status to all friends (placeholder: emit to all for now)
        io.emit('user-status', { userId, isOnline: true });
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    socket.on('joinRoom', ({ roomName }) => {
      if (!userId) {
        console.log('User not authenticated, cannot join room');
        return;
      }
      socket.join(roomName);
      console.log(`User ${userId} joined room: ${roomName}`);
      // Track group membership
      if (!groupMembers.has(roomName)) groupMembers.set(roomName, new Set());
      groupMembers.get(roomName).add(userId);
      emitGroupPresence(io, roomName);
    });

    socket.on('leaveRoom', ({ roomName }) => {
      if (!userId) return;
      socket.leave(roomName);
      console.log(`User ${userId} left room: ${roomName}`);
      if (groupMembers.has(roomName)) {
        groupMembers.get(roomName).delete(userId);
        emitGroupPresence(io, roomName);
      }
    });

    // Real-time message handler
    socket.on('send_message', async (data, callback) => {
      try {
        console.log('Received send_message event:', data);
        const { roomName, text, groupId, recipientId } = data;
        
        if (!userId) {
          console.log('User not authenticated for message sending');
          if (callback) callback({ success: false, error: 'User not authenticated' });
          return;
        }
        
        if (!roomName || !text) {
          console.log('Missing required fields for message sending');
          if (callback) callback({ success: false, error: 'Missing roomName or text' });
          return;
        }
        
        // Build message data
        const messageData = {
          sender: userId,
          content: text.trim(),
        };
        
        // Handle group messages
        if (groupId) {
          if (!mongoose.Types.ObjectId.isValid(groupId)) {
            console.log('Invalid group ID format:', groupId);
            if (callback) callback({ success: false, error: 'Invalid group ID format' });
            return;
          }
          messageData.group = groupId;
          console.log('Creating group message for group:', groupId);
        }
        
        // Handle personal messages
        if (recipientId) {
          if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            console.log('Invalid recipient ID format:', recipientId);
            if (callback) callback({ success: false, error: 'Invalid recipient ID format' });
            return;
          }
          messageData.recipient = recipientId;
          console.log('Creating personal message for recipient:', recipientId);
        }
        
        // Infer recipient/group if not provided
        if (!groupId && !recipientId) {
          const ids = roomName.split('_');
          const otherId = ids.find(id => id !== userId);
          if (otherId && mongoose.Types.ObjectId.isValid(otherId)) {
            messageData.recipient = otherId;
            console.log('Inferred recipient from room name:', otherId);
          } else if (roomName && mongoose.Types.ObjectId.isValid(roomName)) {
            messageData.group = roomName;
            console.log('Inferred group from room name:', roomName);
          } else {
            console.log('Could not determine recipient/group from room name:', roomName);
            if (callback) callback({ success: false, error: 'Could not determine recipient/group from room name' });
            return;
          }
        }
        
        // Save message to database
        const message = new Message(messageData);
        await message.save();
        await message.populate('sender', 'name profilePicture');
        // Emit to all clients in the room
        if (messageData.group) {
          // Group chat: emit to all group members
          const group = await Group.findById(messageData.group).populate('members', '_id');
          if (group && group.members) {
            group.members.forEach(member => {
              io.to(member._id.toString()).emit('new-message', message);
            });
          }
        } else if (messageData.recipient) {
          // Personal chat: emit to both users
          io.to(messageData.recipient.toString()).emit('new-message', message);
          io.to(userId.toString()).emit('new-message', message);
        } else {
          io.to(roomName).emit('new-message', message);
        }
        if (callback) callback({ success: true, message });
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('message_read', async (data) => {
      const { messageId } = data;
      try {
        const result = await markMessageAsRead(messageId);
        if (result.success) {
          console.log(`Message ${messageId} marked as read`);
        }
      } catch (error) {
        console.error('Error handling message_read event:', error);
      }
    });

    // Typing indicators
    socket.on('typing', ({ groupId }) => {
      if (!userId || !groupId) return;
      io.to(groupId).emit('group-typing', { groupId, userId, typing: true });
    });
    
    socket.on('stop-typing', ({ groupId }) => {
      if (!userId || !groupId) return;
      io.to(groupId).emit('group-typing', { groupId, userId, typing: false });
    });



    socket.on('speaking-status', async ({ groupId, isSpeaking }) => {
      if (!userId || !groupId) return;
      try {
        // Emit to all group members that user speaking status changed
        io.to(groupId).emit('user-speaking-status', { 
          groupId, 
          userId,
          isSpeaking,
          updatedAt: new Date()
        });
        console.log(`User ${userId} speaking status: ${isSpeaking} in audio room for group ${groupId}`);
      } catch (error) {
        console.error('Error updating speaking status:', error);
      }
    });





    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          // Remove from all group memberships
          for (const [groupId, members] of groupMembers.entries()) {
            if (members.has(userId)) {
              members.delete(userId);
              emitGroupPresence(io, groupId);
            }
          }
          // Set user offline in DB
          await User.findByIdAndUpdate(userId, { isOnline: false });
          // Emit status to all friends (placeholder: emit to all for now)
          io.emit('user-status', { userId, isOnline: false });
        }
      }

    });

    // Placeholder for profile update event
    socket.on('profile-updated', async (profileData) => {
      // Update user profile in DB (implement as needed)
      // await User.findByIdAndUpdate(userId, profileData);
      // Emit to all friends/contacts
      io.emit('user-profile-updated', { userId, ...profileData });
    });

    // Group member added notification
    socket.on('group_member_added', async ({ groupId, newMemberIds, adminName, groupName }) => {
      if (!groupId || !Array.isArray(newMemberIds) || !adminName || !groupName) return;
      newMemberIds.forEach(memberId => {
        io.to(memberId).emit('group-added', { groupId, groupName });
        io.to(memberId).emit('notification', { message: `${adminName} added you to ${groupName}` });
      });
    });
  });
};

export default initializeSocket;
