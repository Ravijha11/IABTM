import React from 'react';
import ChatItem from '@/components/Onboarding/UniquePath/ChatCard';
import SectionHeader from '@/components/Onboarding/UniquePath/SectionHeader';
import { Progress } from '@/components/Onboarding/Progress';


// Define chat group interface
interface ChatGroup {
    id: string;
    name: string;
    memberCount: number;
    imageSrc: string;
}

export default function ChatsListPage() {
    // Chat groups data
    const chatGroups: ChatGroup[] = [
        {
            id: 'chief-relief-team',
            name: 'Chief Relief Team',
            memberCount: 4,
            imageSrc: '/Tabs/chat-1.svg',
        },
        {
            id: 'i-dont-read-but',
            name: "I Don't Read! But...",
            memberCount: 7,
            imageSrc: '/Tabs/chat-2.svg',
        },
        {
            id: 'chatiz',
            name: 'Chatiz',
            memberCount: 6,
            imageSrc: '/Tabs/chat-3.svg',
        },
    ];

    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-5xl ml-4 lg:ml-24 px-4 pt-8">
                <div className="flex justify-between items-center mb-8">
                    <SectionHeader title="Personal chats list based on information from your attributes and chat preferences" />
                    <Progress value={100} fractionValue="5/5" />
                </div>
                <div className="flex sm:flex-row flex-col">
                    {chatGroups.map((chatGroup) => (
                        <ChatItem
                            key={chatGroup.id}
                            id={chatGroup.id}
                            name={chatGroup.name}
                            memberCount={chatGroup.memberCount}
                            imageSrc={chatGroup.imageSrc}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}