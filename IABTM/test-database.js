const mongoose = require('mongoose');
require('dotenv').config();

// Test database connection and message operations
async function testDatabase() {
  console.log('🧪 Testing Database Connection and Message Operations...\n');
  
  try {
    // Connect to database
    console.log('📋 Test 1: Database connection');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iabtm');
    console.log('✅ Database connected successfully');
    
    // Import models
    const Message = require('./server/src/models/messageModel.js');
    const User = require('./server/src/models/userModel.js');
    const Group = require('./server/src/models/groupModel.js');
    
    // Test 2: Check if we have any users
    console.log('\n📋 Test 2: Check users');
    const userCount = await User.countDocuments();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test 3: Check if we have any groups
    console.log('\n📋 Test 3: Check groups');
    const groupCount = await Group.countDocuments();
    console.log(`✅ Found ${groupCount} groups in database`);
    
    // Test 4: Check if we have any messages
    console.log('\n📋 Test 4: Check messages');
    const messageCount = await Message.countDocuments();
    console.log(`✅ Found ${messageCount} messages in database`);
    
    // Test 5: Create a test message
    console.log('\n📋 Test 5: Create test message');
    try {
      // Get first user and group for testing
      const testUser = await User.findOne();
      const testGroup = await Group.findOne();
      
      if (testUser && testGroup) {
        const testMessage = new Message({
          sender: testUser._id,
          group: testGroup._id,
          content: 'This is a test message from database test',
          messageType: 'text'
        });
        
        await testMessage.save();
        console.log('✅ Test message created successfully');
        console.log('   Message ID:', testMessage._id);
        console.log('   Content:', testMessage.content);
        console.log('   Sender:', testMessage.sender);
        console.log('   Group:', testMessage.group);
        
        // Test 6: Retrieve the test message
        console.log('\n📋 Test 6: Retrieve test message');
        const retrievedMessage = await Message.findById(testMessage._id)
          .populate('sender', 'name profilePicture')
          .populate('group', 'name avatar');
        
        console.log('✅ Test message retrieved successfully');
        console.log('   Content:', retrievedMessage.content);
        console.log('   Sender:', retrievedMessage.sender?.name);
        console.log('   Group:', retrievedMessage.group?.name);
        
        // Clean up - delete test message
        await Message.findByIdAndDelete(testMessage._id);
        console.log('✅ Test message cleaned up');
        
      } else {
        console.log('⚠️ No users or groups found for testing');
      }
    } catch (error) {
      console.error('❌ Test message creation failed:', error.message);
    }
    
    // Test 7: Test message queries
    console.log('\n📋 Test 7: Test message queries');
    if (testGroup) {
      const groupMessages = await Message.find({ group: testGroup._id })
        .populate('sender', 'name profilePicture')
        .sort({ createdAt: -1 })
        .limit(10);
      
      console.log(`✅ Found ${groupMessages.length} messages for group ${testGroup.name}`);
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

// Run the test
testDatabase(); 