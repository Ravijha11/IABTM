const axios = require('axios');

// Test configuration
const BACKEND_URL = 'http://localhost:8000';

// Test function for auth status endpoint
async function testAuthStatus() {
  console.log('🧪 Testing Auth Status Endpoint...\n');
  
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
    
    // Test 2: Test auth status endpoint without authentication
    console.log('\n📋 Test 2: Test auth status endpoint without authentication');
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
    
    // Test 3: Login first, then test auth status
    console.log('\n📋 Test 3: Login and then test auth status');
    try {
      // Step 1: Login
      const loginResponse = await axios.post(`${BACKEND_URL}/api/user/auth/login-email`, {
        email: 'test@test.com',
        password: 'test123'
      }, {
        withCredentials: true,
        timeout: 15000
      });
      
      console.log('✅ Login successful');
      
      // Step 2: Test auth status with cookies from login
      const authResponse = await axios.get(`${BACKEND_URL}/api/user/me/profile`, {
        withCredentials: true,
        timeout: 10000,
        headers: {
          'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
        }
      });
      
      console.log('✅ Auth status check successful');
      console.log('   Status:', authResponse.status);
      console.log('   User:', authResponse.data?.data?.email);
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Auth status check failed:');
        console.log('   Status:', error.response.status);
        console.log('   Message:', error.response.data?.message || 'No message');
        console.log('   Data:', error.response.data);
      } else {
        console.error('❌ Auth status check error:', error.message);
      }
    }
    
    console.log('\n🎉 Auth status test finished!');
    
  } catch (error) {
    console.error('❌ General test error:', error.message);
  }
}

// Run the test
testAuthStatus(); 