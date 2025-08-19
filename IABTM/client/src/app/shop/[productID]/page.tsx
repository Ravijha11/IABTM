'use client'

import { useParams } from 'next/navigation'
import { useAllProducts } from '@/hooks/useAllProducts'
import { notFound } from 'next/navigation'
import React, { useState } from 'react'
import Header from '../components/Header'
import FeaturedProducts from './components/FeaturedProducts'
import ProductDetails from './components/ProductDetails'
import Description from './components/Description'
import Payment from './components/Payments'
import Shipping from './components/Shipping'
import Link from 'next/link'
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export default function ProductPage() {
  const params = useParams()
  const encodedId = params?.productID as string
  const productId = decodeURIComponent(encodedId)

  const { data: products, isLoading, isError } = useAllProducts(100)

  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'payment' | 'shipping'>('description')

  if (isLoading) return <div className="p-8 text-lg">Loading...</div>
  if (isError || !products) return <div className="p-8 text-red-500">Failed to load products.</div>

  const product = products.find((p: any) => p.id === productId)
  if (!product) return notFound()

  const featured = products.filter((p: any) => p.id !== productId).slice(0, 20)

  return (
    <>
      <Navbar />
      <Header headName="IABTM Shop" link="/dashboard" />
      <ProductDetails product={product} quantity={quantity} setQuantity={setQuantity} />

      {/* Tab buttons */}
      <div className="flex gap-10 border-b border-gray-200 m-10 mt-6 mb-0">
        {['description', 'payment', 'shipping'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'description' | 'payment' | 'shipping')}
            className={`relative px-6 py-3 text-sm font-medium transition-all duration-200 ease-in-out
              ${
                activeTab === tab
                  ? 'text-black font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black'
                  : 'text-gray-400 hover:text-black'
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="px-8 py-6">
        {activeTab === 'description' && <Description product={product} />}
        {activeTab === 'payment' && <Payment />}
        {activeTab === 'shipping' && <Shipping />}
      </div>

      <FeaturedProducts products={featured} />
      <Footer />
    </>
  )
}
