import React, { useEffect, useState } from 'react'
import PathNavigator from '../PathNavigator'
import { useAuthStore } from '@/storage/authStore'
import { CuratedPath } from '@/types/userType'
import ProgressCard from '../Progress'

function PathTracker() {
    const { user } = useAuthStore()
    const [currentPathIndex, setCurrentPathIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [curatedPaths, setCuratedPaths] = useState<CuratedPath[]>([])

    useEffect(() => {
        if (user && user.curatedPaths) {
            console.log("User curated paths loaded:", user.curatedPaths)
            setCuratedPaths(user.curatedPaths)
            setIsLoading(false)
        } else if (user && !user.curatedPaths) {
            console.log("User exists but no curated paths")
            setCuratedPaths([])
            setIsLoading(false)
        } else {
            console.log("No user data available yet")
            setIsLoading(true)
        }
    }, [user, user?.curatedPaths])

    const currentPath = curatedPaths[currentPathIndex] || null

    const handlePathChange = (index: number) => {
        setCurrentPathIndex(index)
    }

    const progressPercentage = currentPath
        ? (currentPath.contentFinished / currentPath.numberOfContent) * 100
        : 0

    if (isLoading) {
        return (
            <div className="mb-12 w-full">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">Loading your paths...</span>
                </div>
            </div>
        )
    }

    if (!currentPath || curatedPaths.length === 0) {
        console.log("No current path available")
        return (
            <div className="mb-12 w-full">
                <div className="text-center py-8">
                    <p className="text-gray-500">No learning paths available</p>
                </div>
            </div>
        )
    }

    console.log("Current Path:", currentPath)

    return (
        <div className="mb-12 px-0 sm:px-0 xl:px-5">
            <div className="flex flex-wrap md:flex-nowrap items-start w-full text-sm text-gray-500 mb-6">
                {/* Sidebar - Hidden on small screens */}
                <div className="hidden md:block flex-shrink-0 mr-4">
                    {curatedPaths.length > 0 && (
                        <PathNavigator
                            currentIndex={currentPathIndex}
                            totalPaths={curatedPaths.length}
                            onPathChange={handlePathChange}
                        />
                    )}
                </div>

                {/* Main content section */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between flex-wrap gap-y-4 items-start mb-6">
                        {/* Left */}
                        <div className="flex flex-col items-start">
                            <p className="mt-2 font-normal text-[#8F8F8F]">I am</p>
                            <h2 className="text-lg font-normal text-[#2E2E2E]">{currentPath.selfImagine}</h2>
                        </div>

                        {/* Center */}
                        <div className="flex flex-col items-center">
                            <p className='text-[#8F8F8F] font-normal'>Better than</p>
                            <h2 className="text-lg font-normal text-[#2E2E2E]">{currentPath.betterThrough}</h2>
                        </div>

                        {/* Right */}
                        <div className="flex flex-col items-end">
                            <p className='text-[#8F8F8F] font-normal'>Me</p>
                            <h2 className="text-lg font-normal text-[#2E2E2E]">{currentPath.currentImagine}</h2>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full h-1 bg-gray-200 rounded-full">
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* ProgressCard - Hidden on small screens */}
                <div className="hidden xl:block flex-shrink-0 ml-6">
                    <ProgressCard currentPath={currentPath} />
                </div>
            </div>
        </div>
    )
}

export default PathTracker
