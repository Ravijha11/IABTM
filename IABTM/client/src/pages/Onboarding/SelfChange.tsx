"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/Onboarding/Progress";
import { CharacterCard } from "@/components/Onboarding/HumanCard";
import WordSelectionComponent from "@/components/Onboarding/WordSelection";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/storage/authStore";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify"; 
import { currentSelfWords , imagineSelfWords} from "@/constants/selfWords";

export default function SelfChange() {
    const router = useRouter();
    const { setRedirectionStep, attributes, setCurrentSelf, setImagineSelf } = useAuthStore();


    const [currentSelfSelections, setCurrentSelfSelections] = useState<string[]>([]);
    const [imagineSelfSelections, setImagineSelfSelections] = useState<string[]>([]);

    useEffect(() => {
        if (attributes.currentSelf?.length > 0) {
            setCurrentSelfSelections(attributes.currentSelf);
        }
        if (attributes.imagineSelf?.length > 0) {
            setImagineSelfSelections(attributes.imagineSelf);
        }
    }, [attributes.currentSelf, attributes.imagineSelf]);

    const handleContinue = () => {
        if (currentSelfSelections.length === 0 || imagineSelfSelections.length === 0) {
            toast.error("Please select at least one word for both 'current self' and 'imagine self'.");
            return;
        }

        setCurrentSelf(currentSelfSelections);
        setImagineSelf(imagineSelfSelections);
        setRedirectionStep(2);
    };

    return (
        <main className="min-h-screen bg-white">
            <ToastContainer /> {/* <<< Add ToastContainer inside the component */}
            <div className="max-w-5xl ml-4 lg:ml-24 px-4 pt-8">
                <Progress value={20} className="mb-8" fractionValue="1/5" />
                <div className="mb-12 w-full sm:w-10/12">
                    <p className="text-sm text-muted-foreground">Starting your paths</p>
                    <h1 className="text-xl sm:text-2xl font-semibold mb-3">
                        Go from your current self to the self you imagine
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Pick characteristics of your current self, features of the self you
                        imagine and IABTM will create a suggested path between containing,
                        media, products, expert guides, events, a social space, and actions
                        that will help you get there.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-1 mx-4 sm:mx-8 md:mx-20">
                <div className="flex flex-col xl:flex-row">
                    <div className="rounded-3xl p-4 sm:p-8">
                        <CharacterCard
                            bgColor="bg-[#FCF3FF]"
                            imagePosition="left"
                            description="This is your current self"
                            heading="Me"
                        />
                    </div>
                    <div className="w-full">
                        <WordSelectionComponent
                            initialWords={currentSelfWords}
                            selectedWords={currentSelfSelections}
                            onSelectionChange={setCurrentSelfSelections}
                            className="mb-8"
                        />
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row">
                    <div className="rounded-3xl p-4 sm:p-8">
                        <CharacterCard
                            bgColor="bg-[#DCF6FF]"
                            imagePosition="right"
                            description="This is your imagine self"
                            heading="I Am"
                        />
                    </div>
                    <div className="w-full">
                        <WordSelectionComponent
                            initialWords={imagineSelfWords}
                            selectedWords={imagineSelfSelections}
                            onSelectionChange={setImagineSelfSelections}
                            className="mb-8"
                        />
                    </div>
                </div>
            </div>

            <div className="relative w-full pb-8 flex flex-col sm:flex-row sm:items-center sm:justify-center">
                <div className="flex justify-center gap-4">
                    <Button
                        onClick={() => router.push("/")}
                        variant="outline"
                        className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] bg-white text-black border border-[#2E2E2E] hover:bg-gray-100 hover:text-black [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleContinue}
                        variant="outline"
                        className="px-4 sm:px-8 py-4 sm:py-6 cursor-pointer rounded-[80px] bg-black text-white border border-solid hover:bg-gray-800 hover:text-white [font-family:'Satoshi-Medium',Helvetica] font-medium text-base sm:text-lg focus:ring-gray-500"
                    >
                        Continue
                    </Button>
                </div>

                <div className="absolute right-2 sm:right-4 top-0">
                    <Button
                        variant="default"
                        className="cursor-pointer"
                        onClick={() => { router.push("/create-account") }}
                    >
                        Skip Onboarding
                    </Button>
                </div>
            </div>
        </main>
    );
}
