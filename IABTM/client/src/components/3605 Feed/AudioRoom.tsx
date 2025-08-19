import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAudioRoom } from './AudioRoomStateManager';

interface AudioRoomProps {
  groupId: string;
  roomName: string;
  userId: string;
  userName: string;
  onClose: () => void;
  isHost: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

const AudioRoom: React.FC<AudioRoomProps> = ({
  groupId,
  roomName,
  userId,
  userName,
  onClose,
  isHost
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  const { state, disconnectFromAudioRoom } = useAudioRoom();
  const { connectionState, connectionError, participants, livekitRoom } = state;

  // Handle mute/unmute
  const toggleMute = useCallback(async () => {
    if (!livekitRoom || !livekitRoom.ws) return;

    try {
      const newMutedState = !isMuted;
      
      // Send mute status to server
      livekitRoom.ws.send(JSON.stringify({
        type: 'mute_status',
        isMuted: newMutedState
      }));
      
      setIsMuted(newMutedState);
      
      toast.info(newMutedState ? 'Microphone muted' : 'Microphone unmuted');
    } catch (error) {
      console.error('Error toggling mute:', error);
      toast.error('Failed to toggle microphone');
    }
  }, [livekitRoom, isMuted]);

  // Send chat message
  const sendChatMessage = useCallback(async () => {
    if (!livekitRoom || !livekitRoom.ws || !chatInput.trim()) return;

    try {
      const message = chatInput.trim();
      
      // Send message via WebSocket
      livekitRoom.ws.send(JSON.stringify({
        type: 'chat_message',
        message,
        sender: userName,
        timestamp: Date.now()
      }));
      
      // Add message to local chat
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: userName,
        message,
        timestamp: new Date()
      }]);
      
      setChatInput('');
    } catch (error) {
      console.error('Error sending chat message:', error);
      toast.error('Failed to send message');
    }
  }, [livekitRoom, chatInput, userName]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    try {
      await disconnectFromAudioRoom();
      onClose();
    } catch (error) {
      console.error('Error leaving room:', error);
      onClose();
    }
  }, [disconnectFromAudioRoom, onClose]);

  // Handle connection errors
  if (connectionState === 'error') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">{connectionError || 'Failed to connect to audio room'}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle connecting state
  if (connectionState === 'connecting') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-lg font-medium">Connecting to audio room...</span>
          </div>
        </div>
      </div>
    );
  }

  // Handle disconnected state
  if (connectionState === 'disconnected') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-600 mb-2">Disconnected</h3>
            <p className="text-gray-500 mb-4">You have been disconnected from the audio room</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main audio room interface (connected state)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Audio Room: {roomName}</h2>
            <p className="text-sm text-gray-600">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} • Connected
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isHost && (
              <button
                onClick={leaveRoom}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                End Room
              </button>
            )}
            <button
              onClick={leaveRoom}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Leave Room
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Participants List */}
          <div className="w-1/3 border-r p-4 overflow-y-auto bg-gray-50">
            <h3 className="font-medium mb-3 text-gray-900">Participants</h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    participant.isSpeaking 
                      ? 'bg-blue-100 border border-blue-300' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    {participant.isSpeaking && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">
                      {participant.name}
                      {participant.isLocal && ' (You)'}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      {participant.isMuted ? (
                        <>
                          <span>🔇</span>
                          <span>Muted</span>
                        </>
                      ) : (
                        <>
                          <span>🎤</span>
                          <span>Active</span>
                        </>
                      )}
                      {participant.isSpeaking && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">Speaking</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-white">
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {message.sender.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">{message.sender}</span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{message.message}</p>
                    </div>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all ${
                isMuted 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {isMuted ? 'Microphone Muted' : 'Microphone Active'}
              </p>
              <p className="text-xs text-gray-600">
                Click to {isMuted ? 'unmute' : 'mute'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRoom; 