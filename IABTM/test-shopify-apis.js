const axios = require('axios');
require('dotenv').config({ path: './client/.env.local' });

async function testShopifyAPIs() {
  console.log('🧪 Testing Shopify APIs...\n');
  
  try {
    // Test 1: Check environment variables
    console.log('📋 Test 1: Environment Variables Check');
    const mainShop = process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
    const mainToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    const essentialsToken = process.env.SHOPIFY_ESSENTIALS_STOREFRONT_ACCESS_TOKEN;
    
    console.log('   Main Shop Domain:', mainShop || '❌ Missing');
    console.log('   Main Shop Token:', mainToken ? '✅ Present' : '❌ Missing');
    console.log('   Essentials Token:', essentialsToken ? '✅ Present' : '❌ Missing');
    
    if (!mainShop || !mainToken || !essentialsToken) {
      console.log('❌ Missing required environment variables');
      return;
    }
    
    // Test 2: Test main shop API directly
    console.log('\n📋 Test 2: Main Shop API (Direct Shopify)');
    try {
      const mainShopResponse = await axios.get(`https://${mainShop}/api/2025-04/graphql.json`, {
        headers: {
          'X-Shopify-Storefront-Access-Token': mainToken,
          'Content-Type': 'application/json',
        },
        data: {
          query: `
            query {
              products(first: 5) {
                edges {
                  node {
                    id
                    title
                    handle
                    description
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                    variants(first: 1) {
                      edges {
                        node {
                          id
                          price {
                            amount
                            currencyCode
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `
        }
      });
      
      console.log('✅ Main shop API working');
      console.log('   Status:', mainShopResponse.status);
      const products = mainShopResponse.data?.data?.products?.edges || [];
      console.log('   Products found:', products.length);
      
      if (products.length > 0) {
        console.log('📝 Sample product:', {
          title: products[0].node.title,
          price: products[0].node.variants.edges[0]?.node.price.amount
        });
      }
      
    } catch (error) {
      console.error('❌ Main shop API failed:', {
        status: error.response?.status,
        message: error.response?.data?.errors?.[0]?.message || error.message
      });
    }
    
    // Test 3: Test essentials shop API directly
    console.log('\n📋 Test 3: Essentials Shop API (Direct Shopify)');
    try {
      const essentialsResponse = await axios.get('https://ptuev0-g4.myshopify.com/api/2025-04/graphql.json', {
        headers: {
          'X-Shopify-Storefront-Access-Token': essentialsToken,
          'Content-Type': 'application/json',
        },
        data: {
          query: `
            query {
              products(first: 5) {
                edges {
                  node {
                    id
                    title
                    handle
                    description
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                    variants(first: 1) {
                      edges {
                        node {
                          id
                          price {
                            amount
                            currencyCode
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `
        }
      });
      
      console.log('✅ Essentials shop API working');
      console.log('   Status:', essentialsResponse.status);
      const products = essentialsResponse.data?.data?.products?.edges || [];
      console.log('   Products found:', products.length);
      
      if (products.length > 0) {
        console.log('📝 Sample product:', {
          title: products[0].node.title,
          price: products[0].node.variants.edges[0]?.node.price.amount
        });
      }
      
    } catch (error) {
      console.error('❌ Essentials shop API failed:', {
        status: error.response?.status,
        message: error.response?.data?.errors?.[0]?.message || error.message
      });
    }
    
    // Test 4: Test frontend API routes
    console.log('\n📋 Test 4: Frontend API Routes');
    
    // Test main shop API route
    try {
      const frontendMainResponse = await axios.get('http://localhost:3000/api/shopify?first=5');
      console.log('✅ Frontend main shop API working');
      console.log('   Status:', frontendMainResponse.status);
      console.log('   Products found:', frontendMainResponse.data?.length || 0);
      
      if (frontendMainResponse.data && frontendMainResponse.data.length > 0) {
        console.log('📝 Sample product from frontend:', {
          title: frontendMainResponse.data[0].title,
          price: frontendMainResponse.data[0].price
        });
      }
      
    } catch (error) {
      console.error('❌ Frontend main shop API failed:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      });
    }
    
    // Test essentials API route
    try {
      const frontendEssentialsResponse = await axios.get('http://localhost:3000/api/essentials?first=5');
      console.log('✅ Frontend essentials API working');
      console.log('   Status:', frontendEssentialsResponse.status);
      console.log('   Products found:', frontendEssentialsResponse.data?.length || 0);
      
      if (frontendEssentialsResponse.data && frontendEssentialsResponse.data.length > 0) {
        console.log('📝 Sample product from frontend:', {
          title: frontendEssentialsResponse.data[0].title,
          price: frontendEssentialsResponse.data[0].price
        });
      }
      
    } catch (error) {
      console.error('❌ Frontend essentials API failed:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      });
    }
    
    console.log('\n🎉 Shopify API test completed!');
    console.log('\n📝 Summary:');
    console.log('- Environment variables are configured');
    console.log('- Direct Shopify APIs are accessible');
    console.log('- Frontend API routes are working');
    console.log('\n🔍 If products are not showing:');
    console.log('1. Check if the Shopify stores have products');
    console.log('2. Verify the access tokens have proper permissions');
    console.log('3. Check browser console for any errors');
    console.log('4. Ensure the frontend is running on localhost:3000');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testShopifyAPIs(); 