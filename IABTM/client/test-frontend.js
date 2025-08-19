const axios = require('axios');

async function testFrontend() {
  console.log('🧪 Testing Frontend Components...\n');

  try {
    // Test 1: Check if the app is running
    console.log('1️⃣ Testing if the app is accessible...');
    try {
      const response = await axios.get('http://localhost:3000');
      console.log('✅ App is running on port 3000');
    } catch (error) {
      console.log('❌ App is not running on port 3000');
      console.log('   Please start the development server with: npm run dev');
      return;
    }

    // Test 2: Check main shop API
    console.log('\n2️⃣ Testing main shop API...');
    try {
      const response = await axios.get('http://localhost:3000/api/shopify?first=5');
      console.log(`✅ Main shop API working - Found ${response.data.length} products`);
      if (response.data.length > 0) {
        console.log(`   Sample product: ${response.data[0].title} - $${response.data[0].price}`);
      }
    } catch (error) {
      console.log('❌ Main shop API failed:', error.response?.data || error.message);
    }

    // Test 3: Check essentials API
    console.log('\n3️⃣ Testing essentials API...');
    try {
      const response = await axios.get('http://localhost:3000/api/essentials?first=5');
      console.log(`✅ Essentials API working - Found ${response.data.length} products`);
      if (response.data.length > 0) {
        console.log(`   Sample product: ${response.data[0].title} - $${response.data[0].price}`);
      }
    } catch (error) {
      console.log('❌ Essentials API failed:', error.response?.data || error.message);
    }

    // Test 4: Check dashboard page
    console.log('\n4️⃣ Testing dashboard page...');
    try {
      const response = await axios.get('http://localhost:3000/dashboard');
      console.log('✅ Dashboard page is accessible');
    } catch (error) {
      console.log('❌ Dashboard page failed:', error.response?.status || error.message);
    }

    // Test 5: Check shop page
    console.log('\n5️⃣ Testing shop page...');
    try {
      const response = await axios.get('http://localhost:3000/shop');
      console.log('✅ Shop page is accessible');
    } catch (error) {
      console.log('❌ Shop page failed:', error.response?.status || error.message);
    }

    console.log('\n🎯 Frontend Test Summary:');
    console.log('   - If all APIs are working but products not showing, check:');
    console.log('     1. Browser console for JavaScript errors');
    console.log('     2. Network tab for failed requests');
    console.log('     3. React Query DevTools for cache issues');
    console.log('     4. Component rendering logic');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontend(); 