import { GraphQLClient, gql } from 'graphql-request';
import type { AllProductsResponse, Product, ProductsResponse } from './types';

const storefrontApiVersion = '2025-04';
const domain = 'ptuev0-g4.myshopify.com';
const storefrontAccessToken = process.env.SHOPIFY_ESSENTIALS_STOREFRONT_ACCESS_TOKEN;

// Only create client if environment variables are available
let essentialsStorefrontClient: GraphQLClient | null = null;

if (storefrontAccessToken) {
  const endpoint = `https://${domain}/api/${storefrontApiVersion}/graphql.json`;
  essentialsStorefrontClient = new GraphQLClient(endpoint, {
    headers: {
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      'Content-Type': 'application/json',
    },
  });
}

export { essentialsStorefrontClient };

export async function getEssentialsProductsByCollection(handle: string, first = 10): Promise<Product[]> {
  if (!essentialsStorefrontClient) {
    console.error('❌ Shopify essentials storefront access token is missing.');
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
    const data: ProductsResponse = await essentialsStorefrontClient.request(query, { handle, first });

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
    console.error('❌ Error fetching essentials products by collection:', error);
    return [];
  }
}

export async function getAllEssentialsProducts(first = 10): Promise<Product[]> {
  if (!essentialsStorefrontClient) {
    console.error('❌ Shopify essentials storefront access token is missing.');
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
    const data: AllProductsResponse = await essentialsStorefrontClient.request(query, { first });

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
    console.error('❌ Error fetching all essentials products:', error);
    return [];
  }
}

// Function to generate Essentials store checkout URL
export function generateEssentialsCheckoutUrl(cartItems: any[]): string {
  const domain = 'ptuev0-g4.myshopify.com';
  
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