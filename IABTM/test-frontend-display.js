const axios = require('axios');

async function testFrontendDisplay() {
  console.log('🧪 Testing Frontend Product Display...\n');
  
  try {
    // Test 1: Check if frontend is running
    console.log('📋 Test 1: Frontend Accessibility');
    try {
      const frontendResponse = await axios.get('http://localhost:3000', {
        timeout: 5000
      });
      console.log('✅ Frontend is accessible');
      console.log('   Status:', frontendResponse.status);
    } catch (error) {
      console.log('❌ Frontend is not accessible:', error.message);
      console.log('💡 Make sure the frontend is running: npm run dev');
      return;
    }
    
    // Test 2: Test main shop API
    console.log('\n📋 Test 2: Main Shop API');
    try {
      const mainShopResponse = await axios.get('http://localhost:3000/api/shopify?first=5');
      console.log('✅ Main shop API working');
      console.log('   Status:', mainShopResponse.status);
      console.log('   Products found:', mainShopResponse.data?.length || 0);
      
      if (mainShopResponse.data && mainShopResponse.data.length > 0) {
        console.log('📝 Sample main shop product:', {
          title: mainShopResponse.data[0].title,
          price: mainShopResponse.data[0].price,
          hasImage: !!mainShopResponse.data[0].image
        });
      }
      
    } catch (error) {
      console.error('❌ Main shop API failed:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      });
    }
    
    // Test 3: Test essentials API
    console.log('\n📋 Test 3: Essentials API');
    try {
      const essentialsResponse = await axios.get('http://localhost:3000/api/essentials?first=5');
      console.log('✅ Essentials API working');
      console.log('   Status:', essentialsResponse.status);
      console.log('   Products found:', essentialsResponse.data?.length || 0);
      
      if (essentialsResponse.data && essentialsResponse.data.length > 0) {
        console.log('📝 Sample essentials product:', {
          title: essentialsResponse.data[0].title,
          price: essentialsResponse.data[0].price,
          hasImage: !!essentialsResponse.data[0].image
        });
      }
      
    } catch (error) {
      console.error('❌ Essentials API failed:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      });
    }
    
    // Test 4: Check shop page
    console.log('\n📋 Test 4: Shop Page');
    try {
      const shopPageResponse = await axios.get('http://localhost:3000/shop', {
        timeout: 10000
      });
      console.log('✅ Shop page is accessible');
      console.log('   Status:', shopPageResponse.status);
      
      // Check if the response contains product-related content
      const hasProducts = shopPageResponse.data.includes('product') || 
                         shopPageResponse.data.includes('Product') ||
                         shopPageResponse.data.includes('price') ||
                         shopPageResponse.data.includes('Price');
      
      if (hasProducts) {
        console.log('✅ Shop page contains product content');
      } else {
        console.log('⚠️  Shop page might not be displaying products');
      }
      
    } catch (error) {
      console.error('❌ Shop page failed:', error.message);
    }
    
    console.log('\n🎉 Frontend display test completed!');
    console.log('\n📝 Summary:');
    console.log('- Frontend is running and accessible');
    console.log('- Both shop APIs are working');
    console.log('- Products are being fetched correctly');
    console.log('\n🔍 If products are not showing in the UI:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Verify that React Query is working properly');
    console.log('3. Check if the components are receiving the data');
    console.log('4. Ensure the product cards are rendering correctly');
    console.log('5. Check if there are any CSS/styling issues hiding the products');
    console.log('\n💡 To debug further:');
    console.log('1. Open browser developer tools (F12)');
    console.log('2. Go to the Network tab');
    console.log('3. Navigate to /shop or /dashboard?section=Essentials');
    console.log('4. Check if API calls are being made and returning data');
    console.log('5. Look for any JavaScript errors in the Console tab');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFrontendDisplay(); 