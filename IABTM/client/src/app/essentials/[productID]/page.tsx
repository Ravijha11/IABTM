'use client';

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useEssentialsProducts } from "@/hooks/useEssentialsProducts";
import { useCart } from "@/context/Cart";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ShoppingCart, Heart, Share2, Star } from "lucide-react";
import Header from "../../shop/components/Header";
import ProductDetails from "../../shop/[productID]/components/ProductDetails";
import Description from "../../shop/[productID]/components/Description";
import FeaturedProducts from "../../shop/[productID]/components/FeaturedProducts";
import Payments from "../../shop/[productID]/components/Payments";
import CartPopUpModal from "../../shop/components/CartPopUpModal";

export default function EssentialsProductPage() {
  const params = useParams();
  const productId = params?.productID ? decodeURIComponent(params.productID as string) : '';
  const { data: products } = useEssentialsProducts(100);
  const { handleAddToCartWithAuth } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  // Find the current product
  const product = products?.find((p: any) => p.id === productId);

  // Get featured products (excluding current product)
  const featuredProducts = products?.filter((p: any) => p.id !== productId).slice(0, 4) || [];

  const handleAddToCart = () => {
    if (product) {
      handleAddToCartWithAuth({
        id: product.id,
        title: product.title,
        description: product.description,
        image: product.image,
        price: parseFloat(product.price),
        quantity: quantity,
        storeType: 'essentials',
      });
      setShowPopup(true);
    }
  };

  useEffect(() => {
    if (showPopup) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [showPopup]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header headName="Product Not Found" link="" />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Product not found</div>
        </div>
      </div>
    );
  }

  const images = [product.image]; // You can expand this to include multiple images

  return (
    <>
      <Header headName={product.title} link="/essentials" />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative w-full h-96 lg:h-[500px]">
                <Image
                  src={images[selectedImage]}
                  alt={product.title}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
              
              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="flex space-x-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden ${
                        selectedImage === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">(4.5 out of 5)</span>
                </div>
              </div>

              <div className="text-3xl font-bold text-gray-900">
                ${parseFloat(product.price).toFixed(2)}
              </div>

              <p className="text-gray-600">{product.description}</p>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Add to Cart
                </button>
                <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Product Details Component */}
              <ProductDetails
                product={{
                  id: product.id,
                  title: product.title,
                  description: product.description,
                  price: parseFloat(product.price),
                  image: product.image,
                  images: images,
                  altText: product.altText,
                }}
                quantity={quantity}
                setQuantity={setQuantity}
              />

              {/* Payments Component */}
              <Payments />
            </div>
          </div>

          {/* Description Section */}
          <div className="mt-16">
            <Description product={product} />
          </div>

          {/* Featured Products */}
          <div className="mt-16">
            <FeaturedProducts products={featuredProducts} />
          </div>
        </div>
      </div>

      {showPopup && (
        <CartPopUpModal
          title={product.title}
          price={product.price}
          imageUrl={product.image}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
} 