import React from 'react';

interface PathRowProps {
  index: number;
  idealSelf: string;
  action: string;
  currentSelf: string;
}

const PathRow: React.FC<PathRowProps> = ({ index, idealSelf, action, currentSelf }) => {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center py-4 border-b border-gray-100 w-full">
      {/* Ideal Self */}
      <div className="w-full sm:w-1/3 flex items-center mb-2 sm:mb-0">
        <div className="flex-shrink-0 mr-3">
          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-medium">
            {index}
          </div>
        </div>
        <div className="text-sm">{idealSelf}</div>
      </div>

      {/* Action */}
      <div className="w-full sm:w-1/3 text-sm text-center mb-2 sm:mb-0">
        {action}
      </div>

      {/* Current Self */}
      <div className="w-full sm:w-1/3 text-sm text-right">
        {currentSelf}
      </div>
    </div>
  );
};

export default PathRow;
