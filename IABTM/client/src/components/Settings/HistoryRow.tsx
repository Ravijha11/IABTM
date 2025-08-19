// components/Settings/HistoryRow.tsx
import React from 'react';
import Link from 'next/link';

interface HistoryRowProps {
  dateRange: string;
  pathsCount: number;
  onViewDetails: (dateRange: string) => void;
}

const HistoryRow: React.FC<HistoryRowProps> = ({ dateRange, pathsCount, onViewDetails }) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200">
      <div className="text-sm font-medium">{dateRange}</div>
      <div className="flex items-center">
        <span className="text-sm text-gray-600 mr-8">{pathsCount} paths</span>
        <button 
          onClick={() => onViewDetails(dateRange)} 
          className="text-blue-500 text-sm"
        >
          Details
        </button>
      </div>
    </div>
  );
};

export default HistoryRow;