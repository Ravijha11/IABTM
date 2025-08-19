// pages/current-paths.tsx
"use client";

import React, { useState } from 'react';
import PathRow from '@/components/Settings/PathRow';
import Link from 'next/link';
import { useAuthStore } from '@/storage/authStore';

interface PathData {
  idealSelf: string;
  action: string;
  currentSelf: string;
}

interface HistoryData {
  dateRange: string;
  pathsCount: number;
  paths?: PathData[];
}

export default function Paths() {
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const { user } = useAuthStore();
  
  const pathsData = user?.curatedPaths

  // const historyData: HistoryData[] = [
  //   {
  //     dateRange: "12/25/2023-01/03/2023",
  //     pathsCount: 4,
  //     paths: pathsData.slice(0, 4)
  //   },
  //   {
  //     dateRange: "12/25/2023-01/03/2023",
  //     pathsCount: 8,
  //     paths: pathsData.slice(0, 8)
  //   },
  //   {
  //     dateRange: "12/25/2023-01/03/2023",
  //     pathsCount: 8,
  //     paths: pathsData.slice(0, 8)
  //   },
  //   {
  //     dateRange: "12/25/2023-01/03/2023",
  //     pathsCount: 2,
  //     paths: pathsData.slice(0, 2)
  //   },
  // ];

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    setExpandedHistory(null);
  };

  const toggleHistoryDetails = (dateRange: string) => {
    setExpandedHistory(prev => (prev === dateRange ? null : dateRange));
  };

  return (
    <div className="mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-8">Your current paths</h1>

      <div className="max-w-4xl">
        <div className="mb-4 flex text-sm text-gray-600">
          <div className="w-1/3">I am</div>
          <div className="w-1/3 text-center">Better than</div>
          <div className="w-1/3 text-right">Me</div>
        </div>

        <div className="border-t border-gray-200">
          {pathsData?.map((path, index) => (
            <PathRow
              key={index}
              index={index + 1}
              idealSelf={path.selfImagine}
              action={path.betterThrough}
              currentSelf={path.currentImagine}
            />
          ))}
        </div>
      </div>

      {/* Accordion Trigger */}
      {/* <div className="mt-8 flex">
        <button
          onClick={toggleHistory}
          className="text-blue-500 text-sm flex items-center cursor-pointer"
        >
          <span>{showHistory ? "Hide paths history" : "Your paths history"}</span>
          <svg
            className={`w-4 h-4 ml-1 transform transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div> */}

      {/* Accordion Content */}
      {/* {showHistory && (
        <div className="max-w-4xl mt-6">
          {historyData.map((history, index) => (
            <div key={index} className="border-b border-gray-200">
              <div className="flex items-center justify-between py-4">
                <div className="text-sm font-medium">{history.dateRange}</div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-8">{history.pathsCount} paths</span>
                  <button
                    onClick={() => toggleHistoryDetails(history.dateRange)}
                    className="text-blue-500 text-sm"
                  >
                    Details
                  </button>
                </div>
              </div>

              {expandedHistory === history.dateRange && (
                <div className="pb-6">
                  <div className="pt-2 pb-4">
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-medium">Your path, {history.dateRange}</h2>
                    </div>

                    <div className="mb-4 flex text-sm text-gray-600">
                      <div className="w-1/3">I am</div>
                      <div className="w-1/3 text-center">Better than</div>
                      <div className="w-1/3 text-right">Me</div>
                    </div>

                    <div className="border-t border-gray-200">
                      {history.paths?.map((path, pathIndex) => (
                        <PathRow
                          key={pathIndex}
                          index={pathIndex + 1}
                          idealSelf={path.idealSelf}
                          action={path.action}
                          currentSelf={path.currentSelf}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
}
