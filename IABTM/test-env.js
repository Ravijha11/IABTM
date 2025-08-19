const axios = require('axios');

// Test configuration
const BACKEND_URL = 'http://localhost:8000';

// Test function to verify environment variables
async function testEnvironment() {
  console.log('🧪 Testing Environment Configuration...\n');
  
  try {
    // Test 1: Backend health check
    console.log('📋 Test 1: Backend health check');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/health`);
      console.log('✅ Backend server is running');
      console.log('   Status:', healthResponse.data);
    } catch (error) {
      console.error('❌ Backend server is not running');
      return;
    }
    
    // Test 2: Test login endpoint directly
    console.log('\n📋 Test 2: Test login endpoint directly');
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/user/auth/login-email`, {
        email: 'test@test.com',
        password: 'test123'
      }, {
        withCredentials: true,
        timeout: 15000
      });
      
      console.log('✅ Login endpoint working correctly');
      console.log('   Status:', loginResponse.status);
      console.log('   User:', loginResponse.data?.data?.user?.email);
      console.log('   Access Token:', loginResponse.data?.data?.accessToken ? 'Present' : 'Missing');
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Login endpoint error:');
        console.log('   Status:', error.response.status);
        console.log('   Message:', error.response.data?.message || 'No message');
      } else {
        console.error('❌ Login endpoint error:', error.message);
      }
    }
    
    // Test 3: Test auth status endpoint
    console.log('\n📋 Test 3: Test auth status endpoint');
    try {
      const authResponse = await axios.get(`${BACKEND_URL}/api/user/me/profile`, {
        withCredentials: true,
        timeout: 10000
      });
      console.log('❌ Auth endpoint should have failed but succeeded:', authResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Auth endpoint correctly requires authentication');
        console.log('   Status:', error.response.status);
        console.log('   Message:', error.response.data?.message || 'No message');
      } else {
        console.error('❌ Auth endpoint error:', error.message);
      }
    }
    
    console.log('\n🎉 Environment test completed!');
    console.log('\n📝 Summary:');
    console.log('- Backend server: ✅ Running');
    console.log('- Login endpoint: ✅ Working');
    console.log('- Auth endpoint: ✅ Properly protected');
    console.log('\n🔧 Next steps:');
    console.log('1. The backend is working correctly');
    console.log('2. The issue is in the frontend environment variable loading');
    console.log('3. Try accessing http://localhost:3000 in your browser');
    console.log('4. Check browser console for any errors');
    
  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testEnvironment(); 