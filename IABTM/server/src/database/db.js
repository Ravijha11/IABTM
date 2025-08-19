import mongoose from "mongoose"

const connectDB = async () => {
    try {
        // Check if MONGODB_URL is provided
        if (!process.env.MONGODB_URL) {
            console.error("MONGODB_URL is not defined in environment variables");
            console.log("Please create a .env file with MONGODB_URL=mongodb://localhost:27017");
            return false; // Don't exit, just return false
        }

        // Build connection string with better options
        let connectionString = process.env.MONGODB_URL;
        
        // The MONGODB_URL already includes the database name and query parameters
        // No need to modify it further

        // Set up connection event handlers BEFORE attempting connection
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected successfully');
        });

        mongoose.connection.on('close', () => {
            console.log('🔒 MongoDB connection closed');
        });

        console.log("🔌 Attempting to connect to MongoDB...");
        console.log("📡 Connection string (sanitized):", connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
        
        // Simple connection configuration for local MongoDB
        const connectionOptions = {
            // Connection pool settings
            maxPoolSize: 5,           // Reduced for stability
            minPoolSize: 1,           // Minimum connections
            maxIdleTimeMS: 30000,     // 30 seconds
            serverSelectionTimeoutMS: 10000, // Timeout for server selection
            socketTimeoutMS: 30000,   // Socket timeout
            connectTimeoutMS: 10000,  // Connect timeout
            heartbeatFrequencyMS: 10000,
            
            // Write concern and read preferences
            retryWrites: true,
            w: 'majority',
            readPreference: 'primaryPreferred',
            readConcern: { level: 'majority' },
            
            // Buffer settings
            bufferCommands: true,
            
            // Family preference
            family: 4, // Force IPv4
        };

        console.log("🔧 Using simple connection options for local MongoDB...");
        
        const connectionInstance = await mongoose.connect(connectionString, connectionOptions);

        console.log(`✅ MongoDB connected successfully on ${connectionInstance.connection.host}`);
        console.log(`📊 Database: ${connectionInstance.connection.name}`);

        // Add graceful shutdown handling
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('🔒 MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });

        return true; // Connection successful
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        
        console.log("🔧 Please check your MONGODB_URL in .env file");
        console.log("💡 For local MongoDB: MONGODB_URL=mongodb://localhost:27017");
        console.log("💡 For MongoDB Atlas: MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net");
        
        // Provide specific troubleshooting steps
        if (error.message.includes('timed out')) {
            console.log("\n🔧 Troubleshooting steps for timeout errors:");
            console.log("1. Check your internet connection");
            console.log("2. Verify MongoDB Atlas cluster is running");
            console.log("3. Check if your IP is whitelisted in Atlas");
            console.log("4. Try using a local MongoDB instance instead");
        }
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log("\n🔧 Troubleshooting steps for connection refused:");
            console.log("1. Make sure MongoDB is installed and running");
            console.log("2. Start MongoDB service: net start MongoDB");
            console.log("3. Check if MongoDB is running on localhost:27017");
        }
        
        // Don't exit immediately, let the application handle the error
        // Mongoose will handle reconnection automatically
        
        return false; // Connection failed
    }
}

export default connectDB 