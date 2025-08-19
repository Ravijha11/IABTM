import axios from 'axios';

const testServer = async () => {
  try {
    console.log('🧪 Testing server connectivity...');
    
    // Test 1: Check if server is running
    console.log('📋 Test 1: Checking server health');
    try {
      const response = await axios.get('http://localhost:8000/');
      console.log('✅ Server is running:', response.status);
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('Error:', error.message);
      return;
    }
    
    // Test 2: Test message API without auth
    console.log('📋 Test 2: Testing message API without auth');
    try {
      const response = await axios.get('http://localhost:8000/api/messages/test');
      console.log('✅ Message API test endpoint:', response.data);
    } catch (error) {
      console.log('❌ Message API test failed:', error.response?.data || error.message);
    }
    
    // Test 3: Test conversations API without auth (should fail)
    console.log('📋 Test 3: Testing conversations API without auth (should fail)');
    try {
      const response = await axios.get('http://localhost:8000/api/messages/conversations');
      console.log('❌ Unexpected success:', response.data);
    } catch (error) {
      console.log('✅ Correctly failed without auth:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 4: Test with cookies (if you have them)
    console.log('📋 Test 4: Testing with credentials');
    try {
      const response = await axios.get('http://localhost:8000/api/messages/conversations', {
        withCredentials: true
      });
      console.log('✅ Conversations API with auth:', response.status);
      console.log('📦 Response data:', response.data);
    } catch (error) {
      console.log('❌ Conversations API with auth failed:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testServer(); 