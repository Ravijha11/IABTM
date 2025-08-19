// Mediasoup Socket.IO Connection Handler
// This file handles WebRTC signaling for mediasoup

export default function mediaSoupSocketConnection(io) {
  const mediasoupNamespace = io.of('/mediasoup');

  mediasoupNamespace.on('connection', (socket) => {
    console.log(`🔌 Mediasoup socket connected: ${socket.id}`);

    // Handle room joining
    socket.on('join-room', (data) => {
      const { roomId, userId } = data;
      socket.join(roomId);
      console.log(`👤 User ${userId} joined mediasoup room: ${roomId}`);
      
      // Notify other users in the room
      socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
    });

    // Handle room leaving
    socket.on('leave-room', (data) => {
      const { roomId, userId } = data;
      socket.leave(roomId);
      console.log(`👤 User ${userId} left mediasoup room: ${roomId}`);
      
      // Notify other users in the room
      socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
    });

    // Handle WebRTC signaling
    socket.on('webrtc-signal', (data) => {
      const { roomId, targetUserId, signal } = data;
      console.log(`📡 WebRTC signal from ${socket.id} to ${targetUserId} in room ${roomId}`);
      
      // Forward the signal to the target user
      socket.to(roomId).emit('webrtc-signal', {
        fromUserId: socket.id,
        signal
      });
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (data) => {
      const { roomId, candidate } = data;
      console.log(`🧊 ICE candidate from ${socket.id} in room ${roomId}`);
      
      // Forward ICE candidate to other users in the room
      socket.to(roomId).emit('ice-candidate', {
        fromUserId: socket.id,
        candidate
      });
    });

    // Handle media stream requests
    socket.on('request-media-stream', (data) => {
      const { roomId, targetUserId, mediaType } = data;
      console.log(`🎥 Media stream request from ${socket.id} to ${targetUserId} for ${mediaType}`);
      
      // Forward the request to the target user
      socket.to(roomId).emit('request-media-stream', {
        fromUserId: socket.id,
        mediaType
      });
    });

    // Handle media stream responses
    socket.on('media-stream-response', (data) => {
      const { roomId, targetUserId, streamId, mediaType } = data;
      console.log(`📹 Media stream response from ${socket.id} to ${targetUserId} for ${mediaType}`);
      
      // Forward the response to the target user
      socket.to(roomId).emit('media-stream-response', {
        fromUserId: socket.id,
        streamId,
        mediaType
      });
    });

    // Handle connection quality updates
    socket.on('connection-quality', (data) => {
      const { roomId, quality } = data;
      console.log(`📊 Connection quality update from ${socket.id}: ${quality}`);
      
      // Broadcast quality update to room
      socket.to(roomId).emit('connection-quality-update', {
        userId: socket.id,
        quality
      });
    });

    // Handle room information requests
    socket.on('get-room-info', (data) => {
      const { roomId } = data;
      const room = mediasoupNamespace.adapter.rooms.get(roomId);
      
      if (room) {
        const participants = Array.from(room).map(socketId => ({
          socketId,
          connected: mediasoupNamespace.sockets.has(socketId)
        }));
        
        socket.emit('room-info', {
          roomId,
          participants,
          participantCount: participants.length
        });
      }
    });

    // Handle ping/pong for connection monitoring
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Mediasoup socket disconnected: ${socket.id}, reason: ${reason}`);
      
      // Get all rooms this socket was in
      const rooms = Array.from(socket.rooms);
      
      // Notify all rooms about the disconnection
      rooms.forEach(roomId => {
        if (roomId !== socket.id) { // socket.id is always in rooms, skip it
          socket.to(roomId).emit('user-disconnected', {
            socketId: socket.id,
            reason
          });
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Mediasoup socket error for ${socket.id}:`, error);
    });
  });

  console.log('✅ Mediasoup socket connection handler initialized');
  
  return mediasoupNamespace;
} 