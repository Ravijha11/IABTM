#!/usr/bin/env node

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let mongod;

async function startDevServer() {
    try {
        console.log('🚀 Starting development server with MongoDB Memory Server...');
        
        // Start MongoDB Memory Server
        mongod = await MongoMemoryServer.create();
        const mongoUri = mongod.getUri();
        
        console.log('📡 MongoDB Memory Server URI:', mongoUri);
        
        // Update environment variable
        process.env.MONGODB_URL = mongoUri;
        
        // Connect to MongoDB Memory Server
        await mongoose.connect(mongoUri, {
            maxPoolSize: 5,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 10000,
            retryWrites: true,
            w: 'majority',
            bufferCommands: true,
            family: 4
        });
        
        console.log('✅ Connected to MongoDB Memory Server');
        
        // Import and start the main server
        const { server } = await import('./app.js');
        
        const port = process.env.PORT || 8000;
        const host = process.env.IP_ADDRESS || 'localhost';
        
        server.listen(port, host, () => {
            console.log(`✅ Development server is running on ${host}:${port}`);
            console.log(`🌐 Environment: development (with Memory MongoDB)`);
            console.log(`🔗 Health check: http://${host}:${port}/`);
            console.log(`📊 API Base URL: http://${host}:${port}/api`);
            console.log(`💾 Database: MongoDB Memory Server`);
        });
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('🛑 Shutting down development server...');
            await mongoose.connection.close();
            if (mongod) {
                await mongod.stop();
            }
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('🛑 Shutting down development server...');
            await mongoose.connection.close();
            if (mongod) {
                await mongod.stop();
            }
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start development server:', error.message);
        if (mongod) {
            await mongod.stop();
        }
        process.exit(1);
    }
}

startDevServer(); 