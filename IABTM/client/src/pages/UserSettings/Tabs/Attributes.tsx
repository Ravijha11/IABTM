"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/Onboarding/Progress";
import { CharacterCard } from "@/components/Onboarding/HumanCard";
import WordSelectionComponent from "@/components/Onboarding/WordSelection";
import { useState } from "react";
import { useAuthStore } from "@/storage/authStore";

export default function Attributes() {
    const { user } = useAuthStore();

    const [currentSelfWords] = useState([
        'Unrelaxed', 'Don\'t believe in myself', 'Tired', 'Lazy',
        'Absent-minded', 'Small Faith', 'Depressed', 'In Debt',
        'Isolated', 'Disconnected', 'Worrisome', 'Arrogant',
        'Afraid', 'Exhausted', 'I want it now without work',
        'Out of Shape',
    ]);

    const [imagineSelfWords] = useState([
        'Confident', 'Energetic', 'Focused', 'Disciplined',
        'Mindful', 'Faithful', 'Happy', 'Wealthy',
        'Connected', 'Present', 'Peaceful', 'Humble',
        'Brave', 'Rested', 'Patient',
        'Healthy', 'Balanced', 'Stylish'
    ]);

    // State to track selections from both components
    const [currentSelfSelections, setCurrentSelfSelections] = useState<string[]>([]);
    const [imagineSelfSelections, setImagineSelfSelections] = useState<string[]>([]);

    // Handle save to database
    const handleSave = async () => {
        // save to local
        await localStorage.setItem("currentSelfSelections", JSON.stringify(currentSelfSelections));
        await localStorage.setItem("imagineSelfSelections", JSON.stringify(imagineSelfSelections));

        console.log("Saving to local:", {
            currentSelf: currentSelfSelections,
            imagineSelf: imagineSelfSelections
        });

        window.location.href = "/learning-styles";
    };

    return (
        <main className="min-h-screen bg-white py-8">
            <div className=" mx-auto px-4">
                <div className="flex flex-col gap-8">
                    {/* Left column - Current Self */}
                    <div className="flex-1 max-w-3xl">
                        <div className="">
                            <h2 className="text-2xl font-semibold mb-1">Attributes of Current Self</h2>
                            <p className="text-gray-600 text-sm">You can change your set</p>
                        </div>
                        <WordSelectionComponent
                            initialWords={currentSelfWords}
                            onSelectionChange={setCurrentSelfSelections}
                            selectedWords={user?.attributes.currentSelf || []}
                            className="mb-4"
                        />
                    </div>

                    {/* Right column - Imagined Self */}
                    <div className="flex-1 max-w-3xl">
                        <div className="">
                            <h2 className="text-2xl font-semibold mb-1">Attributes of Self You Imagine</h2>
                            <p className="text-gray-600 text-sm">You can change your set</p>
                        </div>
                        <WordSelectionComponent
                            initialWords={imagineSelfWords}
                            onSelectionChange={setImagineSelfSelections}
                            className="mb-4"
                            selectedWords={user?.attributes.imagineSelf || []}
                        />
                    </div>
                </div>

                {/* Button section */}
                <div className="flex gap-4 py-8">

                    <Button
                        onClick={handleSave}
                        variant="outline"
                        className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] bg-black text-white border border-solid hover:bg-gray-800 hover:text-white [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500"
                    >
                        Apply Changes
                    </Button>
                </div>
            </div>
        </main>
    );
}