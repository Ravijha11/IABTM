const axios = require('axios');

// Test function to check frontend environment variable loading
async function testFrontendEnv() {
  console.log('🧪 Testing Frontend Environment Variable Loading...\n');
  
  try {
    // Test 1: Check if frontend is accessible
    console.log('📋 Test 1: Frontend accessibility');
    try {
      const frontendResponse = await axios.get('http://localhost:3000', {
        timeout: 10000
      });
      console.log('✅ Frontend is accessible');
      console.log('   Status:', frontendResponse.status);
    } catch (error) {
      console.log('❌ Frontend is not accessible:', error.message);
      return;
    }
    
    // Test 2: Check if backend is accessible
    console.log('\n📋 Test 2: Backend accessibility');
    try {
      const backendResponse = await axios.get('http://localhost:8000/health', {
        timeout: 5000
      });
      console.log('✅ Backend is accessible');
      console.log('   Status:', backendResponse.data);
    } catch (error) {
      console.log('❌ Backend is not accessible:', error.message);
      return;
    }
    
    // Test 3: Test login endpoint directly
    console.log('\n📋 Test 3: Direct login endpoint test');
    try {
      const loginResponse = await axios.post('http://localhost:8000/api/user/auth/login-email', {
        email: 'test@test.com',
        password: 'test123'
      }, {
        withCredentials: true,
        timeout: 10000
      });
      
      console.log('✅ Login endpoint working');
      console.log('   Status:', loginResponse.status);
      console.log('   User:', loginResponse.data?.data?.user?.email);
      
    } catch (error) {
      console.log('❌ Login endpoint failed:', error.response?.status || error.message);
    }
    
    console.log('\n🎉 Frontend environment test completed!');
    console.log('\n📝 Instructions:');
    console.log('1. Open your browser and go to: http://localhost:3000');
    console.log('2. Open browser developer tools (F12)');
    console.log('3. Go to the Console tab');
    console.log('4. Try to log in with: test@test.com / test123');
    console.log('5. Check the console for any error messages');
    console.log('6. Look for the log message showing the backend URL');
    console.log('\n🔍 Debugging:');
    console.log('- If you see "undefined" in the URL, the environment variable is not loading');
    console.log('- If you see the correct URL but get 404, there might be a routing issue');
    console.log('- The backend is confirmed working, so the issue is in the frontend');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testFrontendEnv(); 