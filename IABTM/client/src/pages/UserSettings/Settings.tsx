"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TabNavigation } from "@/components/Onboarding/UniquePath/TabNavigation";
import Attribues from "./Tabs/Attributes";
import CurrentPaths from "./Tabs/CurrentPaths";
import General from "./Tabs/General";
export default function PersonalizedPath() {
    // Define tabs with their content components
    const tabs = [
        {
            id: "general",
            label: "General",
            component: <General />
        },
        {
            id: "attributes",
            label: "Attributes",
            component: <Attribues />
        },
        {
            id: "paths",
            label: "Paths",
            component: <CurrentPaths />
        }

    ];

    // Handle save to database
    const handleSave = () => {
        window.location.href = "/dashboard";
    };

    return (
        <main className="min-h-screen bg-white">

            {/* Tab Navigation */}
            <div>
                <div className="ml-4 lg:ml-24  px-4">
                    <TabNavigation tabs={tabs} />
                </div>

                {/* Navigation Buttons */}
                
            </div>
        </main>
    );
}