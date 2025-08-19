const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000'; // Frontend API
const BACKEND_URL = 'http://localhost:8000'; // Backend API

// Test function for message API
async function testMessageAPI() {
  console.log('🧪 Testing Message API...\n');
  
  try {
    // Test 1: Test the frontend API route for group messages
    console.log('📋 Test 1: Testing frontend API route for group messages');
    try {
      const frontendResponse = await axios.get(`${BASE_URL}/api/messages`, {
        params: {
          groupId: '6881fa30cad7469cfcb3672e', // Use one of the group IDs from the error logs
          limit: 10
        },
        withCredentials: true
      });
      
      console.log('✅ Frontend API response:', {
        status: frontendResponse.status,
        success: frontendResponse.data.success,
        hasData: !!frontendResponse.data.data,
        hasMessages: !!frontendResponse.data.data?.messages,
        messageCount: frontendResponse.data.data?.messages?.length || 0
      });
      
      if (frontendResponse.data.data?.messages && frontendResponse.data.data.messages.length > 0) {
        console.log('📝 Sample message:', {
          id: frontendResponse.data.data.messages[0]._id,
          content: frontendResponse.data.data.messages[0].content?.substring(0, 50),
          sender: frontendResponse.data.data.messages[0].sender?.name
        });
      }
      
    } catch (frontendError) {
      console.error('❌ Frontend API test failed:', {
        status: frontendError.response?.status,
        message: frontendError.response?.data?.message,
        error: frontendError.message
      });
    }
    
    // Test 2: Test the backend API route directly
    console.log('\n📋 Test 2: Testing backend API route directly');
    try {
      const backendResponse = await axios.get(`${BACKEND_URL}/api/messages/group/6881fa30cad7469cfcb3672e`, {
        params: {
          limit: 10
        },
        withCredentials: true
      });
      
      console.log('✅ Backend API response:', {
        status: backendResponse.status,
        success: backendResponse.data.success,
        hasData: !!backendResponse.data.data,
        hasMessages: !!backendResponse.data.data?.messages,
        messageCount: backendResponse.data.data?.messages?.length || 0
      });
      
      if (backendResponse.data.data?.messages && backendResponse.data.data.messages.length > 0) {
        console.log('📝 Sample message:', {
          id: backendResponse.data.data.messages[0]._id,
          content: backendResponse.data.data.messages[0].content?.substring(0, 50),
          sender: backendResponse.data.data.messages[0].sender?.name
        });
      }
      
    } catch (backendError) {
      console.error('❌ Backend API test failed:', {
        status: backendError.response?.status,
        message: backendError.response?.data?.message,
        error: backendError.message
      });
    }
    
    // Test 3: Test conversations endpoint
    console.log('\n📋 Test 3: Testing conversations endpoint');
    try {
      const conversationsResponse = await axios.get(`${BASE_URL}/api/messages`, {
        withCredentials: true
      });
      
      console.log('✅ Conversations response:', {
        status: conversationsResponse.status,
        success: conversationsResponse.data.success,
        hasData: !!conversationsResponse.data.data
      });
      
    } catch (conversationsError) {
      console.error('❌ Conversations test failed:', {
        status: conversationsError.response?.status,
        message: conversationsError.response?.data?.message,
        error: conversationsError.message
      });
    }
    
  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testMessageAPI(); 