// pages/path-history/[dateRange].tsx
"use client";

import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PathRow from '@/components/Settings/PathRow';

interface PathData {
    idealSelf: string;
    action: string;
    currentSelf: string;
}

export default function PathHistoryDetail() {
    const router = useRouter();
    const { dateRange } = router.query;

    // This would normally come from an API call based on the dateRange
    const pathsData: PathData[] = [
        { idealSelf: "Completely Relaxed", action: "Through meditation", currentSelf: "Unrelaxed" },
        { idealSelf: "Complete Belief", action: "Present in every moment", currentSelf: "Small Faith" },
        { idealSelf: "Wealthy", action: "Increase Income", currentSelf: "In Debt" },
        { idealSelf: "Patient", action: "Have fun in the process", currentSelf: "I want it now without work" },
        { idealSelf: "Social", action: "Go out", currentSelf: "Isolated" },
        { idealSelf: "Healthy", action: "Basketball", currentSelf: "Out of Shape" },
        { idealSelf: "Connected w/ family/friends", action: "Pick up the phone | Contact", currentSelf: "Disconnected" },
        { idealSelf: "Love | Pleasant", action: "Listen", currentSelf: "Still Learning Balance" },
        { idealSelf: "Gentleman", action: "Be good to her", currentSelf: "Husband" },
        { idealSelf: "Trusting", action: "Trust myself", currentSelf: "Don't believe in myself" },
        { idealSelf: "Energized", action: "Eat Fresh Consistently", currentSelf: "Tired | Exhausted" },
        { idealSelf: "Disciplined | Hustler", action: "Lock in", currentSelf: "Lazy" },
        { idealSelf: "Intelligent | Focused", action: "Read", currentSelf: "Absent minded" }
    ];

    return (
        <div className="mx-auto py-8 px-4">
            <div className="flex items-center mb-8">
                <Link href="/current-paths" className="text-gray-600 mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <h1 className="text-xl font-medium">Your path, {dateRange}</h1>
            </div>

            <div className="max-w-4xl">
                <div className="mb-4 flex text-sm text-gray-600">
                    <div className="w-1/3">I am</div>
                    <div className="w-1/3 text-center">Better than</div>
                    <div className="w-1/3 text-right">Me</div>
                </div>

                <div className="border-t border-gray-200">
                    {pathsData.map((path, index) => (
                        <PathRow
                            key={index}
                            index={index + 1}
                            idealSelf={path.idealSelf}
                            action={path.action}
                            currentSelf={path.currentSelf}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}