const axios = require('axios');

async function simpleTest() {
  console.log('🧪 Simple Auth Test...\n');
  
  try {
    // Test auth endpoint without login
    console.log('📋 Testing /api/user/me/profile without authentication');
    
    const response = await axios.get('http://localhost:8000/api/user/me/profile', {
      withCredentials: true,
      timeout: 5000
    });
    
    console.log('✅ Unexpected success:', response.status);
    
  } catch (error) {
    if (error.response) {
      console.log('✅ Expected failure:');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data?.message || 'No message');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

simpleTest(); 