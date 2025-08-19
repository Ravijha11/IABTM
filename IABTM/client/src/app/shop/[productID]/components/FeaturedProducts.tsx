import Link from 'next/link'
import React from 'react'

interface Product {
  id: string;
  image: string;
  title: string;
  description: string;
  price: number;
}

interface FeaturedProductsProps {
  products?: Product[];
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products = [] }) => {
  if (!products.length) return null

  return (
    <div className="my-12 px-8">
      <h2 className="text-[21px] font-semibold mb-4 mt-4">Featured Products</h2>

      <div className="flex overflow-x-auto gap-4 pb-2">
        {products.map((product, index) => (
          <Link key={product.id || index} href={`/shop/${encodeURIComponent(product.id)}`} className="no-underline text-gray-900">
            <div className="w-[250px] h-[430px] min-w-[250px] p-4 hover:shadow-lg hover:rounded-xl transition flex-shrink-0 overflow-hidden">
              <div className="w-[250px] h-[250px] bg-gray-100 overflow-hidden mb-4 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
             </div>

              <h3 className="text-[14px] font-thin">{product.title}</h3>
              <p className="text-[16px] font-light text-gray-600 mb-1 truncate">{product.description}</p>
              <span className="text-[21px] font-bold text-gray-800">${product.price}</span>
              <div className="flex justify-center mt-3">
                <button className="bg-[#333333] text-white text-lg font-medium py-2 px-6 rounded-full hover:bg-black transition-colors w-[200px] h-[44px]">
                  Add to cart
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default FeaturedProducts
