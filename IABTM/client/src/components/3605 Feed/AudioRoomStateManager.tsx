import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

// Types
interface AudioRoomState {
  currentGroupId: string | null;
  isAudioRoomActive: boolean;
  roomName: string | null;
  hostId: string | null;
  participantCount: number;
  isConnected: boolean;
  isHost: boolean;
  isLoading: boolean;
  // Enhanced state management
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectionError: string | null;
  livekitRoom: any | null;
  participants: Array<{
    id: string;
    name: string;
    isMuted: boolean;
    isSpeaking: boolean;
    isLocal: boolean;
  }>;
  // New fields for better state management
  canStartRoom: boolean;
  canJoinRoom: boolean;
  roomStatus: 'inactive' | 'active' | 'starting' | 'ending';
}

interface AudioRoomAction {
  type: 'SET_GROUP' | 'SET_STATUS' | 'SET_CONNECTED' | 'SET_LOADING' | 'SET_CONNECTION_STATE' | 'SET_CONNECTION_ERROR' | 'SET_LIVEKIT_ROOM' | 'SET_PARTICIPANTS' | 'ADD_PARTICIPANT' | 'REMOVE_PARTICIPANT' | 'UPDATE_PARTICIPANT' | 'SET_ROOM_PERMISSIONS' | 'SET_ROOM_STATUS' | 'RESET';
  payload?: any;
}

// Initial state
const initialState: AudioRoomState = {
  currentGroupId: null,
  isAudioRoomActive: false,
  roomName: null,
  hostId: null,
  participantCount: 0,
  isConnected: false,
  isHost: false,
  isLoading: false,
  // Enhanced state management
  connectionState: 'disconnected',
  connectionError: null,
  livekitRoom: null,
  participants: [],
  // New fields
  canStartRoom: false,
  canJoinRoom: false,
  roomStatus: 'inactive'
};

// Reducer
function audioRoomReducer(state: AudioRoomState, action: AudioRoomAction): AudioRoomState {
  switch (action.type) {
    case 'SET_GROUP':
      return {
        ...state,
        currentGroupId: action.payload.groupId,
        isHost: action.payload.isHost,
      };
    case 'SET_STATUS':
      return {
        ...state,
        isAudioRoomActive: action.payload.isActive,
        roomName: action.payload.roomName,
        hostId: action.payload.hostId,
        participants: action.payload.participants || [],
        participantCount: action.payload.participants?.length || 0,
        roomStatus: action.payload.isActive ? 'active' : 'inactive',
        // Update permissions based on room status
        canStartRoom: !action.payload.isActive,
        canJoinRoom: action.payload.isActive && !state.isConnected,
      };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
        canJoinRoom: state.isAudioRoomActive && !action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_CONNECTION_STATE':
      return {
        ...state,
        connectionState: action.payload,
      };
    case 'SET_CONNECTION_ERROR':
      return {
        ...state,
        connectionError: action.payload,
      };
    case 'SET_LIVEKIT_ROOM':
      return {
        ...state,
        livekitRoom: action.payload,
      };
    case 'SET_PARTICIPANTS':
      return {
        ...state,
        participants: action.payload,
        participantCount: action.payload.length,
      };
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        participants: [...state.participants, action.payload],
        participantCount: state.participantCount + 1,
      };
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(p => p.id !== action.payload),
        participantCount: Math.max(0, state.participantCount - 1),
      };
    case 'UPDATE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
    case 'SET_ROOM_PERMISSIONS':
      return {
        ...state,
        canStartRoom: action.payload.canStartRoom,
        canJoinRoom: action.payload.canJoinRoom,
      };
    case 'SET_ROOM_STATUS':
      return {
        ...state,
        roomStatus: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Context
const AudioRoomContext = createContext<{
  state: AudioRoomState;
  dispatch: React.Dispatch<AudioRoomAction>;
  fetchAudioRoomStatus: (groupId: string) => Promise<void>;
  connectToAudioRoom: (groupId: string) => Promise<void>;
  disconnectFromAudioRoom: () => Promise<void>;
  startAudioRoom: (groupId: string) => Promise<void>;
  joinAudioRoom: (groupId: string) => Promise<void>;
  leaveAudioRoom: (groupId: string) => Promise<void>;
  canUserStartRoom: (groupId: string, userId: string) => boolean;
  canUserJoinRoom: (groupId: string, userId: string) => boolean;
} | null>(null);

// Provider component
export const AudioRoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(audioRoomReducer, initialState);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 3;
  const reconnectAttemptsRef = useRef(0);

  // Fetch audio room status
  const fetchAudioRoomStatus = async (groupId: string) => {
    try {
      console.log('🔍 [FRONTEND] Fetching audio room status for group:', groupId);
      
      const response = await fetch(`/api/group/${groupId}/audio-room/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [FRONTEND] Audio room status received:', data.data);
        
        dispatch({
          type: 'SET_STATUS',
          payload: {
            isActive: data.data.isActive,
            roomName: data.data.roomName,
            hostId: data.data.hostId,
            participants: data.data.participants || [],
          },
        });

        // Update room permissions
        dispatch({
          type: 'SET_ROOM_PERMISSIONS',
          payload: {
            canStartRoom: !data.data.isActive,
            canJoinRoom: data.data.isActive && !state.isConnected,
          },
        });
      } else {
        console.error('❌ [FRONTEND] Failed to fetch audio room status:', response.status);
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching audio room status:', error);
    }
  };

  // Check if user can start room (any group member can start if room is not active)
  const canUserStartRoom = (groupId: string, userId: string): boolean => {
    return !state.isAudioRoomActive && state.currentGroupId === groupId;
  };

  // Check if user can join room (any group member can join if room is active)
  const canUserJoinRoom = (groupId: string, userId: string): boolean => {
    return state.isAudioRoomActive && !state.isConnected && state.currentGroupId === groupId;
  };

  // Enhanced WebSocket connection with reconnection logic
  const createWebSocketConnection = (roomName: string, token: string, groupId: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      console.log('🔌 [FRONTEND] Creating WebSocket connection to:', `ws://localhost:7880/rtc?room=${roomName}&access_token=${token}`);
      
      const ws = new WebSocket(`ws://localhost:7880/rtc?room=${roomName}&access_token=${token}`);
      
      const connectionTimeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        console.log('🔌 [FRONTEND] WebSocket connected successfully');
        clearTimeout(connectionTimeout);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        resolve(ws);
      };

      ws.onerror = (error) => {
        console.error('❌ [FRONTEND] WebSocket connection error:', error);
        clearTimeout(connectionTimeout);
        reject(new Error('WebSocket connection failed'));
      };

      ws.onclose = (event) => {
        console.log('🔌 [FRONTEND] WebSocket closed:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        
        // Only attempt reconnection if it wasn't a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(`🔄 [FRONTEND] Attempting reconnection ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts}`);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(async () => {
            try {
              await connectToAudioRoom(groupId);
            } catch (error) {
              console.error('❌ [FRONTEND] Reconnection failed:', error);
              dispatch({ type: 'SET_CONNECTION_STATE', payload: 'error' });
              dispatch({ type: 'SET_CONNECTION_ERROR', payload: 'Reconnection failed' });
            }
          }, 2000 * reconnectAttemptsRef.current); // Exponential backoff
        }
      };
    });
  };

  // Unified connectToAudioRoom function with enhanced error handling
  const connectToAudioRoom = async (groupId: string) => {
    try {
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'connecting' });
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: null });
      dispatch({ type: 'SET_ROOM_STATUS', payload: 'starting' });

      console.log('🔌 [FRONTEND] Connecting to audio room for group:', groupId);

      // 1. Fetch the token from the backend endpoint
      const response = await fetch(`/api/group/${groupId}/audio-room/token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get an access token.');
      }

      const { data } = await response.json();
      const { token, roomName, hostId, participants, isHost } = data;

      console.log('✅ [FRONTEND] Token received for room:', roomName);

      // 2. Create WebSocket connection with enhanced error handling
      const ws = await createWebSocketConnection(roomName, token, groupId);
      
      // Set up message handlers
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [FRONTEND] Received message:', data.type);
          
          switch (data.type) {
            case 'welcome':
              // Add other participants
              const otherParticipants = data.participants
                .filter((id: string) => id !== groupId)
                .map((id: string) => ({
                  id,
                  name: `User ${id.slice(0, 6)}`,
                  isMuted: false,
                  isSpeaking: false,
                  isLocal: false
                }));
              dispatch({ type: 'SET_PARTICIPANTS', payload: otherParticipants });
              break;
              
            case 'participant_joined':
              dispatch({
                type: 'ADD_PARTICIPANT',
                payload: {
                  id: data.participantId,
                  name: `User ${data.participantId.slice(0, 6)}`,
                  isMuted: false,
                  isSpeaking: false,
                  isLocal: false
                }
              });
              toast.info(`User ${data.participantId.slice(0, 6)} joined the room`);
              break;
              
            case 'participant_left':
              dispatch({ type: 'REMOVE_PARTICIPANT', payload: data.participantId });
              toast.info(`User ${data.participantId.slice(0, 6)} left the room`);
              break;
              
            case 'mute_status':
              dispatch({
                type: 'UPDATE_PARTICIPANT',
                payload: {
                  id: data.participantId,
                  updates: { isMuted: data.isMuted }
                }
              });
              break;
              
            case 'speaking_status':
              dispatch({
                type: 'UPDATE_PARTICIPANT',
                payload: {
                  id: data.participantId,
                  updates: { isSpeaking: data.isSpeaking }
                }
              });
              break;
              
            default:
              console.log('❓ [FRONTEND] Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ [FRONTEND] Error parsing message:', error);
        }
      };

      // Add local participant
      dispatch({
        type: 'ADD_PARTICIPANT',
        payload: {
          id: groupId,
          name: `User ${groupId.slice(0, 6)}`,
          isMuted: false,
          isSpeaking: false,
          isLocal: true
        }
      });
      
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'connected' });
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_ROOM_STATUS', payload: 'active' });
      
      // Store WebSocket reference for later use
      dispatch({ type: 'SET_LIVEKIT_ROOM', payload: { ws, roomName } });
      
      console.log('✅ [FRONTEND] Successfully connected to audio room:', roomName);
      toast.success('Connected to audio room!');

    } catch (error: any) {
      console.error('❌ [FRONTEND] Failed to connect to audio room:', error);
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'error' });
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: error.message });
      dispatch({ type: 'SET_ROOM_STATUS', payload: 'inactive' });
      toast.error(`Failed to connect: ${error.message}`);
      throw error;
    }
  };

  // Disconnect from audio room
  const disconnectFromAudioRoom = async () => {
    try {
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (state.livekitRoom && state.livekitRoom.ws) {
        state.livekitRoom.ws.close(1000, 'User disconnected'); // Normal closure
      }
      
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'disconnected' });
      dispatch({ type: 'SET_LIVEKIT_ROOM', payload: null });
      dispatch({ type: 'SET_PARTICIPANTS', payload: [] });
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_ROOM_STATUS', payload: 'inactive' });
      
      toast.success('Disconnected from audio room');
    } catch (error) {
      console.error('Error disconnecting from audio room:', error);
    }
  };

  // Start audio room (any member can start if room is not active)
  const startAudioRoom = async (groupId: string) => {
    try {
      // First check if room is already active
      await fetchAudioRoomStatus(groupId);
      
      if (state.isAudioRoomActive) {
        toast.info('Audio room is already active. Joining existing room...');
        return connectToAudioRoom(groupId);
      }
      
      // Start new room
      console.log('🎤 [FRONTEND] Starting new audio room for group:', groupId);
      return connectToAudioRoom(groupId);
    } catch (error) {
      console.error('Failed to start audio room:', error);
      throw error;
    }
  };

  // Join audio room (any member can join if room is active)
  const joinAudioRoom = async (groupId: string) => {
    try {
      // First check room status
      await fetchAudioRoomStatus(groupId);
      
      if (!state.isAudioRoomActive) {
        toast.info('No active audio room. Starting new room...');
        return startAudioRoom(groupId);
      }
      
      console.log('🎤 [FRONTEND] Joining existing audio room for group:', groupId);
      return connectToAudioRoom(groupId);
    } catch (error) {
      console.error('Failed to join audio room:', error);
      throw error;
    }
  };

  // Leave audio room
  const leaveAudioRoom = async (groupId: string) => {
    try {
      const response = await fetch(`/api/group/${groupId}/audio-room/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        await disconnectFromAudioRoom();
        toast.success('Left audio room');
      }
    } catch (error) {
      console.error('Error leaving audio room:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AudioRoomContext.Provider
      value={{
        state,
        dispatch,
        fetchAudioRoomStatus,
        connectToAudioRoom,
        disconnectFromAudioRoom,
        startAudioRoom,
        joinAudioRoom,
        leaveAudioRoom,
        canUserStartRoom,
        canUserJoinRoom,
      }}
    >
      {children}
    </AudioRoomContext.Provider>
  );
};

// Hook to use the audio room context
export const useAudioRoom = () => {
  const context = useContext(AudioRoomContext);
  if (!context) {
    throw new Error('useAudioRoom must be used within an AudioRoomProvider');
  }
  return context;
}; 