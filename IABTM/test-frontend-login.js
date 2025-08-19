const axios = require('axios');

// Test configuration
const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';

// Test function for frontend login
async function testFrontendLogin() {
  console.log('🧪 Testing Frontend Login Flow...\n');
  
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
    
    // Test 2: Frontend accessibility
    console.log('\n📋 Test 2: Frontend accessibility');
    try {
      const frontendResponse = await axios.get(`${FRONTEND_URL}`, {
        timeout: 10000
      });
      console.log('✅ Frontend is accessible');
      console.log('   Status:', frontendResponse.status);
    } catch (error) {
      console.log('❌ Frontend is not accessible:', error.message);
    }
    
    // Test 3: Login endpoint test
    console.log('\n📋 Test 3: Login endpoint test');
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
        console.log('   Data:', error.response.data);
      } else {
        console.error('❌ Login endpoint error:', error.message);
      }
    }
    
    console.log('\n🎉 Frontend login test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Open your browser and go to: http://localhost:3000');
    console.log('2. Try logging in with: test@test.com / test123');
    console.log('3. Check the browser console for any errors');
    
  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testFrontendLogin(); 