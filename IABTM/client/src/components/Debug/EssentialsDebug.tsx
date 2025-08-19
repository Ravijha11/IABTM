'use client';

import React from 'react';
import { useEssentialsProducts } from '@/hooks/useEssentialsProducts';

export default function EssentialsDebug() {
  const { data: products, isLoading, isError, error } = useEssentialsProducts(10);

  console.log('🔍 Essentials Debug Info:', {
    isLoading,
    isError,
    productsCount: products?.length || 0,
    products: products?.slice(0, 2), // Log first 2 products
    error: error?.message
  });

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-800 font-semibold">Loading Essentials...</h3>
        <p className="text-blue-600">Fetching products from Shopify API...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error Loading Essentials</h3>
        <p className="text-red-600">Error: {error?.message || 'Unknown error'}</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-yellow-800 font-semibold">No Products Found</h3>
        <p className="text-yellow-600">The API returned an empty array or null.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-green-800 font-semibold">Essentials Data Loaded Successfully!</h3>
      <p className="text-green-600">Found {products.length} products</p>
      
      <div className="mt-4 space-y-2">
        <h4 className="font-medium text-green-700">Sample Products:</h4>
        {products.slice(0, 3).map((product: any, index: number) => (
          <div key={product.id} className="bg-white p-3 rounded border">
            <p className="font-medium">{product.title}</p>
            <p className="text-sm text-gray-600">${product.price}</p>
            <p className="text-xs text-gray-500">ID: {product.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 