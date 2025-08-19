import Image from "next/image";
import { useCart } from "../../context/Cart";
import Link from "next/link";
import { useEffect, useState } from "react";
import CartPopUpModal from "@/app/shop/components/CartPopUpModal";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  price: string;
  handle: string;
  variantId?: string;
  storeType?: 'main' | 'essentials';
}

export default function ProductCard({
  id,
  title,
  description,
  imageUrl,
  price,
  handle,
  variantId,
  storeType = 'main',
}: ProductCardProps) {
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
      storeType,
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
    <div className="flex flex-col border rounded-lg shadow p-4 hover:shadow-md transition">
      <Link href={`/shop/${encodeURIComponent(id)}`}>
      <div className="relative w-full h-48 mb-3">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          fill
          className="rounded object-cover"
        />
      </div>
      <h3 className="font-medium text-sm mb-1 w-full truncate">{title}</h3>
      <p className="text-xs text-gray-500 mb-2 w-full truncate">{description || "No description available"}</p>
      <p className="font-semibold text-sm mb-2">${price}</p>
      {storeType && (
        <p className="text-xs text-blue-500 mb-2">
          {storeType === 'essentials' ? 'Essentials Store' : 'Main Store'}
        </p>
      )}
      </Link>
      <button 
        onClick={handleAddToCart}
        className="bg-[#333333] text-white text-sm py-2 rounded-full hover:bg-black transition-colors"
      >
        Add to cart
      </button>
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
