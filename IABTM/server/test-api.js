import axios from 'axios';

const testConversationsAPI = async () => {
  try {
    console.log('🧪 Testing conversations API...');
    
    // First, let's try to get conversations without authentication
    console.log('📋 Test 1: Getting conversations without auth');
    try {
      const response = await axios.get('http://localhost:8000/api/messages/conversations');
      console.log('✅ Response without auth:', response.data);
    } catch (error) {
      console.log('❌ Expected error without auth:', error.response?.data);
    }
    
    // Now let's try with a session cookie (you'll need to be logged in)
    console.log('\n📋 Test 2: Getting conversations with auth');
    try {
      const response = await axios.get('http://localhost:8000/api/messages/conversations', {
        withCredentials: true
      });
      console.log('✅ Response with auth:', response.data);
      
      if (response.data.success) {
        console.log('📦 Personal conversations:', response.data.data?.personal?.length || 0);
        console.log('📦 Group conversations:', response.data.data?.groups?.length || 0);
        
        if (response.data.data?.personal?.length > 0) {
          console.log('📝 Sample personal conversation:', response.data.data.personal[0]);
        }
      }
    } catch (error) {
      console.log('❌ Error with auth:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testConversationsAPI(); 