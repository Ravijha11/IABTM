'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuthStore } from '../storage/authStore'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

export interface Product {
  id: string
  title: string
  description: string
  image: string
  price: number
  quantity?: number
  variantId?: string
  storeType?: 'main' | 'essentials'
  imageUrl?: string
}

interface CartContextType {
  cartItems: Product[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartCount: number
  getCartByStoreType: (storeType: 'main' | 'essentials') => Product[]
  handleAddToCartWithAuth: (product: Product, quantity?: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<Product[]>([])
  const { user, loading } = useAuthStore()
  const router = useRouter()

  // Load from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('cart')
    if (storedCart) {
      setCartItems(JSON.parse(storedCart))
    }
  }, [])

  // Save to localStorage on cart change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0)

  const addToCart = (product: Product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 0) + quantity }
            : item
        )
      }
      return [...prev, { ...product, quantity }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => setCartItems([])

  const getCartByStoreType = (storeType: 'main' | 'essentials') => {
    return cartItems.filter(item => item.storeType === storeType)
  }

  const handleAddToCartWithAuth = (product: Product, quantity = 1) => {
    // Check if user is logged in
    if (!user) {
      // Show notification and redirect to sign-in page
      toast.info('Please sign in to add items to your cart')
      router.push('/sign-in')
      return
    }
    
    // If user is logged in, proceed with adding to cart
    addToCart(product, quantity)
    toast.success('Item added to cart successfully!')
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        getCartByStoreType,
        handleAddToCartWithAuth,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
