// Type for Price details of a product variant
export type Price = {
  amount: string;
  currencyCode: string;
};

// Type for Product Image
export type ProductImage = {
  url: string;
  altText: string | null;
};

// Type for Product Variant (with price)
export type ProductVariant = {
  price: Price;
};

// Type for Product Data (single product)
export type Product = {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: string | null;
  altText: string;
  price: string;
  currencyCode: string;
  variantId?: string;
};

// Type for Products Response from the Shopify Collection Query
export type ProductsResponse = {
  collection: {
    title: string;
    products: {
      edges: {
        node: {
          id: string;
          title: string;
          handle: string;
          description: string;
          images: {
            edges: {
              node: ProductImage;
            }[];
          };
          variants: {
            edges: {
              node: ProductVariant;
            }[];
          };
        };
      }[];
    };
  };
};

// ✅ Type for All Products Response (not based on collection)
export type AllProductsResponse = {
  products: {
    edges: {
      node: {
        id: string;
        title: string;
        handle: string;
        description: string;
        images: {
          edges: {
            node: ProductImage;
          }[];
        };
        variants: {
          edges: {
            node: ProductVariant;
          }[];
        };
      };
    }[];
  };
};
