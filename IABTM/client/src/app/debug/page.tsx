'use client';

import React from 'react';
import { useEssentialsProducts } from '@/hooks/useEssentialsProducts';
import { useAllProducts } from '@/hooks/useAllProducts';
import { useCart } from '@/context/Cart';
import { useAuthStore } from '@/storage/authStore';

export default function DebugPage() {
  const { data: essentialsProducts, isLoading: essentialsLoading, isError: essentialsError } = useEssentialsProducts(5);
  const { data: mainProducts, isLoading: mainLoading, isError: mainError } = useAllProducts(5);
  const { cartCount, cartItems } = useCart();
  const { user, loading: authLoading } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">🔍 Shop & Essentials Debug Page</h1>
        
        {/* Authentication Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Auth Loading:</strong> {authLoading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? user.email || 'Logged in' : 'Not logged in'}</p>
            </div>
            <div>
              <p><strong>Cart Count:</strong> {cartCount}</p>
              <p><strong>Cart Items:</strong> {cartItems.length}</p>
            </div>
          </div>
        </div>

        {/* Essentials Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Essentials Products</h2>
          <div className="mb-4">
            <p><strong>Loading:</strong> {essentialsLoading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {essentialsError ? 'Yes' : 'No'}</p>
            <p><strong>Products Count:</strong> {essentialsProducts?.length || 0}</p>
          </div>
          
          {essentialsProducts && essentialsProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {essentialsProducts.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-gray-600">${product.price}</p>
                  <p className="text-sm text-gray-500">{product.id}</p>
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-32 object-cover rounded mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Shop Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Main Shop Products</h2>
          <div className="mb-4">
            <p><strong>Loading:</strong> {mainLoading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {mainError ? 'Yes' : 'No'}</p>
            <p><strong>Products Count:</strong> {mainProducts?.length || 0}</p>
          </div>
          
          {mainProducts && mainProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainProducts.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-gray-600">${product.price}</p>
                  <p className="text-sm text-gray-500">{product.id}</p>
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-32 object-cover rounded mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Environment Variables Check */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>SHOPIFY_SHOP:</strong> {process.env.NEXT_PUBLIC_SHOPIFY_SHOP ? 'Set' : 'Not set'}</p>
              <p><strong>SHOPIFY_STOREFRONT_TOKEN:</strong> {process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ? 'Set' : 'Not set'}</p>
            </div>
            <div>
              <p><strong>ESSENTIALS_SHOP:</strong> ptuev0-g4.myshopify.com</p>
              <p><strong>ESSENTIALS_TOKEN:</strong> {process.env.SHOPIFY_ESSENTIALS_STOREFRONT_ACCESS_TOKEN ? 'Set' : 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Console Logs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Console Logs</h2>
          <p className="text-gray-600">Check the browser console for detailed logs about data fetching and component rendering.</p>
          <button 
            onClick={() => {
              console.log('🔍 Debug Info:', {
                essentialsProducts,
                mainProducts,
                cartCount,
                user,
                authLoading
              });
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Log Debug Info to Console
          </button>
        </div>
      </div>
    </div>
  );
} 