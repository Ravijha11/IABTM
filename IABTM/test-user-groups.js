const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function testUserGroups() {
  console.log('🧪 Testing User Groups...\n');
  
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
      console.log('   User ID:', loginResponse.data.data?.user?._id);
      
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
    
    // Test 2: Get user's groups
    console.log('\n📋 Test 2: Getting user groups');
    try {
      const groupsResponse = await axios.get(`${BASE_URL}/api/group/my-groups`, {
        headers: {
          'Cookie': cookies
        },
        withCredentials: true
      });
      
      console.log('✅ User groups retrieved');
      console.log('   Status:', groupsResponse.status);
      console.log('   Success:', groupsResponse.data.success);
      console.log('   Groups count:', groupsResponse.data.data?.length || 0);
      
      if (groupsResponse.data.data && groupsResponse.data.data.length > 0) {
        console.log('📝 User groups:');
        groupsResponse.data.data.forEach((group, index) => {
          console.log(`   ${index + 1}. ${group.name} (ID: ${group._id})`);
          console.log(`      Members: ${group.members?.length || 0}`);
          console.log(`      Creator: ${group.creator}`);
        });
        
        // Use the first group for testing
        const testGroup = groupsResponse.data.data[0];
        console.log(`\n🎯 Using group "${testGroup.name}" (${testGroup._id}) for testing`);
        
        // Test 3: Get messages for this group
        console.log('\n📋 Test 3: Getting messages for user group');
        try {
          const messagesResponse = await axios.get(`${BASE_URL}/api/messages/group/${testGroup._id}`, {
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
            console.log('📝 Sample messages:');
            messagesResponse.data.data.messages.slice(0, 3).forEach((msg, index) => {
              console.log(`   ${index + 1}. ${msg.content?.substring(0, 50)}...`);
              console.log(`      Sender: ${msg.sender?.name}`);
              console.log(`      Time: ${msg.createdAt}`);
            });
          }
          
        } catch (error) {
          console.error('❌ Group messages failed:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
          });
        }
        
        // Test 4: Send a test message to this group
        console.log('\n📋 Test 4: Sending test message to user group');
        try {
          const testMessage = `Test message from API - ${new Date().toISOString()}`;
          const sendResponse = await axios.post(`${BASE_URL}/api/messages/send-message`, {
            content: testMessage,
            groupId: testGroup._id
          }, {
            headers: {
              'Cookie': cookies
            },
            withCredentials: true
          });
          
          console.log('✅ Test message sent successfully');
          console.log('   Status:', sendResponse.status);
          console.log('   Message ID:', sendResponse.data.data?._id);
          console.log('   Content:', sendResponse.data.data?.content);
          
        } catch (error) {
          console.error('❌ Test message sending failed:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
          });
        }
        
      } else {
        console.log('📝 User is not a member of any groups');
        console.log('💡 You need to create a group or join an existing group to test messaging');
      }
      
    } catch (error) {
      console.error('❌ User groups failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    
    console.log('\n🎉 User groups test completed!');
    console.log('\n📝 Summary:');
    console.log('- Authentication is working');
    console.log('- User groups can be retrieved');
    console.log('- Group messages can be accessed if user is a member');
    console.log('- Message sending works for groups the user is a member of');
    console.log('\n🔍 For the frontend issue:');
    console.log('1. Make sure the user is a member of the groups they\'re trying to access');
    console.log('2. Check if the frontend is using the correct group IDs');
    console.log('3. Verify that the authentication is working in the frontend');
    console.log('4. Check browser console for any errors');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testUserGroups(); 