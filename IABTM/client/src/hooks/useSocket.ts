import { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import getSocket, { disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/storage/authStore';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (data: any) => Promise<boolean>;
  joinRoom: (roomName: string) => void;
  leaveRoom: (roomName: string) => void;
}

export const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id) {
      console.log('❌ No user authenticated, skipping socket connection');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const socket = getSocket();
      socketRef.current = socket;

      // Connection status handlers
      const handleConnect = () => {
        console.log('🔌 Socket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      };

      const handleDisconnect = (reason: string) => {
        console.log('🔌 Socket disconnected:', reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        if (reason === 'io server disconnect') {
          setError('Server disconnected. Reconnecting...');
        }
      };

      const handleConnectError = (err: Error) => {
        console.error('🔌 Socket connection error:', err);
        setIsConnected(false);
        setIsConnecting(false);
        setError('Connection failed. Please check your internet connection.');
      };

      const handleAuthError = (data: any) => {
        console.error('🔌 Socket authentication error:', data);
        setError('Authentication failed. Please log in again.');
      };

      // Attach event listeners
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleConnectError);
      socket.on('auth_error', handleAuthError);

      // Cleanup function
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connect_error', handleConnectError);
        socket.off('auth_error', handleAuthError);
      };
    } catch (err) {
      console.error('❌ Error initializing socket:', err);
      setIsConnecting(false);
      setError('Failed to initialize connection');
    }
  }, [user?._id]);

  // Send message function
  const sendMessage = useCallback(async (data: any): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !isConnected) {
        console.error('❌ Socket not connected');
        resolve(false);
        return;
      }

      console.log('📤 Sending message via socket:', data);
      
      socketRef.current.emit('send_message', data, (response: any) => {
        if (response?.success) {
          console.log('✅ Message sent successfully');
          resolve(true);
        } else {
          console.error('❌ Failed to send message:', response?.error);
          resolve(false);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        console.error('❌ Message send timeout');
        resolve(false);
      }, 10000);
    });
  }, [isConnected]);

  // Join room function
  const joinRoom = useCallback((roomName: string) => {
    if (!socketRef.current || !isConnected) {
      console.error('❌ Socket not connected, cannot join room');
      return;
    }

    console.log('🚪 Joining room:', roomName);
    socketRef.current.emit('joinRoom', { roomName });
  }, [isConnected]);

  // Leave room function
  const leaveRoom = useCallback((roomName: string) => {
    if (!socketRef.current || !isConnected) {
      console.error('❌ Socket not connected, cannot leave room');
      return;
    }

    console.log('🚪 Leaving room:', roomName);
    socketRef.current.emit('leaveRoom', { roomName });
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    sendMessage,
    joinRoom,
    leaveRoom,
  };
}; 