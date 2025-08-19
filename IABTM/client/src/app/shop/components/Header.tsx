import React from 'react';
import { Bell, ShoppingCart } from "lucide-react";
import Link from 'next/link';
import { useCart } from '../../../context/Cart';
import { useAuthStore } from '../../../storage/authStore';

interface HeaderProps {
  headName: string;
  link: string;
  // onBellClick: () => void;
}


export default function Header({ headName, link }: HeaderProps) {
  const { cartCount } = useCart();
  const { user } = useAuthStore();

  return (
    <header className="flex justify-between items-center p-4 border-b border-[#efefef]">
      <Link href={link}>
        <h1 className="text-xl font-semibold cursor-pointer">{headName}</h1>
      </Link>
      <div className="flex items-center gap-4">
        <button className="text-[#8f8f8f] hover:text-[#2e2e2e] cursor-pointer" title="Notifications">
          <Bell className="w-5 h-5" />
        </button>

        <img src={user?.profilePicture} alt="Profile" className="w-6 h-6 rounded-full mx-auto object-cover cursor-pointer" />
        
        <Link href="/cart" >
          <button className="text-[#8f8f8f] hover:text-[#2e2e2e] relative flex items-center" title="Cart">
            <ShoppingCart className="w-5 h-5 cursor-pointer" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#2f80ed] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </Link>
      </div>
    </header>
  );
}

