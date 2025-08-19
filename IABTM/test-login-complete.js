const axios = require('axios');

// Test configuration
const BACKEND_URL = 'http://localhost:8000';

// Test function for complete login functionality
async function testCompleteLogin() {
  console.log('🧪 Testing Complete Login Functionality...\n');
  
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
    
    // Test 2: Test login endpoint with valid credentials
    console.log('\n📋 Test 2: Test login endpoint with valid credentials');
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/user/auth/login-email`, {
        email: 'test@test.com',
        password: 'test123'
      }, {
        withCredentials: true,
        timeout: 15000 // 15 second timeout
      });
      console.log('✅ Login successful!');
      console.log('   Status:', loginResponse.status);
      console.log('   User:', loginResponse.data?.data?.user?.email);
      console.log('   Access Token:', loginResponse.data?.data?.accessToken ? 'Present' : 'Missing');
    } catch (error) {
      if (error.response) {
        console.log('❌ Login failed with response:');
        console.log('   Status:', error.response.status);
        console.log('   Message:', error.response.data?.message || 'No message');
        console.log('   Data:', error.response.data);
      } else if (error.code === 'ECONNABORTED') {
        console.log('❌ Login request timed out');
      } else {
        console.error('❌ Login endpoint error:', error.message);
      }
    }
    
    // Test 3: Test login endpoint with invalid credentials
    console.log('\n📋 Test 3: Test login endpoint with invalid credentials');
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/user/auth/login-email`, {
        email: 'test@test.com',
        password: 'wrongpassword'
      }, {
        withCredentials: true,
        timeout: 10000
      });
      console.log('❌ Login should have failed but succeeded:', loginResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Login correctly rejected invalid credentials');
        console.log('   Status:', error.response.status);
        console.log('   Message:', error.response.data?.message || 'No message');
      } else {
        console.error('❌ Login endpoint error:', error.message);
      }
    }
    
    console.log('\n🎉 Complete login test finished!');
    
  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testCompleteLogin(); 