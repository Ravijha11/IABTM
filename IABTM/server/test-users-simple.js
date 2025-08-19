import mongoose from 'mongoose';
import User from './src/models/userModel.js';

// Simple test to check if we can connect and see users
async function testUsers() {
  try {
    console.log('🔍 Testing user database connection...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iabtm');
    console.log('✅ Connected to MongoDB');
    
    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    if (totalUsers === 0) {
      console.log('⚠️ No users found in database');
      console.log('💡 You may need to create some test users or register users first');
    } else {
      // Get some sample users
      const users = await User.find().select('name email isOnline').limit(5);
      console.log('📋 Sample users:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.isOnline ? 'Online' : 'Offline'}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUsers(); 