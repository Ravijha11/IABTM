import React from "react";

interface Chat {
    id: string;
    name: string;
    type: 'personal' | 'group';
}

interface RoomListProps {
    selectedChat: Chat | null;
    setSelectedChat: (chat: Chat) => void;
    onNewGroup: () => void;
    groupChats: Chat[];
    personalChats: Chat[];
}

const RoomList: React.FC<RoomListProps> = ({
    selectedChat,
    setSelectedChat,
    onNewGroup,
    groupChats,
    personalChats
}) => {
    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
            </div>

            {/* Personal Chats */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Personal Chats</h3>
                    <div className="space-y-2">
                        {personalChats.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedChat?.id === chat.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        {chat.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium">{chat.name}</p>
                                        <p className="text-sm text-gray-500">Direct Message</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Group Chats */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">My Groups</h3>
                        <button
                            onClick={onNewGroup}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                            + New
                        </button>
                    </div>
                    <div className="space-y-2">
                        {groupChats.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                                <p className="text-sm">No groups yet</p>
                                <p className="text-xs">Create a group to start chatting</p>
                            </div>
                        ) : (
                            groupChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                        selectedChat?.id === chat.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                                            {chat.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium">{chat.name}</p>
                                            <p className="text-sm text-gray-500">Group</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomList;