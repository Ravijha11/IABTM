import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AudioRoom from './AudioRoom';
import { useAudioRoom } from './AudioRoomStateManager';

interface AudioRoomButtonProps {
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  isHost: boolean;
}

const AudioRoomButton: React.FC<AudioRoomButtonProps> = ({
  groupId,
  groupName,
  userId,
  userName,
  isHost
}) => {
  const [showAudioRoom, setShowAudioRoom] = useState(false);
  const { 
    state, 
    fetchAudioRoomStatus, 
    connectToAudioRoom, 
    startAudioRoom, 
    joinAudioRoom,
    canUserStartRoom,
    canUserJoinRoom
  } = useAudioRoom();

  // Fetch audio room status on mount and when group changes
  useEffect(() => {
    fetchAudioRoomStatus(groupId);
  }, [groupId, fetchAudioRoomStatus]);

  // Check if user can start room (any group member can start if room is not active)
  const canStart = canUserStartRoom(groupId, userId);
  
  // Check if user can join room (any group member can join if room is active)
  const canJoin = canUserJoinRoom(groupId, userId);

  // Handle start/join audio room (unified function)
  const handleConnectToAudioRoom = async () => {
    try {
      if (state.isAudioRoomActive) {
        // Room is active, try to join
        await joinAudioRoom(groupId);
      } else {
        // Room is not active, start new room
        await startAudioRoom(groupId);
      }
      setShowAudioRoom(true);
    } catch (error) {
      console.error('Failed to connect to audio room:', error);
      // Error handling is done in the state manager
    }
  };

  // Handle audio room close
  const handleAudioRoomClose = () => {
    setShowAudioRoom(false);
    // Refresh status after closing
    fetchAudioRoomStatus(groupId);
  };

  // Get button text based on current state
  const getButtonText = () => {
    if (state.connectionState === 'connecting') {
      return 'Connecting...';
    } else if (state.connectionState === 'connected') {
      return 'In Voice Chat';
    } else if (state.isAudioRoomActive) {
      return 'Join Voice Chat';
    } else {
      return 'Start Voice Chat';
    }
  };

  // Get button icon based on current state
  const getButtonIcon = () => {
    if (state.connectionState === 'connecting') {
      return '🔄';
    } else if (state.connectionState === 'connected') {
      return '🎤';
    } else if (state.isAudioRoomActive) {
      return '🎧';
    } else {
      return '🎤';
    }
  };

  // Get button color based on current state
  const getButtonColor = () => {
    if (state.connectionState === 'connecting') {
      return 'bg-gray-400 hover:bg-gray-500';
    } else if (state.connectionState === 'connected') {
      return 'bg-green-600 hover:bg-green-700';
    } else if (state.connectionState === 'error') {
      return 'bg-red-600 hover:bg-red-700';
    } else if (state.isAudioRoomActive) {
      return 'bg-blue-600 hover:bg-blue-700';
    } else {
      return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  // Get status text
  const getStatusText = () => {
    if (state.connectionState === 'connected') {
      return `${state.participantCount} participant${state.participantCount !== 1 ? 's' : ''} in voice chat`;
    } else if (state.isAudioRoomActive) {
      return `${state.participantCount} participant${state.participantCount !== 1 ? 's' : ''} in voice chat - Click to join!`;
    } else {
      return 'Voice chat available for this group - Click to start!';
    }
  };

  // Don't render if audio room is not enabled for this group
  // This should be checked by the parent component, but adding safety check
  return (
    <>
      <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex-1">
          <h4 className="font-medium text-blue-900">Audio Room</h4>
          <p className="text-sm text-blue-700">
            {getStatusText()}
          </p>
          {/* Show additional info for active rooms */}
          {state.isAudioRoomActive && !state.isConnected && (
            <p className="text-xs text-blue-600 mt-1">
              💡 Any group member can join the active voice chat
            </p>
          )}
          {!state.isAudioRoomActive && (
            <p className="text-xs text-blue-600 mt-1">
              💡 Any group member can start a voice chat
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {state.connectionState === 'connecting' ? (
            <button
              disabled
              className="px-4 py-2 bg-gray-400 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Connecting...</span>
            </button>
          ) : state.connectionState === 'connected' ? (
            <button
              onClick={() => setShowAudioRoom(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <span>🎤</span>
              <span>In Voice Chat</span>
            </button>
          ) : state.connectionState === 'error' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleConnectToAudioRoom}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Retry</span>
              </button>
              <div className="text-xs text-red-600 max-w-32 truncate" title={state.connectionError || ''}>
                {state.connectionError}
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnectToAudioRoom}
              disabled={!canStart && !canJoin}
              className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${getButtonColor()}`}
            >
              <span>{getButtonIcon()}</span>
              <span>{getButtonText()}</span>
            </button>
          )}
        </div>
      </div>

      {showAudioRoom && state.roomName && (
        <AudioRoom
          groupId={groupId}
          roomName={state.roomName}
          userId={userId}
          userName={userName}
          onClose={handleAudioRoomClose}
          isHost={isHost}
        />
      )}
    </>
  );
};

export default AudioRoomButton; 