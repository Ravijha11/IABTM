'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import ProgressCard from '@/components/Dashboard/Progress';
import Header from '../shop/components/Header';
import Shop from '../shop/page';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import { useRouter, useSearchParams } from 'next/navigation';
import MediaLibrary from '@/components/curated-media/MediaLibrary';
import Home from '@/pages/Dashboard/Home';
import Blogs from '@/components/blogs/page';
import Settings from "@/pages/UserSettings/Settings";
import People from '@/components/people/page';
import FeedPage from '@/pages/Feed/page';
import EssentialsSection from '@/components/Essentials/EssentialsSection';
import { useAuthStore } from '@/storage/authStore';

const Page: React.FC = () => {
  const [showProgress, setShowProgress] = useState(false);
  const [activeSection, setActiveSection] = useState('Home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState('Feed');
  const { user, loading } = useAuthStore();
  const searchParams = useSearchParams();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // Get the current curated path for progress display
  const currentPath = user?.curatedPaths?.[0] || null;

  useEffect(() => {
    if (!searchParams) return;
    const section = searchParams.get('section');
    if (section) setActiveSection(section);
  }, [searchParams]);

  // Check if we should hide progress panels (only hide for Chat Room tab)
  const shouldHideProgress = activeSection === 'IABTM 3605' && activeFeedTab === 'Chats Room';

  const renderContent = () => {
    switch (activeSection) {
      case 'Home':
        return <Home/>;
      case 'People':
        return <People/>;
      case 'Experts':
        return <div>✅ Experts Component</div>;
      case 'Artists':
        return <div>🎨 Artists Component</div>;
      case 'Essentials':
        return <EssentialsSection />;
      case 'Blog':
        return <Blogs/>;
      case 'Settings':
        return <Settings/>
      case 'IABTM 3605':
        return <FeedPage onTabChange={setActiveFeedTab} />;
      case 'Curated Media':
        return <MediaLibrary />;
      case 'Shop':
        return <Shop />;
      default:
        return <div>Select a section from the sidebar.</div>;
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeItem={activeSection} onNavClick={setActiveSection} isOpen={sidebarOpen} onClose={closeSidebar}/>

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Toggle button only visible on mobile */}
        <div className="md:hidden p-4">
          <button onClick={toggleSidebar} className="text-black">
            ☰ Menu
          </button>
        </div>

        {/* Progress Toggle Button - Hide only for Chat Room tab */}
        {!shouldHideProgress && (
          <button 
            onClick={() => setShowProgress(!showProgress)} 
            className="absolute right-2 top-2 z-10 md:hidden bg-black text-white p-2 rounded-full shadow-md hover:bg-gray-800 transition-colors"
          >
            {showProgress ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}

        <Header headName={activeSection} link=""/>

        <div className="flex gap-6 flex-wrap flex-1 p-4">
          <div className="flex-1">
            {renderContent()}
          </div>

          {/* Desktop Progress Panel - Hide only for Chat Room tab */}
          {!loading && !shouldHideProgress && (
            <div className="hidden xl:block flex-shrink-0">
              <ProgressCard currentPath={currentPath} />
            </div>
          )}

          {/* Progress Panel - Hide only for Chat Room tab */}
          {showProgress && !loading && !shouldHideProgress && (
            <div className="w-full mt-6 md:w-auto xl:hidden">
              <ProgressCard currentPath={currentPath} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
