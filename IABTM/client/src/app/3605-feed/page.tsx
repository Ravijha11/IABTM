"use client"

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ModernChatLayout from "@/components/3605 Feed/ModernChatLayout";
import Sidebar from '@/components/Dashboard/Sidebar';
import { useAuthStore } from '@/storage/authStore';
import React, { useState } from 'react';

function page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuthStore();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeItem="IABTM 3605" onNavClick={() => {}} isOpen={sidebarOpen} onClose={closeSidebar}/>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toggle button only visible on mobile */}
        <div className="md:hidden p-4">
          <button onClick={toggleSidebar} className="text-black">
            ☰ Menu
          </button>
        </div>

        <Navbar/>

        {/* Main Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ModernChatLayout />
        </div>
      </div>
    </div>
  )
}

export default page;