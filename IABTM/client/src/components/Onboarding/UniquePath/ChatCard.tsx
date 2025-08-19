// components/ChatItem.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface ChatItemProps {
    id: string;
    name: string;
    memberCount: number;
    imageSrc: string;
}

const ChatItem: React.FC<ChatItemProps> = ({
    id,
    name,
    memberCount,
    imageSrc,
}) => {
    return (
        <Link
            href={`/chats/${id}`}
            className="flex flex-col sm:flex-row items-center gap-3 p-3 hover:bg-gray-100 rounded-md transition"
        >
            <div className="relative w-20 h-20 shrink-0">
                <Image
                    src={imageSrc}
                    alt={`${name} chat group`}
                    fill
                    className="object-cover rounded-full"
                    sizes="80px"
                />
            </div>
            <div className="text-center sm:text-left">
                <h3 className="font-medium text-gray-800">{name}</h3>
                <p className="text-sm text-gray-500">{memberCount} members</p>
            </div>
        </Link>
    );
};

export default ChatItem;
