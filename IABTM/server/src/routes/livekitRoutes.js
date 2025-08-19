import express from 'express';
import { 
  generateToken, 
  validateToken, 
  getRoomInfo, 
  healthCheck 
} from '../controllers/livekitController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Health check endpoint (no auth required)
router.get('/health', healthCheck);

// Generate LiveKit token (requires authentication)
router.post('/token', authenticate, generateToken);

// Validate token (no auth required)
router.post('/validate-token', validateToken);

// Get room information (requires authentication)
router.get('/room/:roomName', authenticate, getRoomInfo);

export default router; 