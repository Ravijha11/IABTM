const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './server/.env' });

// Test user creation script
async function createTestUser() {
  console.log('🧪 Creating Test User...\n');
  
  try {
    // Connect to database
    console.log('📋 Step 1: Connecting to database');
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/iabtm');
    console.log('✅ Database connected successfully');
    
    // Import User model
    const User = require('./server/src/models/userModel.js');
    
    // Check if test user already exists
    console.log('\n📋 Step 2: Checking for existing test user');
    const existingUser = await User.findOne({ email: 'test@test.com' });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('   Email: test@test.com');
      console.log('   Password: test123');
      console.log('   User ID:', existingUser._id);
      return;
    }
    
    // Create test user
    console.log('\n📋 Step 3: Creating test user');
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const testUser = new User({
      name: 'Test User',
      email: 'test@test.com',
      password: hashedPassword,
      phoneNumber: '+1234567890',
      profilePicture: 'https://via.placeholder.com/150',
      isEmailVerified: true,
      isPhoneVerified: true,
      role: 'user'
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log('   Email: test@test.com');
    console.log('   Password: test123');
    console.log('   User ID:', testUser._id);
    
    console.log('\n🎉 Test user ready for login testing!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: test@test.com');
    console.log('   Password: test123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

// Run the script
createTestUser(); 