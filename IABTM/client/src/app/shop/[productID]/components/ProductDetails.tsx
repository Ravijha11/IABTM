import React from "react";
import { useCart } from "@/context/Cart"; // Adjust path as necessary
import Link from "next/link";

interface ProductDetailsProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    image: string;
    images?: string[];
    altText?: string;
  };
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, quantity, setQuantity }) => {
  const { handleAddToCartWithAuth } = useCart();

  const increase = () => setQuantity(prev => prev + 1);
  const decrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    handleAddToCartWithAuth(product, quantity);
  };

  return (
    <div className="flex flex-col md:flex-row m-8 mt-5 gap-8">
      {/* Image Section */}
      <div className="flex flex-col w-full md:w-[520px]">
        <div className="w-full h-[300px] md:h-[520px] rounded-xl flex items-center justify-center bg-gray-300 overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Product Details Section */}
      <div className="flex flex-col gap-5 w-full">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-4">{product.title}</h1>
          <p className="text-sm text-gray-700 mb-4 max-w-3xl">{product.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-x-4 sm:gap-x-20 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Price</p>
            <span className="text-xl sm:text-2xl font-semibold text-gray-900">${product.price}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Quantity</p>
            <div className="flex items-center rounded-md overflow-hidden w-fit">
              <button onClick={decrease} className="w-10 h-10 text-xl text-gray-700 hover:bg-gray-100 transition">
                −
              </button>
              <div className="w-10 h-10 flex items-center justify-center text-lg font-medium">
                {quantity}
              </div>
              <button onClick={increase} className="w-10 h-10 text-xl text-gray-700 hover:bg-gray-100 transition">
                +
              </button>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="bg-[#333333] text-white w-[220px] h-[64px] text-xl font-medium py-2 rounded-full hover:bg-black transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
