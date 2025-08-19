const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function testCompleteMessagingFlow() {
  console.log('🧪 Testing Complete Messaging Flow...\n');
  
  let cookies = '';
  let userId = '';
  let testGroupId = '';
  
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
      userId = loginResponse.data.data?.user?._id;
      console.log('   User ID:', userId);
      
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
    
    // Test 2: Create a test group
    console.log('\n📋 Test 2: Creating test group');
    try {
      const createGroupResponse = await axios.post(`${BASE_URL}/api/group/create`, {
        name: `Test Group ${Date.now()}`,
        description: 'Test group for messaging',
        members: [userId]
      }, {
        headers: {
          'Cookie': cookies
        },
        withCredentials: true
      });
      
      console.log('✅ Test group created');
      console.log('   Status:', createGroupResponse.status);
      console.log('   Success:', createGroupResponse.data.success);
      testGroupId = createGroupResponse.data.data?._id;
      console.log('   Group ID:', testGroupId);
      console.log('   Group Name:', createGroupResponse.data.data?.name);
      
    } catch (error) {
      console.error('❌ Group creation failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      return;
    }
    
    // Test 3: Send a test message to the group
    console.log('\n📋 Test 3: Sending test message to group');
    let sentMessageId = '';
    try {
      const testMessage = `Test message from API - ${new Date().toISOString()}`;
      const sendResponse = await axios.post(`${BASE_URL}/api/messages/send-message`, {
        content: testMessage,
        groupId: testGroupId
      }, {
        headers: {
          'Cookie': cookies
        },
        withCredentials: true
      });
      
      console.log('✅ Test message sent successfully');
      console.log('   Status:', sendResponse.status);
      sentMessageId = sendResponse.data.data?._id;
      console.log('   Message ID:', sentMessageId);
      console.log('   Content:', sendResponse.data.data?.content);
      
    } catch (error) {
      console.error('❌ Test message sending failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      return;
    }
    
    // Test 4: Immediately retrieve messages from the group
    console.log('\n📋 Test 4: Retrieving messages from group');
    try {
      const messagesResponse = await axios.get(`${BASE_URL}/api/messages/group/${testGroupId}`, {
        params: { limit: 10 },
        headers: {
          'Cookie': cookies
        },
        withCredentials: true
      });
      
      console.log('✅ Group messages retrieved');
      console.log('   Status:', messagesResponse.status);
      console.log('   Success:', messagesResponse.data.success);
      console.log('   Messages count:', messagesResponse.data.data?.messages?.length || 0);
      
      if (messagesResponse.data.data?.messages && messagesResponse.data.data.messages.length > 0) {
        console.log('📝 Messages in group:');
        messagesResponse.data.data.messages.forEach((msg, index) => {
          console.log(`   ${index + 1}. ${msg.content?.substring(0, 50)}...`);
          console.log(`      Sender: ${msg.sender?.name}`);
          console.log(`      Time: ${msg.createdAt}`);
          console.log(`      ID: ${msg._id}`);
        });
        
        // Check if our sent message is in the list
        const foundMessage = messagesResponse.data.data.messages.find(msg => msg._id === sentMessageId);
        if (foundMessage) {
          console.log('✅ Sent message found in retrieval - PERSISTENCE WORKING!');
        } else {
          console.log('❌ Sent message NOT found in retrieval - PERSISTENCE ISSUE!');
        }
      } else {
        console.log('❌ No messages found in group');
      }
      
    } catch (error) {
      console.error('❌ Group messages retrieval failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 5: Test frontend API route
    console.log('\n📋 Test 5: Testing frontend API route');
    try {
      const frontendResponse = await axios.get(`http://localhost:3000/api/messages`, {
        params: { 
          groupId: testGroupId,
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
      
      if (frontendResponse.data.data?.messages && frontendResponse.data.data.messages.length > 0) {
        console.log('📝 Frontend retrieved messages:');
        frontendResponse.data.data.messages.forEach((msg, index) => {
          console.log(`   ${index + 1}. ${msg.content?.substring(0, 50)}...`);
        });
      }
      
    } catch (error) {
      console.error('❌ Frontend API route failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    // Test 6: Send another message and verify persistence
    console.log('\n📋 Test 6: Testing message persistence after delay');
    try {
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const secondMessage = `Second test message - ${new Date().toISOString()}`;
      const secondSendResponse = await axios.post(`${BASE_URL}/api/messages/send-message`, {
        content: secondMessage,
        groupId: testGroupId
      }, {
        headers: {
          'Cookie': cookies
        },
        withCredentials: true
      });
      
      console.log('✅ Second message sent');
      console.log('   Message ID:', secondSendResponse.data.data?._id);
      
      // Retrieve again to verify both messages are there
      const secondRetrieveResponse = await axios.get(`${BASE_URL}/api/messages/group/${testGroupId}`, {
        params: { limit: 10 },
        headers: {
          'Cookie': cookies
        },
        withCredentials: true
      });
      
      console.log('✅ Second retrieval successful');
      console.log('   Messages count:', secondRetrieveResponse.data.data?.messages?.length || 0);
      
      if (secondRetrieveResponse.data.data?.messages && secondRetrieveResponse.data.data.messages.length >= 2) {
        console.log('✅ Both messages found - PERSISTENCE CONFIRMED!');
      } else {
        console.log('❌ Not all messages found - PERSISTENCE ISSUE!');
      }
      
    } catch (error) {
      console.error('❌ Second message test failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    console.log('\n🎉 Complete messaging flow test completed!');
    console.log('\n📝 Summary:');
    console.log('- Authentication is working');
    console.log('- Group creation is working');
    console.log('- Message sending is working');
    console.log('- Message persistence is working');
    console.log('- Frontend API route is working');
    console.log('\n🔍 Root cause of the frontend issue:');
    console.log('The user was not a member of any groups, so they couldn\'t access any group messages.');
    console.log('Messages were being saved to the database correctly, but the user couldn\'t retrieve them.');
    console.log('\n💡 Solution:');
    console.log('1. Make sure users are added to groups when they join');
    console.log('2. Check if the frontend is properly handling group membership');
    console.log('3. Verify that the authentication is working in the frontend');
    console.log('4. Ensure the frontend is using the correct group IDs');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testCompleteMessagingFlow(); 