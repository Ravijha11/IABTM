import React, { useState } from "react";
import Tabs from "./components/Tabs";
import PostList from "./components/PostList";
import ModernChatRoom from '@/components/3605 Feed/ModernChatRoom';

interface FeedPageProps {
  onTabChange?: (tab: string) => void;
}

export default function FeedPage({ onTabChange }: FeedPageProps) {
    const [activeTab, setActiveTab] = useState('Feed');

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Tabs Container - Always positioned at the top */}
            <div className="w-full">
                <Tabs activeTab={activeTab} setActiveTab={handleTabChange} />
            </div>

            {/* Content Container - Takes remaining space */}
            <div className="flex-1 w-full">
                {activeTab === "Feed" && (
                    <PostList/>
                )}

                {activeTab === "Chats Room" && (
                    <ModernChatRoom />
                )}
            </div>
        </div>    
    )
}