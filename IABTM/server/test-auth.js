import axios from 'axios';

const testAuth = async () => {
  try {
    console.log('🧪 Testing user authentication...');
    
    // Test 1: Check if user is authenticated by calling a simple endpoint
    console.log('📋 Test 1: Checking user authentication');
    try {
      const response = await axios.get('http://localhost:8000/api/user/profile', {
        withCredentials: true
      });
      console.log('✅ User is authenticated:', response.data);
    } catch (error) {
      console.log('❌ User is not authenticated:', error.response?.data);
    }
    
    // Test 2: Try to get user info
    console.log('\n📋 Test 2: Getting user info');
    try {
      const response = await axios.get('http://localhost:8000/api/user/me', {
        withCredentials: true
      });
      console.log('✅ User info:', response.data);
    } catch (error) {
      console.log('❌ Could not get user info:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testAuth(); 