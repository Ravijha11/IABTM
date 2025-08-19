import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';

async function testPersonalChatsFix() {
  console.log('🧪 Testing Personal Chats Fix...\n');
  
  try {
    // Test 1: Check if backend is running
    console.log('📋 Test 1: Backend connectivity');
    try {
      const backendResponse = await axios.get(`${BACKEND_URL}/api/messages/test`);
      console.log('✅ Backend is running');
    } catch (error) {
      console.error('❌ Backend is not running:', error.message);
      return;
    }
    
    // Test 2: Test conversations endpoint directly
    console.log('\n📋 Test 2: Conversations endpoint (direct backend)');
    try {
      const conversationsResponse = await axios.get(`${BACKEND_URL}/api/messages/conversations`, {
        withCredentials: true
      });
      
      console.log('✅ Conversations endpoint working');
      console.log('   Status:', conversationsResponse.status);
      console.log('   Success:', conversationsResponse.data.success);
      console.log('   Personal chats:', conversationsResponse.data.data?.personal?.length || 0);
      console.log('   Group chats:', conversationsResponse.data.data?.groups?.length || 0);
      
      if (conversationsResponse.data.data?.personal?.length > 0) {
        console.log('📝 Sample personal chat:', {
          recipient: conversationsResponse.data.data.personal[0].recipient?.name,
          lastMessage: conversationsResponse.data.data.personal[0].lastMessage?.content?.substring(0, 50),
          unreadCount: conversationsResponse.data.data.personal[0].unreadCount
        });
      }
      
    } catch (error) {
      console.error('❌ Conversations endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 3: Test frontend API proxy
    console.log('\n📋 Test 3: Frontend API proxy');
    try {
      const frontendResponse = await axios.get(`${BASE_URL}/api/conversations`, {
        withCredentials: true
      });
      
      console.log('✅ Frontend API proxy working');
      console.log('   Status:', frontendResponse.status);
      console.log('   Success:', frontendResponse.data.success);
      console.log('   Personal chats:', frontendResponse.data.data?.personal?.length || 0);
      console.log('   Group chats:', frontendResponse.data.data?.groups?.length || 0);
      
    } catch (error) {
      console.error('❌ Frontend API proxy failed:', error.response?.data || error.message);
    }
    
    // Test 4: Compare with groups endpoint
    console.log('\n📋 Test 4: Compare with groups endpoint');
    try {
      const groupsResponse = await axios.get(`${BASE_URL}/api/group/my-groups`, {
        withCredentials: true
      });
      
      console.log('✅ Groups endpoint working');
      console.log('   Status:', groupsResponse.status);
      console.log('   Success:', groupsResponse.data.success);
      console.log('   Groups count:', groupsResponse.data.data?.length || 0);
      
    } catch (error) {
      console.error('❌ Groups endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 5: Test creating a personal chat
    console.log('\n📋 Test 5: Create personal chat');
    try {
      // First, get all users to find a recipient
      const usersResponse = await axios.get(`${BACKEND_URL}/api/user/get-all-users`, {
        withCredentials: true
      });
      
      if (usersResponse.data.data && usersResponse.data.data.length > 0) {
        const recipientId = usersResponse.data.data[0]._id;
        
        // Create a personal chat
        const chatResponse = await axios.post(`${BACKEND_URL}/api/chats/create-personal`, {
          memberId: recipientId
        }, {
          withCredentials: true
        });
        
        console.log('✅ Personal chat created');
        console.log('   Chat ID:', chatResponse.data.data?._id);
        console.log('   Type:', chatResponse.data.data?.type);
        console.log('   Participants:', chatResponse.data.data?.participants?.length);
        
      } else {
        console.log('⚠️ No users available for testing');
      }
      
    } catch (error) {
      console.error('❌ Create personal chat failed:', error.response?.data || error.message);
    }
    
    // Test 6: Test sending a message
    console.log('\n📋 Test 6: Send personal message');
    try {
      // Get users again
      const usersResponse = await axios.get(`${BACKEND_URL}/api/user/get-all-users`, {
        withCredentials: true
      });
      
      if (usersResponse.data.data && usersResponse.data.data.length > 0) {
        const recipientId = usersResponse.data.data[0]._id;
        
        // Send a message
        const messageResponse = await axios.post(`${BACKEND_URL}/api/messages/send-message`, {
          recipientId: recipientId,
          content: 'Test message from personal chat fix'
        }, {
          withCredentials: true
        });
        
        console.log('✅ Message sent successfully');
        console.log('   Message ID:', messageResponse.data.data?._id);
        console.log('   Content:', messageResponse.data.data?.content);
        console.log('   Sender:', messageResponse.data.data?.sender?.name);
        
      } else {
        console.log('⚠️ No users available for testing');
      }
      
    } catch (error) {
      console.error('❌ Send message failed:', error.response?.data || error.message);
    }
    
    console.log('\n✅ Personal chats fix test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPersonalChatsFix(); 