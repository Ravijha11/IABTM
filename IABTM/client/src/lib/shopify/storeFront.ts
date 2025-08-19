import { GraphQLClient, gql } from 'graphql-request';
import type { AllProductsResponse, Product,ProductsResponse } from './types';
const storefrontApiVersion = '2025-04';
const domain = process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

// Only create client if environment variables are available
let storefrontClient: GraphQLClient | null = null;

if (domain && storefrontAccessToken) {
  const endpoint = `https://${domain}/api/${storefrontApiVersion}/graphql.json`;
  storefrontClient = new GraphQLClient(endpoint, {
    headers: {
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      'Content-Type': 'application/json',
    },
  });
}

export { storefrontClient };

export async function getProductsByCollection(handle: string, first = 10): Promise<Product[]> {
  if (!storefrontClient) {
    console.error('❌ Shopify domain or storefront access token is missing.');
    return [];
  }

  const query = gql`
    query GetCollectionProducts($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        title
        products(first: $first) {
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
    }
  `;

  try {
    const data: ProductsResponse = await storefrontClient.request(query, { handle, first });

    const edges = data?.collection?.products?.edges ?? [];

    return edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description || 'No description available',
      image: edge.node.images.edges[0]?.node.url || null,
      altText: edge.node.images.edges[0]?.node.altText || 'No image description',
      price: edge.node.variants.edges[0]?.node.price.amount || 'Price not available',
      currencyCode: edge.node.variants.edges[0]?.node.price.currencyCode || 'USD',
      variantId: edge.node.variants.edges[0]?.node.id || null,
    }));
  } catch (error) {
    console.error('❌ Error fetching products by collection:', error);
    return [];
  }
}

export async function getAllProducts(first = 10): Promise<Product[]> {
  if (!storefrontClient) {
    console.error('❌ Shopify domain or storefront access token is missing.');
    return [];
  }

  const query = gql`
    query GetAllProducts($first: Int!) {
      products(first: $first) {
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
  `;

  try {
    const data: AllProductsResponse = await storefrontClient.request(query, { first });

    const edges = data?.products?.edges ?? [];

    return edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description || 'No description available',
      image: edge.node.images.edges[0]?.node.url || null,
      altText: edge.node.images.edges[0]?.node.altText || 'No image description',
      price: edge.node.variants.edges[0]?.node.price.amount || 'Price not available',
      currencyCode: edge.node.variants.edges[0]?.node.price.currencyCode || 'USD',
      variantId: edge.node.variants.edges[0]?.node.id || null,
    }));
  } catch (error) {
    console.error('❌ Error fetching all products:', error);
    return [];
  }
}

// Function to generate Shopify checkout URL
export function generateCheckoutUrl(cartItems: any[], storeType: 'main' | 'essentials' = 'main'): string {
  const domain = storeType === 'essentials' ? 'ptuev0-g4.myshopify.com' : process.env.NEXT_PUBLIC_SHOPIFY_SHOP;
  
  if (!domain) {
    console.error('❌ Shopify domain is missing.');
    return '#';
  }
  
  if (!cartItems || cartItems.length === 0) {
    return `https://${domain}`;
  }

  const cartItemsParam = cartItems
    .map(item => {
      if (!item.variantId) {
        console.warn(`No variant ID found for item: ${item.title}`);
        return null;
      }
      // Extract the variant ID from the GraphQL ID format (gid://shopify/ProductVariant/123456789)
      const variantId = item.variantId.split('/').pop();
      return `${variantId}:${item.quantity || 1}`;
    })
    .filter(Boolean)
    .join(',');

  return `https://${domain}/cart/${cartItemsParam}`;
}

