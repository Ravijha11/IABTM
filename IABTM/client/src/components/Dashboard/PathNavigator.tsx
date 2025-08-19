"use client";
import { ChevronUp, ChevronDown } from "lucide-react";

interface PathNavigatorProps {
  currentIndex: number;
  totalPaths: number;
  onPathChange: (index: number) => void;
}

const PathNavigator: React.FC<PathNavigatorProps> = ({
  currentIndex,
  totalPaths,
  onPathChange,
}) => {
  const navigateUp = () => {
    if (currentIndex > 0) {
      onPathChange(currentIndex - 1);
    }
  };

  const navigateDown = () => {
    if (currentIndex < totalPaths - 1) {
      onPathChange(currentIndex + 1);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-24 h-16 bg-[#2E2E2E] text-white rounded-lg flex">
        {/* Left side buttons */}
        <div className="flex flex-col justify-between py-2 pl-2">
          <button
            onClick={navigateUp}
            disabled={currentIndex === 0}
            className="p-1 hover:bg-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous path"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={navigateDown}
            disabled={currentIndex === totalPaths - 1}
            className="p-1 hover:bg-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next path"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Right side info */}
        <div className="flex flex-col justify-between py-2 text-right flex-1">
          <span className="text-sm font-medium pr-3">{currentIndex + 1}</span>
          <span className="text-xs text-gray-400 pr-3">of {totalPaths}</span>
        </div>
      </div>
    </div>
  );
};

export default PathNavigator;
