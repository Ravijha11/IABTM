import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import session from 'express-session';
import cookieParser from "cookie-parser";
import http from 'http';
import mongoose from 'mongoose';
import authRoutes from "./src/routes/userRoute.js";
import attributeRoutes from './src/routes/attributeRoute.js';
import expertroutes from './src/routes/expertRoute.js';
import shopRoutes from './src/routes/shopRoute.js';
import orderRoutes from './src/routes/orderRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import notificationRoutes from './src/routes/notificationRoute.js';
import articleRoutes from './src/routes/articleRoutes.js';
import friendRoutes from './src/routes/friendRoutes.js'
import initializeSocket from './src/helpers/socketConnection.js';
import RealtimeService from './src/services/realtimeService.js';
import { Server } from 'socket.io';
import commentRoutes from './src/routes/commentRoutes.js'
import superAdminRoutes from './src/routes/superAdminRoutes.js'
import musicMediaRoutes from './src/routes/musicMediaRoutes.js'
import filmMediaRoutes from './src/routes/filmMediaRoutes.js'
import artMediaRoutes from './src/routes/artMediaRoutes.js'
import artistRoutes from './src/routes/artistRoutes.js'
import postRoutes from './src/routes/postRoutes.js'
import messageRoutes from './src/routes/messageRoutes.js'
import paymentRoutes from './src/routes/paymentRoutes.js'
import curatedPathRoutes from './src/routes/curatedPathRoute.js'
import playlistRoutes from './src/routes/playlistRoutes.js'
import musicRoutes from './src/routes/musicRoutes.js'
import contactRoutes from './src/routes/contactRoutes.js'
import { getSignedUrl } from "./src/controllers/cloudinaryController.js";
import bodyParser from "body-parser";
import { handlePaymentWebhook } from "./src/controllers/paymentController.js";
import groupRoutes from './src/routes/groupRoutes.js'
import chatRoutes from './src/routes/chatRoutes.js'
import livekitRoutes from './src/routes/livekitRoutes.js'

import mediaRoutes from './src/routes/mediaRoutes.js'
import uploadRoutes from './src/routes/uploadRoutes.js'

import mediaSoupSocketConnection from './src/mediasoup/socketConnection.js'
import { injectSocketIO } from './src/middlewares/socketMiddleware.js'

const app = express();
const server = http.createServer(app);

// Optimized Socket.IO configuration for 10,000+ concurrent users
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:3000", 
      "http://192.168.31.152:3000",
      "http://10.161.163.95:3000",
      "http://192.168.31.254:3000",
      "http://localhost:3002",
      "http://192.168.31.254:3002",
      "http://localhost:3001",
      "http://192.168.31.254:3001",
      "http://localhost:3003",
      "http://192.168.31.254:3003"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e8, // 100MB for file uploads
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 32768,
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    zlibDeflateOptions: {
      level: 6
    }
  }
});

// Initialize real-time service for 10,000+ concurrent users
const realtimeService = new RealtimeService(io);

// Initialize legacy socket connection (for backward compatibility)
// Temporarily disabled to avoid conflicts
initializeSocket(io)

// Export io instance for use in other modules
// Note: io is exported at the end of the file

// Make io globally available for use in controllers
global.io = io;

// Initialize mediasoup socket connection
mediaSoupSocketConnection(io);

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not found in environment variables. Using default secret (not recommended for production).");
}

app.use(
  '/api/webhook/stripe',
  bodyParser.raw({ type: 'application/json' }),
  handlePaymentWebhook
);

app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || "http://localhost:3000", 
    "http://192.168.31.152:3000",
    "http://10.161.163.95:3000",
    "http://192.168.31.254:3000",
    "http://localhost:3002",
    "http://192.168.31.254:3002",
    "http://localhost:3001",
    "http://192.168.31.254:3001",
    "http://localhost:3003",
    "http://192.168.31.254:3003"
  ],
  credentials: true
}));

// Fixed session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// API Routes
app.use("/api/user", authRoutes);
app.use("/api/friend/", friendRoutes)
app.use("/api/attribute", attributeRoutes);
app.use("/api/expert", expertroutes);
app.use("/api/artist", artistRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin/articles", articleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comment", commentRoutes)
app.use("/api/superAdmin", superAdminRoutes)
app.use("/api/employee", superAdminRoutes)
app.use("/api/posts", postRoutes)
app.use('/api/superAdmin/media/music', musicMediaRoutes);
app.use('/api/superAdmin/media/films', filmMediaRoutes);
app.use('/api/superAdmin/media/art', artMediaRoutes);
app.use('/api/chat', injectSocketIO(io), messageRoutes)
app.use('/api/messages', injectSocketIO(io), messageRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/contact', contactRoutes)
app.get('/api/shared/signedUrl/:userId?', getSignedUrl)
app.use('/api/curated-paths', curatedPathRoutes)
app.use('/api/playlist', playlistRoutes)
app.use('/api/music', musicRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/livekit', livekitRoutes);

app.use('/api/media', mediaRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Error caught by middleware:', err);
  console.error('🚨 Error stack:', err.stack);
  console.error('🚨 Request URL:', req.url);
  console.error('🚨 Request method:', req.method);
  console.error('🚨 Request body:', req.body);
  
  // Handle ApiError instances
  if (err.statusCode && err.success === false) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.message
    });
  }
  
  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: err.message
    });
  }
  
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      message: 'Database Error',
      error: err.message
    });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong'
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    message: "Server is up and running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus
  });
});

// Database health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

export { server, io }