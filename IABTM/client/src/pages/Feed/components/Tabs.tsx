interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  return (
    <div className="w-full p-4">
      <div className="flex justify-start space-x-4 border-b mb-4">
        {['Feed', 'Chats Room'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg transition-colors duration-200 ${
              activeTab === tab
                ? 'bg-gray-100 font-semibold text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
