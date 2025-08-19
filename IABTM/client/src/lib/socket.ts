import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000', {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Enhanced error handling and reconnection
    socket.on('connect', () => {
      console.log('🔌 Socket connected successfully');
      reconnectAttempts = 0;
      
      // Authenticate immediately after connection
      socket?.emit('authenticate');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        socket?.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      reconnectAttempts++;
      
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.error('🔌 Max reconnection attempts reached');
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
      // Re-authenticate after reconnection
      socket?.emit('authenticate');
    });

    socket.on('auth_error', (error) => {
      console.error('🔌 Socket authentication error:', error);
    });

    socket.on('authenticated', (data) => {
      console.log('🔌 Socket authenticated successfully:', data);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket; 