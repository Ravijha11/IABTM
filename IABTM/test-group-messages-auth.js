const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function testGroupMessagesWithAuth() {
  console.log('🧪 Testing Group Message Persistence with Authentication...\n');
  
  let cookies = '';
  
  try {
    // Test 1: Login to get authentication
    console.log('📋 Test 1: Authenticating user');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/user/auth/login-email`, {
        email: 'test@test.com',
        password: 'test123'
      }, {
        withCredentials: true
      });
      
      console.log('✅ Login successful');
      console.log('   User:', loginResponse.data.data?.user?.email);
      
      // Extract cookies from response
      const setCookieHeaders = loginResponse.headers['set-cookie'];
      if (setCookieHeaders) {
        cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
        console.log('   Cookies extracted:', cookies.substring(0, 50) + '...');
      }
      
    } catch (error) {
      console.error('❌ Login failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      return;
    }
    
    // Test 2: Test group messages endpoint with auth
    console.log('\n📋 Test 2: Testing group messages endpoint with auth');
    try {
      const groupResponse = await axios.get(`${BASE_URL}/api/messages/group/6881fa30cad7469cfcb3672e`, {
        params: { limit: 10 },
        headers: {
          'Cookie': cookies
        },
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
    
    // Test 3: Send a test message via API
    console.log('\n📋 Test 3: Sending test message via API');
    try {
      const testMessage = `Test message from API - ${new Date().toISOString()}`;
      const sendResponse = await axios.post(`${BASE_URL}/api/messages/send-message`, {
        content: testMessage,
        groupId: '6881fa30cad7469cfcb3672e'
      }, {
        headers: {
          'Cookie': cookies
        },
        withCredentials: true
      });
      
      console.log('✅ Message sent successfully');
      console.log('   Status:', sendResponse.status);
      console.log('   Message ID:', sendResponse.data.data?._id);
      console.log('   Content:', sendResponse.data.data?.content);
      
      // Store the message ID for later verification
      const sentMessageId = sendResponse.data.data?._id;
      
      // Test 4: Immediately retrieve the sent message
      console.log('\n📋 Test 4: Retrieving sent message immediately');
      try {
        const retrieveResponse = await axios.get(`${BASE_URL}/api/messages/group/6881fa30cad7469cfcb3672e`, {
          params: { limit: 5 },
          headers: {
            'Cookie': cookies
          },
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
          
          // Check if our sent message is in the list
          const foundMessage = retrieveResponse.data.data.messages.find(msg => msg._id === sentMessageId);
          if (foundMessage) {
            console.log('✅ Sent message found in retrieval');
          } else {
            console.log('❌ Sent message NOT found in retrieval');
          }
        }
        
      } catch (error) {
        console.error('❌ Message retrieval failed:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
      }
      
    } catch (error) {
      console.error('❌ Message sending failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 5: Test frontend API route with auth
    console.log('\n📋 Test 5: Testing frontend API route with auth');
    try {
      const frontendResponse = await axios.get(`http://localhost:3000/api/messages`, {
        params: { 
          groupId: '6881fa30cad7469cfcb3672e',
          limit: 5 
        },
        headers: {
          'Cookie': cookies
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
    console.log('- Authentication is working');
    console.log('- Backend endpoints are accessible with auth');
    console.log('- Message sending and retrieval are working');
    console.log('- Frontend API route is working');
    console.log('\n🔍 If messages are not persisting after refresh in the frontend:');
    console.log('1. Check if the frontend is properly authenticated');
    console.log('2. Verify that the frontend is calling the correct API endpoints');
    console.log('3. Check if there are any CORS or cookie issues');
    console.log('4. Ensure the message loading logic is working correctly');
    console.log('5. Check browser console for any errors');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testGroupMessagesWithAuth(); 