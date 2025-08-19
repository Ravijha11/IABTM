import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/storage/authStore";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';

interface CartPopupProps {
  title: string;
  price: string;
  imageUrl: string;
  onClose: () => void;
}

export default function CartPopup({ title, price, imageUrl, onClose }: CartPopupProps) {
  const { user } = useAuthStore();
  const router = useRouter();

  const handleProceedToCheckout = () => {
    if (!user) {
      toast.info('Please sign in to proceed to checkout');
      router.push('/sign-in');
      onClose();
      return;
    }
    router.push('/cart');
    onClose();
  };

  return (
    <>
      {/* Overlay that dims the screen */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9998] pointer-events-auto transition-opacity duration-300"></div>

      {/* Popup content */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative pointer-events-auto mx-4">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl p-1 rounded-full hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Added to cart</h2>
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 relative flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
              <p className="text-lg font-semibold mt-1 text-gray-900">${price}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Continue shopping
            </button>
            <button
              onClick={handleProceedToCheckout}
              className="flex-1 bg-gray-900 text-white rounded-lg py-3 px-4 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
