'use client';
import React from 'react';
import {
  Home,
  Users,
  UserCheck,
  Brush,
  LayoutDashboard,
  ShoppingCart,
  Power,
  Instagram,
  Facebook,
  Twitter,
  Settings,
  Film,
  Share2
} from 'lucide-react';
import { useAuthStore } from '@/storage/authStore';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/useLogout';


type SidebarProps = {
  activeItem: string;
  onNavClick: (label: string) => void;
  isOpen: boolean;
  onClose: () => void;
};


const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavClick, isOpen, onClose }) => {
  const { user, setUser } = useAuthStore()
  const router = useRouter();
  const { logout } = useLogout();
  const topNavItems = [
    { icon: <Home size={18} />, label: 'Home' },
    { icon: <Users size={18} />, label: 'People' },
    { icon: <UserCheck size={18} />, label: 'Experts' },
    { icon: <Brush size={18} />, label: 'Artists' },
    // settings 
    { icon: <Settings size={18} />, label: 'Settings' },
    { icon: <Film  size={18} />, label: 'Curated Media' },
    { icon: <Share2 size={18} />, label: 'IABTM 3605' },
    { icon: <ShoppingCart size={18} />, label: 'Essentials' },
  ];

  const bottomNavItems = [
    { icon: '', label: 'IABTM Podcast' },
    { icon: '', label: 'Shop' },
    { icon: '', label: 'Blog' },
    { icon: '', label: 'Contact us' },
  ];

  // Logout handler
  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-opacity-10 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 left-0 z-50 w-64 h-screen bg-white border-r shadow-sm p-4 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0 md:block`}>
        <div className='h-full overflow-y-auto pr-2 scrollbar-hide'>
          <div className="text-center mb-6">
            <img src="https://c.animaapp.com/m8nag6vuQg1Dnq/img/frame-217.svg" alt="brand_logo" className='w-[99px] h-[44px] mt-4 mx-auto' />
            <img src={user?.profilePicture} alt="Profile" className="w-[100px] h-[100px] rounded-full mx-auto mt-3 object-cover border" />
            <p className="font-semibold text-md mt-5">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.profileName}</p>
            <hr className='mt-5' />
          </div>

          <nav className="space-y-3">
            {topNavItems.map(({ icon, label }) => (
              <NavItem
                key={label}
                icon={icon}
                label={label}
                active={activeItem === label}
                onClick={() => onNavClick(label)}
              />
            ))}

            <hr className="my-4" />

            {bottomNavItems.map(({ icon, label }) => (
              <NavItem
                key={label}
                icon={icon}
                label={label}
                active={activeItem === label}
                onClick={() => onNavClick(label)}
              />
            ))}
          </nav>

          <hr className='mt-5' />
          <div className="mt-6 text-xs text-gray-400 space-y-5">
            <p>Cookie notice</p>
            <p>Privacy policy</p>
            <p>Terms of service</p>
          </div>
          <hr className='mt-5' />

          {/* Logout */}
          <div className="mt-5">
            <NavItem icon={<Power size={18} />} label="Logout" active={false} onClick={handleLogout} />
          </div>
          <hr className='mt-5' />

          {/* Social Media */}
          <div className='mt-5 mb-25 flex gap-5 justify-center text-gray-400'>
            <Instagram size="18" />
            <Facebook size="18" />
            <Twitter size="18" />
          </div>
        </div>
      </aside>
    </>
  );
};

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <div
    className={`flex items-center gap-3 text-md cursor-pointer transition px-3 py-2 ${active ? 'text-black border-l-4 border-gray-400 bg-gray-50' : 'text-gray-400 hover:text-black'
      }`}
    onClick={onClick}
  >
    {icon}
    {label}
  </div>
);

export default Sidebar;
