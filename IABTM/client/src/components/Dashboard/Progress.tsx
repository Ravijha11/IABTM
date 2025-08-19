'use client';
import React from 'react';
import {
  Film,
  UserCheck,
  Compass,
  Moon,
  PhoneOff,
} from 'lucide-react';
import { useAuthStore } from '@/storage/authStore';
import { CuratedPath } from '@/types/userType';

interface ProgressCardProps {
  currentPath: CuratedPath | null;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ currentPath }) => {
  const { user } = useAuthStore();

  // If no user or no current path, show a placeholder
  if (!user || !currentPath) {
    return (
      <div className="bg-[#2E2E2E] text-white p-6 rounded-xl w-90 h-full max-w-md shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-[50px] h-[50px] rounded-full bg-gray-600 animate-pulse"></div>
          <div className="text-sm">
            <div className="text-gray-400">Loading progress...</div>
            <div className="font-semibold text-lg leading-tight text-gray-300">
              No path data available
            </div>
          </div>
        </div>
        <hr className="border-gray-700 my-4" />
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Film size={18} />
              <span>Curated Media</span>
            </div>
            <span className="text-xs text-gray-500">0 of 0</span>
          </div>
        </div>
      </div>
    );
  }

  console.log("user in progress", user);
  console.log("currentPath in progress", currentPath);
  
  return (
    <div className="bg-[#2E2E2E] text-white p-6 rounded-xl w-90 h-full max-w-md shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <img 
          src={user?.profilePicture || "/default-profile.svg"} 
          alt="Avatar" 
          className="w-[50px] h-[50px] rounded-full mx-auto mt-3 object-cover" 
        />
        <div className="text-sm">
          <div>You're currently at</div>
          <div className="font-semibold text-lg leading-tight">
            {user?.pathDay || 0} days on path {currentPath.selfImagine} to Completely {currentPath.currentImagine} through {currentPath.betterThrough}
          </div>
        </div>
      </div>

      <hr className="border-gray-700 my-4" />

      {/* Progress Items */}
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <ProgressItem 
            icon={<Film size={18} />} 
            label="Curated Media" 
            progress={`${currentPath.contentFinished || 0} of ${currentPath.numberOfContent || 0}`} 
          />
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ 
                width: `${currentPath.numberOfContent > 0 ? ((currentPath.contentFinished || 0) / currentPath.numberOfContent) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 text-right">
            {currentPath.numberOfContent > 0 ? Math.round(((currentPath.contentFinished || 0) / currentPath.numberOfContent) * 100) : 0}% Complete
          </div>
        </div>
        {/* <ProgressItem icon={<UserCheck size={18} />} label="Expert consultation" progress="0 of 4" /> */}
      </div>

      <hr className="border-gray-700 my-4" />

      {/* Suggested Activities */}
      {/* <div>
        <h3 className="text-sm text-gray-400 mb-2">Suggested activities</h3>
        <h2 className="text-lg font-semibold mb-4">Give it a shot</h2>
        <div className="space-y-4">
          <Suggestion
            icon={<Compass className="text-green-400" size={24} />}
            label="Go Xamping"
            type="Outdoor activities"
          />
          <Suggestion
            icon={<Moon className="text-indigo-400" size={24} />}
            label="Watch Night Sky"
            type="Outdoor activities"
          />
          <Suggestion
            icon={<PhoneOff className="text-pink-400" size={24} />}
            label="Social media day-off"
            type="Indoor activities"
          />
        </div>
      </div> */}
    </div>
  );
};

const ProgressItem: React.FC<{ icon: React.ReactNode; label: string; progress: string }> = ({
  icon,
  label,
  progress,
}) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2 text-sm text-gray-200">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-xs text-gray-400">{progress}</span>
  </div>
);

const Suggestion: React.FC<{ icon: React.ReactNode; label: string; type: string }> = ({
  icon,
  label,
  type,
}) => (
  <div className="flex items-center gap-4">
    <div className="bg-gray-800 p-2 rounded-lg">{icon}</div>
    <div>
      <div className="text-xs text-gray-400">{type}</div>
      <div className="text-sm font-semibold">{label}</div>
    </div>
  </div>
);

export default ProgressCard;