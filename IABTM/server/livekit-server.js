import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store active rooms and participants
const rooms = new Map();

console.log('🎤 Starting Custom LiveKit Server on port 7880...');

wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection:', req.url);
  
  // Parse room name and token from URL
  const url = new URL(req.url || '', 'http://localhost');
  const roomName = url.searchParams.get('room');
  const accessToken = url.searchParams.get('access_token');
  
  if (!roomName) {
    console.error('❌ No room name provided');
    ws.close(1008, 'Room name required');
    return;
  }
  
  if (!accessToken) {
    console.error('❌ No access token provided');
    ws.close(1008, 'Access token required');
    return;
  }
  
  console.log(`🎯 User connecting to room: ${roomName}`);
  
  // Parse token to get user information
  let tokenData;
  let participantId;
  let userId;
  let groupId;
  let isHost;
  
  try {
    const tokenString = Buffer.from(accessToken, 'base64').toString();
    tokenData = JSON.parse(tokenString);
    
    // Validate token expiry
    if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
      console.error('❌ Token expired');
      ws.close(1008, 'Token expired');
      return;
    }
    
    participantId = tokenData.userId || `user_${Date.now()}`;
    userId = tokenData.userId;
    groupId = tokenData.groupId;
    isHost = tokenData.isHost || false;
    
    console.log(`👤 Token parsed - User: ${userId}, Group: ${groupId}, Host: ${isHost}`);
  } catch (error) {
    console.error('❌ Invalid token format:', error);
    ws.close(1008, 'Invalid token format');
    return;
  }
  
  // Initialize room if it doesn't exist
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      participants: new Map(),
      messages: [],
      groupId: groupId,
      createdAt: new Date(),
      hostId: isHost ? userId : null
    });
    console.log(`🏠 Created new room: ${roomName} for group: ${groupId}`);
  }
  
  const room = rooms.get(roomName);
  
  // Check if room is full
  if (room.participants.size >= 20) {
    console.error('❌ Room is full');
    ws.close(1008, 'Room is full');
    return;
  }
  
  // Check if user is already in the room
  if (room.participants.has(participantId)) {
    console.log(`👤 User ${participantId} already in room, updating connection`);
    const existingParticipant = room.participants.get(participantId);
    existingParticipant.ws = ws;
    existingParticipant.lastSeen = new Date();
  } else {
    // Add new participant to room
    room.participants.set(participantId, {
      ws,
      id: participantId,
      userId: userId,
      name: `User ${participantId.slice(0, 6)}`,
      isMuted: false,
      isSpeaking: false,
      isHost: isHost,
      joinedAt: new Date(),
      lastSeen: new Date()
    });
    
    console.log(`👤 Participant ${participantId} joined room ${roomName}`);
  }
  
  // Send welcome message with current participants
  const welcomeMessage = {
    type: 'welcome',
    roomName,
    participantId,
    participants: Array.from(room.participants.keys()),
    isHost: isHost,
    groupId: groupId
  };
  
  ws.send(JSON.stringify(welcomeMessage));
  
  // Notify other participants about the new user
  room.participants.forEach((participant, id) => {
    if (id !== participantId && participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(JSON.stringify({
        type: 'participant_joined',
        participantId,
        participantName: `User ${participantId.slice(0, 6)}`,
        isHost: isHost
      }));
    }
  });
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Message from ${participantId}:`, message.type);
      
      const participant = room.participants.get(participantId);
      if (!participant) {
        console.error('❌ Participant not found in room');
        return;
      }
      
      switch (message.type) {
        case 'mute_status':
          participant.isMuted = message.isMuted;
          participant.lastSeen = new Date();
          
          // Broadcast mute status to other participants
          room.participants.forEach((p, id) => {
            if (id !== participantId && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({
                type: 'mute_status',
                participantId,
                isMuted: message.isMuted
              }));
            }
          });
          break;
          
        case 'speaking_status':
          participant.isSpeaking = message.isSpeaking;
          participant.lastSeen = new Date();
          
          // Broadcast speaking status to other participants
          room.participants.forEach((p, id) => {
            if (id !== participantId && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({
                type: 'speaking_status',
                participantId,
                isSpeaking: message.isSpeaking
              }));
            }
          });
          break;
          
        case 'chat_message':
          // Store message in room history
          const chatMessage = {
            id: Date.now().toString(),
            sender: participantId,
            senderName: participant.name,
            message: message.message,
            timestamp: new Date()
          };
          
          room.messages.push(chatMessage);
          
          // Keep only last 100 messages
          if (room.messages.length > 100) {
            room.messages = room.messages.slice(-100);
          }
          
          // Broadcast chat message to all participants
          room.participants.forEach((p) => {
            if (p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(JSON.stringify({
                type: 'chat_message',
                sender: participantId,
                senderName: participant.name,
                message: message.message,
                timestamp: Date.now()
              }));
            }
          });
          break;
          
        case 'ping':
          // Respond to ping with pong
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          participant.lastSeen = new Date();
          break;
          
        default:
          console.log('❓ Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log(`👤 Participant ${participantId} left room ${roomName} (code: ${code}, reason: ${reason})`);
    
    // Remove participant from room
    room.participants.delete(participantId);
    
    // Notify other participants
    room.participants.forEach((participant) => {
      if (participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(JSON.stringify({
          type: 'participant_left',
          participantId,
          reason: reason || 'Disconnected'
        }));
      }
    });
    
    // Clean up empty rooms
    if (room.participants.size === 0) {
      rooms.delete(roomName);
      console.log(`🏠 Deleted empty room: ${roomName}`);
    } else {
      console.log(`👥 Room ${roomName} now has ${room.participants.size} participants`);
    }
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${participantId}:`, error);
  });
});

// Periodic cleanup of inactive participants
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  rooms.forEach((room, roomName) => {
    room.participants.forEach((participant, participantId) => {
      if (now - participant.lastSeen.getTime() > timeout) {
        console.log(`⏰ Removing inactive participant ${participantId} from room ${roomName}`);
        participant.ws.close(1000, 'Inactive timeout');
        room.participants.delete(participantId);
      }
    });
    
    // Clean up empty rooms
    if (room.participants.size === 0) {
      rooms.delete(roomName);
      console.log(`🏠 Cleaned up empty room: ${roomName}`);
    }
  });
}, 30000); // Check every 30 seconds

// Start server
const PORT = 7880;
server.listen(PORT, () => {
  console.log(`✅ Custom LiveKit Server running on port ${PORT}`);
  console.log(`🌐 WebSocket URL: ws://localhost:${PORT}`);
  console.log(`📊 Active rooms: ${rooms.size}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down LiveKit server...');
  
  // Close all WebSocket connections
  rooms.forEach((room) => {
    room.participants.forEach((participant) => {
      if (participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.close(1000, 'Server shutdown');
      }
    });
  });
  
  wss.close(() => {
    server.close(() => {
      console.log('✅ LiveKit server stopped');
      process.exit(0);
    });
  });
}); 