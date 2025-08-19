"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/Onboarding/Progress";
import { CharacterCard } from "@/components/Onboarding/HumanCard";
import WordSelectionComponent from "@/components/Onboarding/WordSelection";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/storage/authStore";
import { toast, ToastContainer } from "react-toastify"; 

export default function MediaPreferences() {
    const { setRedirectionStep } = useAuthStore();
    const authStore = useAuthStore();

    const mediaPreferenceOptions = [
        'Audio', 'Video', 'Books', 'Articles', 'Presentation',
    ];

    const [selectedMediaPreferences, setSelectedMediaPreferences] = useState<string[]>([]);

    useEffect(() => {
        if (authStore.attributes.mediaPreferences?.length > 0) {
            setSelectedMediaPreferences(authStore.attributes.mediaPreferences);
        }
    }, [authStore.attributes.mediaPreferences]);

    const handleContinue = () => {
        if (selectedMediaPreferences.length === 0) {
            toast.error("Please select at least one media preference.");
            return;
        }

        useAuthStore.getState().setMediaPreferences(selectedMediaPreferences);
        setRedirectionStep(4);
    };

    const handleBack = () => {
        setRedirectionStep(2);
    };

    return (
        <main className="min-h-screen bg-white">
            <ToastContainer /> {/* <<< Added ToastContainer to render the toasts */}
            <div className="max-w-5xl ml-4 lg:ml-24 px-4 pt-8">
                <Progress value={60} className="mb-8" fractionValue="3/5" />
                <div className="mb-12 w-full sm:w-10/12">
                    <p className="text-sm text-muted-foreground">
                        Starting your paths
                    </p>
                    <h1 className="text-xl sm:text-2xl font-semibold mb-3">Media preferences</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Pick attributes of your current self, attributes of the self you imagine, interests/dislikes and an
                        algorithm will create a suggested path in between containing media, products, people,
                        social, events, actions that will help you get there.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-1 mx-4 sm:mx-8 md:mx-20">
                <div className="flex flex-col xl:flex-row">
                    <div className="rounded-3xl p-4 sm:p-8">
                        <CharacterCard 
                            bgColor="bg-[#FFF8E2]" 
                            imagePosition="left"
                        />
                    </div>
                    <div className="w-full">
                        <WordSelectionComponent
                            initialWords={mediaPreferenceOptions}
                            selectedWords={selectedMediaPreferences}
                            onSelectionChange={setSelectedMediaPreferences}
                            className="mb-8"
                            addNewWords={false}
                        />
                    </div>
                </div>
            </div>

            <div className="relative w-full pb-8 flex flex-col sm:flex-row sm:items-center sm:justify-center">
                <div className="flex justify-center gap-4">
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] bg-white text-black border border-[#2E2E2E] hover:bg-gray-100 hover:text-black [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleContinue}
                        variant="outline"
                        className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] bg-black text-white border border-solid hover:bg-gray-800 hover:text-white [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </main>
    );
}
