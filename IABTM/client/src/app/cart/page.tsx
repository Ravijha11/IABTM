'use client'

import { useCart } from '../../context/Cart'
import { useAuthStore } from '../../storage/authStore'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import Image from 'next/image'
import Link from 'next/link'
import Header from '../shop/components/Header'
import { Trash2 } from 'lucide-react'
import { generateCheckoutUrl } from '../../lib/shopify/storeFront'
import { generateEssentialsCheckoutUrl } from '../../lib/shopify/essentialsStoreFront'
import { useState } from "react";

function ShopPasswordNotice() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("iabtm");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-white/80 via-yellow-50 to-yellow-100/80 backdrop-blur-lg border border-yellow-200 shadow-2xl rounded-3xl px-5 py-5 mb-10 max-w-full sm:max-w-xl mx-auto transition-all duration-300">
      {/* Floating lock icon */}
      <div className="flex-shrink-0 self-start sm:self-center">
        <div className="relative">
          <div className="absolute -inset-2 rounded-full bg-yellow-300 blur-lg opacity-60 animate-pulse"></div>
          <div className="relative z-10 bg-yellow-400 rounded-full p-4 shadow-lg border-2 border-white">
            <svg className="w-8 h-8 text-yellow-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v.01M17 10V7a5 5 0 00-10 0v3M5 10h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-bold text-lg sm:text-xl text-gray-900 tracking-tight">Shopify Store Password</span>
          <span className="group relative cursor-pointer">
            <svg className="w-4 h-4 text-gray-400 hover:text-yellow-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16h.01M12 8v4" />
            </svg>
            <span className="absolute left-1/2 -translate-x-1/2 top-8 z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg">
              You'll need this password to enter the shop on the next page.
            </span>
          </span>
        </div>
        <div className="text-sm sm:text-base text-gray-700 mb-3 break-words text-center sm:text-left">
          Copy this password to enter the shop on the next page.
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <span
            className="relative font-mono text-base sm:text-lg bg-gray-100 border border-yellow-300 px-5 py-2 rounded-xl shadow-inner select-all tracking-wider cursor-pointer hover:bg-yellow-50 transition group"
            onClick={handleCopy}
            title="Click to copy"
          >
            iabtm
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition">
              Click to copy
            </span>
          </span>
          <button
            onClick={handleCopy}
            className={`transition-all duration-200 flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-base
              ${copied
                ? 'bg-green-500 text-white shadow-lg scale-105'
                : 'bg-yellow-300 text-yellow-900 hover:bg-yellow-400 shadow'
              }`}
            aria-label="Copy password"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="animate-fade-in">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <rect x="3" y="3" width="13" height="13" rx="2" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartByStoreType } = useCart()
  const { user } = useAuthStore()
  const router = useRouter()

  const mainStoreItems = getCartByStoreType('main')
  const essentialsItems = getCartByStoreType('essentials')

  const mainStoreTotal = mainStoreItems.reduce(
    (acc, item) => acc + item.price * (item.quantity ?? 1),
    0
  )

  const essentialsTotal = essentialsItems.reduce(
    (acc, item) => acc + item.price * (item.quantity ?? 1),
    0
  )

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * (item.quantity ?? 1),
    0
  )

  const increment = (id: string, qty: number) => updateQuantity(id, qty + 1)
  const decrement = (id: string, qty: number) => {
    if (qty > 1) updateQuantity(id, qty - 1)
  }

  const handleMainStoreCheckout = () => {
    if (!user) {
      toast.info('Please sign in to proceed to checkout')
      router.push('/sign-in')
      return
    }
    
    if (mainStoreItems.length === 0) {
      alert('No items from the main store in your cart')
      return
    }
    
    try {
      const checkoutUrl = generateCheckoutUrl(mainStoreItems, 'main')
      if (checkoutUrl === '#') {
        toast.error('Shopify configuration is missing. Please contact support.')
        return
      }
      window.open(checkoutUrl, '_blank')
    } catch (error) {
      console.error('Error generating checkout URL:', error)
      toast.error('Unable to proceed to checkout. Please try again.')
    }
  }

  const handleEssentialsCheckout = () => {
    if (!user) {
      toast.info('Please sign in to proceed to checkout')
      router.push('/sign-in')
      return
    }
    
    if (essentialsItems.length === 0) {
      alert('No items from the essentials store in your cart')
      return
    }
    
    try {
      const checkoutUrl = generateEssentialsCheckoutUrl(essentialsItems)
      window.open(checkoutUrl, '_blank')
    } catch (error) {
      console.error('Error generating checkout URL:', error)
      toast.error('Unable to proceed to checkout. Please try again.')
    }
  }

  const handleCombinedCheckout = () => {
    if (!user) {
      toast.info('Please sign in to proceed to checkout')
      router.push('/sign-in')
      return
    }
    
    if (cartItems.length === 0) {
      alert('Your cart is empty')
      return
    }
    
    // If we have items from both stores, we need to handle them separately
    if (mainStoreItems.length > 0 && essentialsItems.length > 0) {
      alert('You have items from both stores. Please checkout from each store separately.')
      return
    }
    
    // If only main store items
    if (mainStoreItems.length > 0) {
      handleMainStoreCheckout()
      return
    }
    
    // If only essentials items
    if (essentialsItems.length > 0) {
      handleEssentialsCheckout()
      return
    }
  }
    
    // console.log(cartItems)

  return (
    <>
      <Header headName="Cart" link="" />

      {/* Desktop View */}
      <div className="hidden md:block px-6 m-10">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-4">
            <thead className="text-left text-sm text-gray-500">
              <tr>
                <th className="font-medium">Item</th>
                <th className="font-medium">Quantity</th>
                <th className="font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="py-4">
                    <div className="flex items-center gap-4">
                    <Link href={`/shop/${encodeURIComponent(item.id)}`} className="flex-shrink-0">
                      <Image
                        src={item.imageUrl || item.image}
                        alt={item.title}
                        width={60}
                        height={60}
                        className="rounded object-cover"
                      /></Link>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-500">${Number(item.price).toFixed(2)}</p>
                        {item.storeType && (
                          <p className="text-xs text-blue-500">
                            {item.storeType === 'essentials' ? 'Essentials Store' : 'Main Store'}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="inline-flex items-center gap-2 bg-gray-100 rounded-md">
                      <button
                        onClick={() => decrement(item.id, item.quantity ?? 1)}
                        className="px-2 py-1 rounded cursor-pointer"
                      >–</button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => increment(item.id, item.quantity ?? 1)}
                        className="px-2 py-1 rounded cursor-pointer"
                      >+</button>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-between">
                      <span>${(item.price * (item.quantity ?? 1)).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-4 text-red-500 hover:text-red-600"
                      >
                        <Trash2 size="20px"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subtotal and Checkout */}
        <div className="flex justify-end mt-8">
            <div className="w-full max-w-xs space-y-2 text-right">
              <ShopPasswordNotice />
              <span className='flex justify-between items-center'>
                  <p className='font-thin'>Subtotal: </p>
                <p className="text-gray-700"><strong>${totalPrice.toFixed(2)}</strong></p>
              </span> 
              <span className='flex justify-between items-center'>
                    <p className='font-thin'>Total: </p>
                    <p className="text-gray-700"><strong>${totalPrice.toFixed(2)}</strong></p>                         
              </span>
            <button
              onClick={handleCombinedCheckout}
              className="mt-4 bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 w-full"
            >
              Proceed to checkout
            </button>
            
            {/* Separate checkout buttons if items from both stores */}
            {mainStoreItems.length > 0 && essentialsItems.length > 0 && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleMainStoreCheckout}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 w-full text-sm"
                >
                  Checkout Main Store (${mainStoreTotal.toFixed(2)})
                </button>
                <button
                  onClick={handleEssentialsCheckout}
                  className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 w-full text-sm"
                >
                  Checkout Essentials (${essentialsTotal.toFixed(2)})
                </button>
              </div>
            )}
            
            <button
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-black mt-2 underline"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-4">
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

        {cartItems.length === 0 ? (
          <p className="text-gray-500">
            Your cart is empty.{' '}
            <Link href="/shop" className="text-blue-500 underline">Go shopping</Link>.
          </p>
        ) : (
          <>
            <ShopPasswordNotice />
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start border-b pb-4 mb-4 gap-4"
              >
                <Image
                  src={item.imageUrl || item.image}
                  alt={item.title}
                  width={80}
                  height={80}
                  className="rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-600">${Number(item.price).toFixed(2)}</p>
                  {item.storeType && (
                    <p className="text-xs text-blue-500">
                      {item.storeType === 'essentials' ? 'Essentials Store' : 'Main Store'}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-2 mt-2 bg-gray-100 rounded-md">
                    <button
                      onClick={() => decrement(item.id, item.quantity ?? 1)}
                      className="px-2 py-1 rounded"
                    >–</button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => increment(item.id, item.quantity ?? 1)}
                      className="px-2 py-1 rounded"
                    >+</button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:underline mt-1 ml-5"
                  >
                    <Trash2 size="20px"/>
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 text-right">
              <p className="text-lg font-semibold">Total: ${totalPrice.toFixed(2)}</p>
              <button
                onClick={handleCombinedCheckout}
                className="mt-4 bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 w-full"
              >
                Proceed to checkout
              </button>
              
              {/* Separate checkout buttons if items from both stores */}
              {mainStoreItems.length > 0 && essentialsItems.length > 0 && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleMainStoreCheckout}
                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 w-full text-sm"
                  >
                    Checkout Main Store (${mainStoreTotal.toFixed(2)})
                  </button>
                  <button
                    onClick={handleEssentialsCheckout}
                    className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 w-full text-sm"
                  >
                    Checkout Essentials (${essentialsTotal.toFixed(2)})
                  </button>
                </div>
              )}
              
              <button
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-black mt-2 underline"
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
