import { Search } from "lucide-react";

export default function SearchBar({searchQuery,setSearchQuery,handleSearch, onUpdate}) {
  return (
    <div className="flex items-center justify-center w-full border-b px-4 py-2 mb-6">
      <input type="text" placeholder="Search" value={searchQuery} className="w-full px-3 py-2 outline-none text-sm" onChange={(e) => setSearchQuery(e.target.value)}onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch();
      }} />
      {
        searchQuery.trim() === "" ? (
          <Search
            className="w-5 h-5 text-gray-400 ml-2 cursor-pointer"
            onClick={handleSearch}
          />
        ) : (
          <div className="ml-2 text-sm text-gray-500 cursor-pointer" onClick={() => onUpdate?.()}>X</div>
        )
      }
    </div>
  );
}
