'use client';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fa]">
      {/* Header spans full width */}
      <Header />

      {/* Content: sidebar + main */}
      <div className="flex flex-1 h-screen">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
