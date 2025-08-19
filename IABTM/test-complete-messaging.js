const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000'; // Frontend API
const BACKEND_URL = 'http://localhost:8000'; // Backend API

// Test function for complete messaging system
async function testCompleteMessaging() {
  console.log('🧪 Testing Complete Messaging System...\n');
  
  try {
    // Test 1: Backend health check
    console.log('📋 Test 1: Backend health check');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/health`);
      console.log('✅ Backend health:', healthResponse.data);
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
      return;
    }
    
    // Test 2: Frontend API health check
    console.log('\n📋 Test 2: Frontend API health check');
    try {
      const frontendHealthResponse = await axios.get(`${BASE_URL}/api/messages/test`);
      console.log('✅ Frontend API health:', frontendHealthResponse.data);
    } catch (error) {
      console.log('⚠️ Frontend API test endpoint not available (this is normal)');
    }
    
    // Test 3: Test message API routes
    console.log('\n📋 Test 3: Testing message API routes');
    try {
      // Test conversations endpoint
      const conversationsResponse = await axios.get(`${BASE_URL}/api/messages`, {
        withCredentials: true
      });
      console.log('✅ Conversations endpoint working');
      console.log('   Status:', conversationsResponse.status);
      console.log('   Success:', conversationsResponse.data.success);
    } catch (error) {
      console.error('❌ Conversations endpoint failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 4: Test group messages endpoint
    console.log('\n📋 Test 4: Testing group messages endpoint');
    try {
      const groupResponse = await axios.get(`${BASE_URL}/api/messages`, {
        params: {
          groupId: '6881fa30cad7469cfcb3672e', // Use a test group ID
          limit: 10
        },
        withCredentials: true
      });
      console.log('✅ Group messages endpoint working');
      console.log('   Status:', groupResponse.status);
      console.log('   Success:', groupResponse.data.success);
      console.log('   Messages count:', groupResponse.data.data?.messages?.length || 0);
    } catch (error) {
      console.error('❌ Group messages endpoint failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 5: Test direct messages endpoint
    console.log('\n📋 Test 5: Testing direct messages endpoint');
    try {
      const directResponse = await axios.get(`${BASE_URL}/api/messages`, {
        params: {
          recipientId: 'test-recipient-id', // Use a test recipient ID
          limit: 10
        },
        withCredentials: true
      });
      console.log('✅ Direct messages endpoint working');
      console.log('   Status:', directResponse.status);
      console.log('   Success:', directResponse.data.success);
    } catch (error) {
      console.error('❌ Direct messages endpoint failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 6: Test backend routes directly
    console.log('\n📋 Test 6: Testing backend routes directly');
    try {
      const backendGroupResponse = await axios.get(`${BACKEND_URL}/api/messages/group/6881fa30cad7469cfcb3672e`, {
        params: { limit: 10 },
        withCredentials: true
      });
      console.log('✅ Backend group messages route working');
      console.log('   Status:', backendGroupResponse.status);
      console.log('   Success:', backendGroupResponse.data.success);
    } catch (error) {
      console.error('❌ Backend group messages route failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 7: Test socket connection
    console.log('\n📋 Test 7: Testing socket connection');
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
    
    console.log('\n🎉 Complete messaging system test finished!');
    console.log('\n📝 Summary:');
    console.log('- Backend server should be running on port 8000');
    console.log('- Frontend should be running on port 3000');
    console.log('- Socket.IO should be properly configured');
    console.log('- Message routes should be working');
    console.log('- Database should be connected');
    
  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testCompleteMessaging(); 