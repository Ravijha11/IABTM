"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/Onboarding/Progress";
import { TabNavigation } from "@/components/Onboarding/UniquePath/TabNavigation";
import PathNavigator from "@/components/Dashboard/PathNavigator";
import ButtonLoader from "@/components/ui/loader/ButtonloaderSpinner";  

import CuratedMediaContent from "@/pages/Onboarding/UniquePath/CuratedMedia";
import ExpertsContent from "@/pages/Onboarding/UniquePath/ExpertsList";
import IABTMContent from "@/pages/Onboarding/UniquePath/ChatList";
import EssentialsContent from "@/pages/Onboarding/UniquePath/Essentials";
import { useAuthStore } from "@/storage/authStore";

// Define types for curated path data
interface FilmMedia {
    _id: string;
    title: string;
    videoLink: string;
    description: string;
    thumbnail: string;
    attributes: {
        currentSelf: string[];
        imagineSelf: string[];
    };
}

interface CuratedMedia {
    _id: string;
    filmMedia: FilmMedia[];
    artMedia: any[];
    musicMedia: any[];
}

interface CuratedPath {
    _id: string;
    currentImagine: string;
    selfImagine: string;
    betterThrough: string;
    numberOfContent: number;
    contentFinished: number;
    curatedMedia: CuratedMedia;
}

export default function PersonalizedPath() {
    console.log("PersonalizedPath component rendered");
    const { user, clearOnboarding } = useAuthStore();
    const [currentPathIndex, setCurrentPathIndex] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Get current path from user data
    const curatedPaths: CuratedPath[] = user?.curatedPaths || [];
    const currentPath = curatedPaths[currentPathIndex] || null;

    // Generate path title based on currentImagine and selfImagine
    const pathTitle = currentPath ?
        `${currentPath.currentImagine} to ${currentPath.selfImagine}` :
        "Loading your personalized path...";

    // Define tabs with their content components, passing current path data
    const tabs = [
        {
            id: "curated-media",
            label: "Curated Media",
            icon: "/Tabs/film.svg",
            component: <CuratedMediaContent currentPath={currentPath} />
        },
        {
            id: "iabtm",
            label: "IABTM 3605",
            icon: "/Tabs/share.svg",
            component: <IABTMContent />
        },
        {
            id: "essentials",
            label: "Essentials",
            icon: "/Tabs/shopping-cart.svg",
            component: <EssentialsContent />
        },
    ];


    // Handle path navigation
    const handlePathChange = (index: number) => {
        setCurrentPathIndex(index);
    };

    // Handle save to database
    const handleSave = () => {
        window.location.href = "/3605-feed";
    };


    // Error state
    if (loadError || !currentPath) {
        return (
            <main className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="text-center max-w-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Personalised content will be pushed soon.</h2>
                    <p className="mb-6 text-gray-600">We are preparing your unique experience. Please check back later!</p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800"
                    >
                        Try Again
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-5xl ml-4 lg:ml-24 px-4 pt-8">
                {/* Progress bar */}
                <Progress value={100} className="mb-8" fractionValue="5/5" />

                {/* Content */}
                <div className="mb-12 w-full sm:w-10/12 flex justify-between items-start">

                    {/* Path Navigator component */}
                    {curatedPaths.length > 0 && (
                        <PathNavigator
                            currentIndex={currentPathIndex}
                            totalPaths={curatedPaths.length}
                            onPathChange={handlePathChange}
                        />
                    )}
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Starting your paths
                        </p>
                        <h1 className="text-xl sm:text-2xl font-semibold mb-3">
                            This is your unique Personalized Path "{pathTitle}"
                        </h1>
                    </div>


                </div>
            </div>

            {/* Tab Navigation */}
            <div>
                <div className="ml-4 lg:ml-24 px-4">
                    <TabNavigation tabs={tabs} />
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-center gap-4 py-8">
                    <Button
                        onClick={handleSave}
                        variant="outline"
                        className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] bg-black text-white border border-solid hover:bg-gray-800 hover:text-white [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500"
                    >
                        Start my paths
                    </Button>
                </div>
            </div>
        </main>
    );
}