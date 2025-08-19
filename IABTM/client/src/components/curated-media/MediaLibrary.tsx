import { useState } from "react";
import { Video, Music, CakeSlice, FilePenLine, Image, Building2 } from "lucide-react";
import MusicContent from "./MusicContent";
import FilmContent from "./FilmContent";
import EditorialContent from "./Music/EditorialContent";

const tabs = [
  { id: 'film', label: 'Film', icon: Video },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'art', label: 'Art', icon: CakeSlice },
  { id: 'editorial', label: 'Editorial', icon: FilePenLine },
  { id: 'print', label: 'Print', icon: Image },
  { id: 'animation', label: 'Animation', icon: Building2 },
];

export default function Library() {
  const [activeTab, setActiveTab] = useState('film');

  const renderContent = () => {
    switch (activeTab) {
      case 'music':
        return <MusicContent setActiveSection={() => {}} />;
      case 'film':
        return <FilmContent />;
      case 'art':
        return <div className="text-gray-500 text-xl">Art content coming soon...</div>;
      case 'editorial':
        return <EditorialContent />;
      case 'print':
        return <div className="text-gray-500 text-xl">Print content coming soon...</div>;
      case 'animation':
        return <div className="text-gray-500 text-xl">Animation content coming soon...</div>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 font-sans">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 text-gray-400 w-full border-b border-gray-200">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center p-4 text-md gap-2 transition-colors hover:bg-gray-50 ${
                activeTab === tab.id ? 'bg-gray-100 text-black' : 'hover:text-gray-600'
              }`}
            >
              <IconComponent width="15px" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Content */}
      {renderContent()}
    </div>
  );
}
