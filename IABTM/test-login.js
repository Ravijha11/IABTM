const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

// Simple test to check if users exist and login works
async function testLogin() {
  console.log('🧪 Testing Login Functionality...\n');
  
  try {
    // Connect to database
    console.log('📋 Step 1: Connecting to database');
    await mongoose.connect(process.env.MONGODB_URL + '/iabtm');
    console.log('✅ Database connected successfully');
    
    // Import User model
    const User = require('./server/src/models/userModel.js').default;
    
    // Check if any users exist
    console.log('\n📋 Step 2: Checking for existing users');
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().select('email name role').limit(5);
      console.log('\n👥 Sample users:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) - Role: ${user.role}`);
      });
    } else {
      console.log('❌ No users found in database');
    }
    
    // Test login endpoint
    console.log('\n📋 Step 3: Testing login endpoint');
    const testEmail = 'test@test.com';
    const testPassword = 'test123';
    
    const user = await User.findOne({ email: testEmail }).select('+password');
    if (user) {
      console.log('✅ Test user found');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`);
      
      // Test password comparison
      if (user.password) {
        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(testPassword, user.password);
        console.log(`   Password valid: ${isPasswordValid}`);
      }
    } else {
      console.log('❌ Test user not found');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  }
}

// Run the test
testLogin(); 