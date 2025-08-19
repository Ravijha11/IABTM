'use client';

import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  FerrisWheel,
  ShoppingBag,
  CircleStop,
  MessageSquareMore,
  Radio,
  Newspaper,
  ChartBarBig
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Attributes', icon: FerrisWheel, path: '/admin/attributes' },
  { label: 'Shop', icon: ShoppingBag, path: '/admin/shop' },
  { label: 'Curated media', icon: CircleStop, path: '/admin/curated-media' },
  { label: 'Chats', icon: MessageSquareMore, path: '/admin/chats' },
  { label: 'Radio', icon: Radio, path: '/admin/radio' },
  { label: 'Articles', icon: Newspaper, path: '/admin/articles' },
  { label: 'Polls', icon: ChartBarBig, path: '/admin/polls' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-60 h-screen bg-white h-full shadow-md p-4">
      <nav className="flex flex-col space-y-4">
        {navItems.map(({ label, icon: Icon, path }) => (
          <div
            key={label}
            onClick={() => router.push(path)}
            className={clsx(
              'flex items-center gap-3 p-2 rounded cursor-pointer text-sm font-medium',
              pathname === path ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Icon size={18} />
            {label}
          </div>
        ))}
      </nav>
    </aside>
  );
}
