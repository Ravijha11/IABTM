const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function debugMessageSending() {
  console.log('🔍 Debugging Message Sending...\n');
  
  let cookies = '';
  let userId = '';
  let testGroupId = '';
  
  try {
    // Step 1: Login
    console.log('📋 Step 1: Login');
    const loginResponse = await axios.post(`${BASE_URL}/api/user/auth/login-email`, {
      email: 'test@test.com',
      password: 'test123'
    }, {
      withCredentials: true
    });
    
    console.log('✅ Login successful');
    userId = loginResponse.data.data?.user?._id;
    console.log('   User ID:', userId);
    
    const setCookieHeaders = loginResponse.headers['set-cookie'];
    if (setCookieHeaders) {
      cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
    // Step 2: Create group
    console.log('\n📋 Step 2: Create group');
    const createGroupResponse = await axios.post(`${BASE_URL}/api/group/create`, {
      name: `Debug Group ${Date.now()}`,
      description: 'Debug group',
      members: [userId]
    }, {
      headers: { 'Cookie': cookies },
      withCredentials: true
    });
    
    console.log('✅ Group created');
    testGroupId = createGroupResponse.data.data?._id;
    console.log('   Group ID:', testGroupId);
    console.log('   Full response:', JSON.stringify(createGroupResponse.data, null, 2));
    
    // Step 3: Send message with detailed logging
    console.log('\n📋 Step 3: Send message');
    const testMessage = `Debug message - ${new Date().toISOString()}`;
    console.log('   Sending message:', testMessage);
    console.log('   To group:', testGroupId);
    
    const sendResponse = await axios.post(`${BASE_URL}/api/messages/send-message`, {
      content: testMessage,
      groupId: testGroupId
    }, {
      headers: { 'Cookie': cookies },
      withCredentials: true
    });
    
    console.log('✅ Send response received');
    console.log('   Status:', sendResponse.status);
    console.log('   Full response:', JSON.stringify(sendResponse.data, null, 2));
    
    // Step 4: Check if message was actually saved
    console.log('\n📋 Step 4: Check message in database');
    const messagesResponse = await axios.get(`${BASE_URL}/api/messages/group/${testGroupId}`, {
      params: { limit: 10 },
      headers: { 'Cookie': cookies },
      withCredentials: true
    });
    
    console.log('✅ Messages response received');
    console.log('   Status:', messagesResponse.status);
    console.log('   Full response:', JSON.stringify(messagesResponse.data, null, 2));
    
    // Step 5: Check group details
    console.log('\n📋 Step 5: Check group details');
    const groupResponse = await axios.get(`${BASE_URL}/api/group/${testGroupId}`, {
      headers: { 'Cookie': cookies },
      withCredentials: true
    });
    
    console.log('✅ Group details received');
    console.log('   Status:', groupResponse.status);
    console.log('   Full response:', JSON.stringify(groupResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

debugMessageSending(); 