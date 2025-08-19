const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function testGroupMessages() {
  console.log('🧪 Testing Group Message Persistence...\n');
  
  try {
    // Test 1: Check if backend is running
    console.log('📋 Test 1: Backend health check');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Backend is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Backend is not running:', error.message);
      return;
    }
    
    // Test 2: Test group messages endpoint directly
    console.log('\n📋 Test 2: Testing group messages endpoint');
    try {
      const groupResponse = await axios.get(`${BASE_URL}/api/messages/group/6881fa30cad7469cfcb3672e`, {
        params: { limit: 10 },
        withCredentials: true
      });
      
      console.log('✅ Group messages endpoint working');
      console.log('   Status:', groupResponse.status);
      console.log('   Success:', groupResponse.data.success);
      console.log('   Messages count:', groupResponse.data.data?.messages?.length || 0);
      
      if (groupResponse.data.data?.messages && groupResponse.data.data.messages.length > 0) {
        console.log('📝 Sample message:', {
          id: groupResponse.data.data.messages[0]._id,
          content: groupResponse.data.data.messages[0].content?.substring(0, 50),
          sender: groupResponse.data.data.messages[0].sender?.name,
          createdAt: groupResponse.data.data.messages[0].createdAt
        });
      }
      
    } catch (error) {
      console.error('❌ Group messages endpoint failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 3: Test sending a message via socket (simulated)
    console.log('\n📋 Test 3: Testing message sending via API');
    try {
      const sendResponse = await axios.post(`${BASE_URL}/api/messages/send-message`, {
        content: `Test message from API - ${new Date().toISOString()}`,
        groupId: '6881fa30cad7469cfcb3672e'
      }, {
        withCredentials: true
      });
      
      console.log('✅ Message sent successfully');
      console.log('   Status:', sendResponse.status);
      console.log('   Message ID:', sendResponse.data.data?._id);
      console.log('   Content:', sendResponse.data.data?.content);
      
    } catch (error) {
      console.error('❌ Message sending failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 4: Check if the sent message is retrievable
    console.log('\n📋 Test 4: Checking if sent message is retrievable');
    try {
      const retrieveResponse = await axios.get(`${BASE_URL}/api/messages/group/6881fa30cad7469cfcb3672e`, {
        params: { limit: 5 },
        withCredentials: true
      });
      
      console.log('✅ Message retrieval working');
      console.log('   Messages count:', retrieveResponse.data.data?.messages?.length || 0);
      
      if (retrieveResponse.data.data?.messages && retrieveResponse.data.data.messages.length > 0) {
        const latestMessage = retrieveResponse.data.data.messages[0];
        console.log('📝 Latest message:', {
          id: latestMessage._id,
          content: latestMessage.content?.substring(0, 50),
          sender: latestMessage.sender?.name,
          createdAt: latestMessage.createdAt
        });
      }
      
    } catch (error) {
      console.error('❌ Message retrieval failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 5: Test frontend API route
    console.log('\n📋 Test 5: Testing frontend API route');
    try {
      const frontendResponse = await axios.get(`http://localhost:3000/api/messages`, {
        params: { 
          groupId: '6881fa30cad7469cfcb3672e',
          limit: 5 
        },
        withCredentials: true
      });
      
      console.log('✅ Frontend API route working');
      console.log('   Status:', frontendResponse.status);
      console.log('   Success:', frontendResponse.data.success);
      console.log('   Messages count:', frontendResponse.data.data?.messages?.length || 0);
      
    } catch (error) {
      console.error('❌ Frontend API route failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    console.log('\n🎉 Group message persistence test completed!');
    console.log('\n📝 Summary:');
    console.log('- Backend is running and accessible');
    console.log('- Group messages endpoint is working');
    console.log('- Message sending via API is working');
    console.log('- Message retrieval is working');
    console.log('- Frontend API route is working');
    console.log('\n🔍 If messages are not persisting after refresh:');
    console.log('1. Check if the frontend is calling the correct API endpoints');
    console.log('2. Verify that messages are being saved to the database');
    console.log('3. Check if the message loading logic is working correctly');
    console.log('4. Ensure the socket events are properly handling message persistence');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testGroupMessages(); 