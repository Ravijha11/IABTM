'use client';

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ShoppingCart, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { useAllProducts } from "@/hooks/useAllProducts";
import ProductCard from "@/components/Shop/ProductCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Shop() {
  const { data: products, isLoading, isError } = useAllProducts(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([1, 10000]);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const productsPerPage = 10;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setPriceRange([1, value]);
    setCurrentPage(1);
  };

  const filteredPriceProducts = useMemo(() => {
    if (!products) return [];
  
    return products.filter((product: any) => {
      const price = parseFloat(product.price || "0");
      return price >= priceRange[0] && price <= priceRange[1];
    });
  }, [products, priceRange]);

  const sortedProducts = useMemo(() => {
    const products = [...filteredPriceProducts];
    products.sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    });
    return products;
  }, [filteredPriceProducts, sortOrder]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  const currentProducts = useMemo(() => {
    return sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  }, [sortedProducts, currentPage]);
  
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  
  return (
    <div>
      <Navbar />
      <div className="flex min-h-screen">
        <div className="flex-1">
          {/* Shop Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <Link href="/" className="text-xl font-bold text-gray-900">
                    IABTM Shop
                  </Link>
                </div>

                <div className="flex-1 max-w-lg mx-8">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Bell className="h-6 w-6" />
                  </button>
                  <Link href="/cart" className="p-2 text-gray-400 hover:text-gray-600 relative">
                    <ShoppingCart className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      0
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Content */}
          <div className="flex">
            {/* Filters Sidebar */}
            {filtersVisible && (
              <aside className="w-[220px] border-r border-[#efefef] p-4">
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Price</h3>
                  <div className="relative pt-1">
                    <input
                      type="range"
                      min="1"
                      max="10000"
                      defaultValue={priceRange[1]}
                      onChange={handlePriceChange}
                      className="w-full h-1 bg-[#efefef] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#8f8f8f] mt-1">
                      <span>$1</span>
                      <span>$10,000</span>
                    </div>
                    <p className="text-sm text-[#4f4f4f] mb-2">
                      Under: <span className="font-medium">${priceRange[1]}</span>
                    </p>
                  </div>
                </div>
              </aside>
            )}

            {/* Main Content */}
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setFiltersVisible((prev) => !prev)} 
                  className="flex items-center space-x-2 px-3 py-2 hover:font-medium rounded-full transition"
                >
                  <span className="mr-2 hover:font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="21" x2="4" y2="14"></line>
                      <line x1="4" y1="10" x2="4" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12" y2="3"></line>
                      <line x1="20" y1="21" x2="20" y2="16"></line>
                      <line x1="20" y1="12" x2="20" y2="3"></line>
                      <line x1="1" y1="14" x2="7" y2="14"></line>
                      <line x1="9" y1="8" x2="15" y2="8"></line>
                      <line x1="17" y1="16" x2="23" y2="16"></line>
                    </svg>
                  </span>
                  Filters
                </button>

                <div className="relative">
                  <button
                    onClick={() => setSortOpen((prev) => !prev)}
                    className="flex items-center text-sm text-gray-400 hover:text-gray-800 transition"
                  >
                    <span className="mr-1">Sort by:</span>
                    <span className="text-gray-800 font-medium">
                      {sortOrder === "asc" ? "Low to High" : "High to Low"}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
                  </button>

                  {sortOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 shadow-lg rounded-md z-20">
                      <button 
                        onClick={() => { setSortOrder("asc"); setSortOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Price: Low to High
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("desc");
                          setSortOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Price: High to Low
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading products...</p>
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center h-64">
                  <p>Error loading products. Please try again later.</p>
                </div>
              ) : !currentProducts || currentProducts.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p>No products found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentProducts.map((product: any) => (         
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      description={product.description}
                      imageUrl={product.image}
                      price={product.price}
                      handle={product.handle}
                      variantId={product.variantId}
                      storeType="main"
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center text-[#8f8f8f] hover:text-[#2e2e2e] disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNum = index + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full ${
                          currentPage === pageNum
                            ? "bg-[#2f80ed] text-white"
                            : "text-[#8f8f8f] hover:text-[#2e2e2e]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center text-[#8f8f8f] hover:text-[#2e2e2e] disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 