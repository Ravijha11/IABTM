import Image from "next/image";
import { useCart } from "../../context/Cart";
import Link from "next/link";
import { useEffect, useState } from "react";
import CartPopUpModal from "@/app/shop/components/CartPopUpModal";

interface EssentialsProductCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  price: string;
  handle: string;
  variantId?: string;
}

export default function EssentialsProductCard({
  id,
  title,
  description,
  imageUrl,
  price,
  handle,
  variantId,
}: EssentialsProductCardProps) {
  const { handleAddToCartWithAuth } = useCart();
  const [showPopup, setShowPopup] = useState(false);

  const handleAddToCart = () => {
    handleAddToCartWithAuth({
      id,
      title,
      description,
      image: imageUrl || "",
      imageUrl: imageUrl || undefined,
      price: parseFloat(price),
      quantity: 1,
      variantId,
      storeType: 'essentials',
    });
    setShowPopup(true);
  };
  
  useEffect(() => {
    if (showPopup) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [showPopup]);

  
  return (
    <>
    <div className="product-card flex flex-col border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 bg-white overflow-hidden group">
      <Link href={`/essentials/${encodeURIComponent(id)}`} className="flex-1">
        <div className="product-image relative w-full h-56 sm:h-64 md:h-56 lg:h-64">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">{title}</h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{description || "No description available"}</p>
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-xl text-gray-900">${price}</p>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">Essentials</span>
          </div>
        </div>
      </Link>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <button 
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-semibold py-3 px-4 rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
        >
          Add to cart
        </button>
      </div>
    </div>

      {showPopup && (
        <CartPopUpModal
          title={title}
          price={price}
          imageUrl={imageUrl || "/placeholder.svg"}
          onClose={() => setShowPopup(false)}
        />
      )}

    </>
  );
} 