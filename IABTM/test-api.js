const axios = require('axios');

// Test configuration
const BACKEND_URL = 'http://localhost:8000';

// Test function for login functionality
async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');
  
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
    
    // Test 2: Test login endpoint with invalid credentials
    console.log('\n📋 Test 2: Test login endpoint with invalid credentials');
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/user/auth/login-email`, {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      }, {
        withCredentials: true
      });
      console.log('❌ Login should have failed but succeeded:', loginResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Login endpoint is working (correctly rejected invalid credentials)');
        console.log('   Status:', error.response.status);
        console.log('   Message:', error.response.data?.message || 'No message');
      } else {
        console.error('❌ Login endpoint error:', error.message);
      }
    }
    
    // Test 3: Test login endpoint with missing fields
    console.log('\n📋 Test 3: Test login endpoint with missing fields');
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/user/auth/login-email`, {
        email: 'test@test.com'
        // Missing password
      }, {
        withCredentials: true
      });
      console.log('❌ Login should have failed but succeeded:', loginResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Login endpoint correctly handles missing fields');
        console.log('   Status:', error.response.status);
        console.log('   Message:', error.response.data?.message || 'No message');
      } else {
        console.error('❌ Login endpoint error:', error.message);
      }
    }
    
    console.log('\n🎉 API test completed!');
    
  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testAPI(); 