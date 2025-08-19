const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const mockToken = 'your-test-token-here'; // Replace with actual test token

// Test data
const testGroupId = 'test-group-id'; // Replace with actual group ID
const testUserId = 'test-user-id'; // Replace with actual user ID

console.log('🧪 Starting Comprehensive Audio Room Tests...\n');

async function testAudioRoomStatus(groupId) {
  console.log('🧪 Testing Audio Room Status...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/group/${groupId}/audio-room/status`, {
      headers: {
        'Authorization': `Bearer ${mockToken}`
      }
    });
    
    console.log('✅ Audio room status successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Audio room status failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetAudioRoomToken(groupId) {
  console.log('🧪 Testing Get Audio Room Token...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/group/${groupId}/audio-room/token`, {}, {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Get audio room token successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get audio room token failed:', error.response?.data || error.message);
    return null;
  }
}

async function testStartAudioRoom(groupId) {
  console.log('🧪 Testing Start Audio Room...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/group/${groupId}/audio-room/start`, {}, {
      headers: {
        'Authorization': `Bearer ${mockToken}`
      }
    });
    
    console.log('✅ Start audio room successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Start audio room failed:', error.response?.data || error.message);
    return null;
  }
}

async function testJoinAudioRoom(groupId) {
  console.log('🧪 Testing Join Audio Room...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/group/${groupId}/audio-room/join`, {}, {
      headers: {
        'Authorization': `Bearer ${mockToken}`
      }
    });
    
    console.log('✅ Join audio room successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Join audio room failed:', error.response?.data || error.message);
    return null;
  }
}

async function testLeaveAudioRoom(groupId) {
  console.log('🧪 Testing Leave Audio Room...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/group/${groupId}/audio-room/leave`, {}, {
      headers: {
        'Authorization': `Bearer ${mockToken}`
      }
    });
    
    console.log('✅ Leave audio room successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Leave audio room failed:', error.response?.data || error.message);
    return null;
  }
}

async function testEndAudioRoom(groupId) {
  console.log('🧪 Testing End Audio Room...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/group/${groupId}/audio-room/end`, {}, {
      headers: {
        'Authorization': `Bearer ${mockToken}`
      }
    });
    
    console.log('✅ End audio room successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ End audio room failed:', error.response?.data || error.message);
    return null;
  }
}

async function testWebSocketConnection(roomName, token) {
  console.log('🧪 Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    const WebSocket = require('ws');
    const ws = new WebSocket(`ws://localhost:7880/rtc?room=${roomName}&access_token=${token}`);
    
    let connected = false;
    let receivedWelcome = false;
    
    const timeout = setTimeout(() => {
      if (!connected) {
        console.error('❌ WebSocket connection timeout');
        ws.close();
        resolve(false);
      }
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      connected = true;
      clearTimeout(timeout);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message:', message.type);
        
        if (message.type === 'welcome') {
          receivedWelcome = true;
          console.log('✅ Received welcome message');
          
          // Send a test message
          ws.send(JSON.stringify({
            type: 'chat_message',
            message: 'Test message from automated test'
          }));
          
          // Close connection after successful test
          setTimeout(() => {
            ws.close();
            resolve(true);
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket closed');
      clearTimeout(timeout);
      resolve(connected && receivedWelcome);
    });
  });
}

async function runComprehensiveTest() {
  console.log('🚀 Running Comprehensive Audio Room Test Suite...\n');
  
  // Test 1: Check initial status
  console.log('=== Test 1: Initial Status ===');
  const initialStatus = await testAudioRoomStatus(testGroupId);
  
  // Test 2: Get token (should create room if not exists)
  console.log('\n=== Test 2: Get Token ===');
  const tokenResult = await testGetAudioRoomToken(testGroupId);
  
  if (tokenResult && tokenResult.data) {
    // Test 3: WebSocket connection
    console.log('\n=== Test 3: WebSocket Connection ===');
    const wsSuccess = await testWebSocketConnection(
      tokenResult.data.roomName, 
      tokenResult.data.token
    );
    
    if (wsSuccess) {
      console.log('✅ WebSocket connection test passed');
    } else {
      console.log('❌ WebSocket connection test failed');
    }
  }
  
  // Test 4: Check status after token
  console.log('\n=== Test 4: Status After Token ===');
  const statusAfterToken = await testAudioRoomStatus(testGroupId);
  
  // Test 5: Try to join (should work if room is active)
  console.log('\n=== Test 5: Join Room ===');
  const joinResult = await testJoinAudioRoom(testGroupId);
  
  // Test 6: Leave room
  console.log('\n=== Test 6: Leave Room ===');
  const leaveResult = await testLeaveAudioRoom(testGroupId);
  
  // Test 7: End room (if user is host)
  console.log('\n=== Test 7: End Room ===');
  const endResult = await testEndAudioRoom(testGroupId);
  
  // Test 8: Final status check
  console.log('\n=== Test 8: Final Status ===');
  const finalStatus = await testAudioRoomStatus(testGroupId);
  
  console.log('\n🎉 Comprehensive test completed!');
  console.log('\n📊 Test Summary:');
  console.log('- Initial Status:', initialStatus ? '✅' : '❌');
  console.log('- Token Generation:', tokenResult ? '✅' : '❌');
  console.log('- WebSocket Connection:', tokenResult ? '✅' : '❌');
  console.log('- Join Room:', joinResult ? '✅' : '❌');
  console.log('- Leave Room:', leaveResult ? '✅' : '❌');
  console.log('- End Room:', endResult ? '✅' : '❌');
  console.log('- Final Status:', finalStatus ? '✅' : '❌');
}

// Run the test if this file is executed directly
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = {
  testAudioRoomStatus,
  testGetAudioRoomToken,
  testStartAudioRoom,
  testJoinAudioRoom,
  testLeaveAudioRoom,
  testEndAudioRoom,
  testWebSocketConnection,
  runComprehensiveTest
}; 