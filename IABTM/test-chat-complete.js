const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000'; // Frontend API
const BACKEND_URL = 'http://localhost:8000'; // Backend API

// Test function for complete chat system verification
async function testChatComplete() {
  console.log('🧪 Testing Complete Chat System...\n');
  
  try {
    // Test 1: Backend health check
    console.log('📋 Test 1: Backend health check');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/health`);
      console.log('✅ Backend server is running');
      console.log('   Status:', healthResponse.data);
    } catch (error) {
      console.error('❌ Backend server is not running');
      console.error('   Please start: cd server && npm start');
      return;
    }
    
    // Test 2: Frontend health check
    console.log('\n📋 Test 2: Frontend health check');
    try {
      const frontendResponse = await axios.get(`${BASE_URL}`);
      console.log('✅ Frontend server is running');
    } catch (error) {
      console.error('❌ Frontend server is not running');
      console.error('   Please start: cd client && npm run dev');
      return;
    }
    
    // Test 3: Backend message API test endpoint
    console.log('\n📋 Test 3: Backend message API test');
    try {
      const testResponse = await axios.get(`${BACKEND_URL}/api/messages/test`);
      console.log('✅ Backend message API is accessible');
      console.log('   Response:', testResponse.data);
    } catch (error) {
      console.error('❌ Backend message API test failed:', error.response?.data || error.message);
    }
    
    // Test 4: Frontend API proxy test
    console.log('\n📋 Test 4: Frontend API proxy test');
    try {
      const proxyResponse = await axios.get(`${BASE_URL}/api/messages/test`);
      console.log('✅ Frontend API proxy is working');
      console.log('   Response:', proxyResponse.data);
    } catch (error) {
      console.error('❌ Frontend API proxy test failed:', error.response?.data || error.message);
    }
    
    // Test 5: Test message creation (without auth)
    console.log('\n📋 Test 5: Test message creation');
    try {
      const testMessageData = {
        content: 'This is a test message from complete chat test',
        groupId: '6881fa30cad7469cfcb3672e' // Use a test group ID
      };
      
      const createResponse = await axios.post(`${BACKEND_URL}/api/messages/test-send`, testMessageData);
      console.log('✅ Test message created successfully');
      console.log('   Message ID:', createResponse.data.data._id);
      console.log('   Content:', createResponse.data.data.content);
    } catch (error) {
      console.error('❌ Test message creation failed:', error.response?.data || error.message);
    }
    
    // Test 6: Test message retrieval
    console.log('\n📋 Test 6: Test message retrieval');
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
    
    // Test 7: Test socket connection
    console.log('\n📋 Test 7: Test socket connection');
    try {
      const socket = require('socket.io-client');
      const socketClient = socket(BACKEND_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });
      
      socketClient.on('connect', () => {
        console.log('✅ Socket connected successfully');
        socketClient.emit('authenticate');
      });
      
      socketClient.on('authenticated', (data) => {
        console.log('✅ Socket authenticated successfully');
      });
      
      socketClient.on('auth_error', (error) => {
        console.error('❌ Socket authentication failed:', error);
      });
      
      socketClient.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
      });
      
      // Wait for connection
      await new Promise((resolve) => {
        socketClient.on('connect', resolve);
        setTimeout(resolve, 3000); // Timeout after 3 seconds
      });
      
      socketClient.disconnect();
    } catch (error) {
      console.error('❌ Socket test failed:', error.message);
    }
    
    console.log('\n🎉 Complete chat system test finished!');
    console.log('\n📝 Summary:');
    console.log('- Backend server should be running on port 8000');
    console.log('- Frontend should be running on port 3000');
    console.log('- Socket.IO should be properly configured');
    console.log('- Message routes should be working');
    console.log('- Database should be connected');
    console.log('\n🔧 Next steps:');
    console.log('1. Open the chat interface in your browser');
    console.log('2. Sign in to get authentication');
    console.log('3. Select a group or start a personal chat');
    console.log('4. Try sending messages');
    console.log('5. Check browser console for debugging logs');
    console.log('6. Messages should appear immediately and persist after refresh');
    
  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testChatComplete(); 