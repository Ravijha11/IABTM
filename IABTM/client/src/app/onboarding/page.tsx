"use client";
import { useEffect } from 'react';
import { useAuthStore } from '@/storage/authStore';
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ButtonLoader from "@/components/ui/loader/ButtonloaderSpinner";

// Import step components
import SelfChange from "@/pages/Onboarding/SelfChange"; 
import LearningStyles from "@/pages/Onboarding/LearningStyles"; 
import MediaPreferences from "@/pages/Onboarding/MediaPreferences";
import PersonalDetails from "@/pages/Onboarding/PersonalDetails";
import PersonalizedPath from "@/pages/Onboarding/PersonalisedPath";

function OnboardingPage() {
    // Get the current step and user from the auth store
    const { redirectionStep, setRedirectionStep, user } = useAuthStore();
    
    // Debug - log every render
    console.log(`OnboardingPage rendering - Current Step: ${redirectionStep}, User exists: ${!!user}`);
    
    // Initialize the step to 1 if it's not set
    useEffect(() => {
        if (redirectionStep === null) {
            console.log("Setting default redirection step to 1");
            setRedirectionStep(1);
        }
        
        // For debugging
        console.log(`useEffect - Current redirectionStep: ${redirectionStep}`);
        if (redirectionStep === 5) {
            console.log("Step 5 detected - user data:", user ? "Found" : "Not found");
            if (user && user.curatedPaths) {
                console.log(`User has ${user.curatedPaths.length} curated paths`);
            }
        }
    }, [redirectionStep, setRedirectionStep, user]);

    // If we're on step 5 but don't have user data yet, show loading
    if (redirectionStep === 5 && (!user || !user.curatedPaths)) {
        console.log("Showing loading state while waiting for user data");
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[70vh]">
                    <ButtonLoader />
                    <p className="mt-4 text-gray-600">Loading your personalized path...</p>
                </div>
                <Footer />
            </div>
        );
    }

    // Render the current step based on redirectionStep
    const renderCurrentStep = () => {
        console.log(`Rendering step component for step: ${redirectionStep}`);
        
        switch (redirectionStep) {
            case 1:
                return <SelfChange />;
            case 2:
                return <LearningStyles />;
            case 3:
                return <MediaPreferences />;
            case 4:
                return <PersonalDetails />;
            case 5:
                return <PersonalizedPath />;
            default:
                console.log("Default case triggered with step:", redirectionStep);
                return <SelfChange />;
        }
    };

    return (
        <div>
            <Navbar />
            {renderCurrentStep()}
            <Footer />
        </div>
    );
}

export default OnboardingPage;