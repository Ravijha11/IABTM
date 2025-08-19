const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000'; // Frontend API
const BACKEND_URL = 'http://localhost:8000'; // Backend API

// Test function for step-by-step messaging verification
async function testMessagingStepByStep() {
  console.log('🧪 Testing Messaging System Step by Step...\n');
  
  try {
    // Step 1: Check if servers are running
    console.log('📋 Step 1: Checking server status');
    
    try {
      const backendHealth = await axios.get(`${BACKEND_URL}/health`);
      console.log('✅ Backend server is running');
      console.log('   Status:', backendHealth.data);
    } catch (error) {
      console.error('❌ Backend server is not running');
      console.error('   Please start the backend server: cd server && npm start');
      return;
    }
    
    try {
      const frontendResponse = await axios.get(`${BASE_URL}`);
      console.log('✅ Frontend server is running');
    } catch (error) {
      console.error('❌ Frontend server is not running');
      console.error('   Please start the frontend server: cd client && npm run dev');
      return;
    }
    
    // Step 2: Test backend message API directly
    console.log('\n📋 Step 2: Testing backend message API');
    
    try {
      // Test the test endpoint (no auth required)
      const testResponse = await axios.get(`${BACKEND_URL}/api/messages/test`);
      console.log('✅ Backend message API is accessible');
      console.log('   Response:', testResponse.data);
    } catch (error) {
      console.error('❌ Backend message API test failed:', error.response?.data || error.message);
    }
    
    // Step 3: Test frontend API proxy
    console.log('\n📋 Step 3: Testing frontend API proxy');
    
    try {
      const frontendTestResponse = await axios.get(`${BASE_URL}/api/messages/test`);
      console.log('✅ Frontend API proxy is working');
      console.log('   Response:', frontendTestResponse.data);
    } catch (error) {
      console.error('❌ Frontend API proxy test failed:', error.response?.data || error.message);
    }
    
    // Step 4: Test message creation (without auth for now)
    console.log('\n📋 Step 4: Testing message creation');
    
    try {
      const testMessageData = {
        content: 'This is a test message from step-by-step test',
        groupId: '6881fa30cad7469cfcb3672e' // Use a test group ID
      };
      
      const createResponse = await axios.post(`${BACKEND_URL}/api/messages/test-send`, testMessageData);
      console.log('✅ Test message created successfully');
      console.log('   Message ID:', createResponse.data.data._id);
      console.log('   Content:', createResponse.data.data.content);
    } catch (error) {
      console.error('❌ Test message creation failed:', error.response?.data || error.message);
    }
    
    // Step 5: Test message retrieval
    console.log('\n📋 Step 5: Testing message retrieval');
    
    try {
      const messagesResponse = await axios.get(`${BACKEND_URL}/api/messages/group/6881fa30cad7469cfcb3672e`, {
        params: { limit: 10 }
      });
      console.log('✅ Messages retrieved successfully');
      console.log('   Message count:', messagesResponse.data.data?.messages?.length || 0);
      if (messagesResponse.data.data?.messages?.length > 0) {
        console.log('   Latest message:', messagesResponse.data.data.messages[0].content?.substring(0, 50));
      }
    } catch (error) {
      console.error('❌ Message retrieval failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Step-by-step test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Open the chat interface in your browser');
    console.log('2. Sign in to get authentication');
    console.log('3. Select a group or start a personal chat');
    console.log('4. Try sending messages');
    console.log('5. Check browser console for debugging logs');
    
  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testMessagingStepByStep(); 