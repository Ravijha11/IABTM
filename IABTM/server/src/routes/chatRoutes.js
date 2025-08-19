import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  createPersonalChat,
  getPersonalChats,
  getPersonalChatMessages
} from '../controllers/chatController.js';

const router = express.Router();

// Personal chat routes
router.post('/create-personal', authenticate, createPersonalChat);
router.get('/personal', authenticate, getPersonalChats);
router.get('/personal/:chatId/messages', authenticate, getPersonalChatMessages);

export default router; 