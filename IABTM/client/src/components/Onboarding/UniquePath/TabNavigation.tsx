"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TabItem {
    id: string;
    label: string;
    icon?: string;
    component: React.ReactNode;
}

interface TabNavigationProps {
    tabs: TabItem[];
    defaultTabId?: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
    tabs,
    defaultTabId = tabs[0]?.id
}) => {
    const [activeTab, setActiveTab] = useState<string>(defaultTabId);

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
    };

    // Find the active tab component
    const activeComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="w-full">
            {/* Tab header */}
            <div className="flex border-b border-gray-200 ">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                            "flex items-center cursor-pointer px-4 py-3 text-sm font-normal  transition-colors text-[#2E2E2E]",
                            activeTab === tab.id
                                ? "text-[#2E2E2E] bg-[#EFEFEF] rounded-t-md"
                                : "text-[#2E2E2E] hover:text-black"
                        )}
                    >
                        <span className="mr-2">
                            {
                                tab.icon && (
                                    <Image
                                        src={tab.icon}
                                        alt={tab.label}
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                )
                            }
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="">
                {activeComponent}
            </div>
        </div>
    );
};