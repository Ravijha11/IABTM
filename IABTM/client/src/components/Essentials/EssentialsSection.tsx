'use client';

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ShoppingCart, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { useEssentialsProducts } from "@/hooks/useEssentialsProducts";
import EssentialsProductCard from "./EssentialsProductCard";
import Footer from "@/app/shop/components/Footer";
import { useCart } from "@/context/Cart";

export default function EssentialsSection() {
  const { data: products, isLoading, isError } = useEssentialsProducts(100);
  const { cartCount } = useCart();

  const [priceRange, setPriceRange] = useState([1, 1000]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTheme, setSelectedTheme] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter((product: any) => {
      const price = parseFloat(product.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Apply category filter
    if (selectedCategory !== "All") {
      // You can implement category filtering based on your product structure
    }

    // Apply theme filter
    if (selectedTheme.length > 0) {
      // You can implement theme filtering based on your product structure
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-high":
        filtered.sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "name":
        filtered.sort((a: any, b: any) => a.title.localeCompare(b.title));
        break;
      default:
        // Keep original order for "featured"
        break;
    }

    return filtered;
  }, [products, priceRange, selectedCategory, selectedTheme, sortBy]);

  const categories = ["All", "Books", "Electronics", "Clothing", "Accessories", "Games", "For Kids"];
  const themes = ["Anti-Stress", "Productivity", "Fashion", "Fitness", "Financial Productivity"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading essentials...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error loading essentials products</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="ml-2 sm:ml-4 text-lg sm:text-xl font-semibold text-gray-900">Essentials</h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <Link href="/cart" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 w-full">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 text-gray-900">Price Range</h3>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="1"
                      max="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="font-medium">${priceRange[0]}</span>
                      <span className="font-medium">${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 text-gray-900">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 text-gray-900">Categories</h3>
                  <ul className="space-y-2 text-sm">
                    {categories.map((category) => (
                      <li key={category}>
                        <button
                          onClick={() => setSelectedCategory(category)}
                          className={`text-left w-full p-2 rounded-lg transition-colors ${
                            selectedCategory === category 
                              ? 'font-medium text-blue-600 bg-blue-50' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {category === "All" ? "– All" : category}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Themes */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3 text-gray-900">Themes</h3>
                  <ul className="space-y-2 text-sm">
                    {themes.map((theme) => (
                      <li key={theme} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          id={theme.toLowerCase().replace(' ', '-')}
                          checked={selectedTheme.includes(theme)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTheme([...selectedTheme, theme]);
                            } else {
                              setSelectedTheme(selectedTheme.filter(t => t !== theme));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={theme.toLowerCase().replace(' ', '-')}
                          className="text-gray-700 cursor-pointer hover:text-gray-900"
                        >
                          {theme}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 text-sm sm:text-base font-medium">
                Showing {filteredProducts.length} products
              </p>
            </div>

            {/* Products Grid */}
            <div className="product-grid grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredProducts.map((product: any) => (
                <EssentialsProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  description={product.description}
                  imageUrl={product.image}
                  price={product.price}
                  handle={product.handle}
                  variantId={product.variantId}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 sm:py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters to find what you're looking for.</p>
                  <button 
                    onClick={() => {
                      setPriceRange([1, 1000]);
                      setSelectedCategory("All");
                      setSelectedTheme([]);
                      setSortBy("featured");
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
} 