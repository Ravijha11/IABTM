import { AccessToken } from 'livekit-server-sdk';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

// LiveKit configuration
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'devsecret';

/**
 * Generate LiveKit access token for a user to join an audio room
 */
export const generateToken = async (req, res) => {
  try {
    const { roomName, participantIdentity, participantName } = req.body;

    // Validate required fields
    if (!roomName || !participantIdentity) {
      throw new ApiError(400, 'Room name and participant identity are required');
    }

    // Create a new AccessToken
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName || participantIdentity,
      // Token expires in 5 minutes
      ttl: '5m',
    });

    // Grant permissions to the user
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true, // Allow text chat
    });

    // Sign and return the token
    const token = at.toJwt();

    return res.status(200).json(
      new ApiResponse(200, { token, roomName, participantIdentity }, 'Token generated successfully')
    );
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return res.status(error.statusCode || 500).json(
      new ApiError(error.statusCode || 500, error.message || 'Failed to generate token')
    );
  }
};

/**
 * Validate LiveKit token
 */
export const validateToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ApiError(400, 'Token is required');
    }

    // Verify the token
    const decoded = AccessToken.verify(token, LIVEKIT_API_SECRET);
    
    return res.status(200).json(
      new ApiResponse(200, { 
        valid: true, 
        identity: decoded.identity,
        room: decoded.grants?.room,
        expiresAt: decoded.exp 
      }, 'Token is valid')
    );
  } catch (error) {
    return res.status(200).json(
      new ApiResponse(200, { valid: false, error: error.message }, 'Token is invalid')
    );
  }
};

/**
 * Get room information
 */
export const getRoomInfo = async (req, res) => {
  try {
    const { roomName } = req.params;

    if (!roomName) {
      throw new ApiError(400, 'Room name is required');
    }

    // This would typically connect to LiveKit server to get room info
    // For now, return basic info
    return res.status(200).json(
      new ApiResponse(200, { 
        roomName,
        exists: true,
        participantCount: 0 // This would be fetched from LiveKit server
      }, 'Room information retrieved')
    );
  } catch (error) {
    console.error('Error getting room info:', error);
    return res.status(error.statusCode || 500).json(
      new ApiError(error.statusCode || 500, error.message || 'Failed to get room info')
    );
  }
};

/**
 * Health check for LiveKit integration
 */
export const healthCheck = async (req, res) => {
  try {
    return res.status(200).json(
      new ApiResponse(200, {
        status: 'healthy',
        livekit: {
          apiKey: LIVEKIT_API_KEY ? 'configured' : 'not configured',
          apiSecret: LIVEKIT_API_SECRET ? 'configured' : 'not configured'
        },
        timestamp: new Date().toISOString()
      }, 'LiveKit integration is healthy')
    );
  } catch (error) {
    console.error('LiveKit health check error:', error);
    return res.status(500).json(
      new ApiError(500, 'LiveKit integration health check failed')
    );
  }
}; 