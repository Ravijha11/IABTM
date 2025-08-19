import React from "react";
import {
  Video,
  CakeSlice,
  Music,
  FilePenLine,
  Image,
  Building2,
} from "lucide-react";

const categories = [
  { label: "General", icon: <Video width="15px" /> },
  { label: "Attributes", icon: <Music width="15px" /> },
  { label: "Paths", icon: <CakeSlice width="15px" /> },
  { label: "Payment Methods", icon: <FilePenLine width="15px" /> },
  { label: "Security", icon: <Image width="15px" /> },
];

interface CategoryTabsProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export default function CategoryTabs({ activeCategory, setActiveCategory }: CategoryTabsProps) {
  return (
    <div className="grid grid-cols-3 md:flex md:gap-4 mb-6 text-gray-400 w-full border-b">
      {categories.map((cat) => (
        <button
          key={cat.label}
          onClick={() => setActiveCategory(cat.label)}
          className={`flex items-center justify-center p-2 md:p-4 text-sm md:text-md gap-1 md:gap-2 text-center ${
            activeCategory === cat.label ? "bg-gray-100 text-black" : ""
          }`}
        >
          {cat.icon}
          {cat.label}
        </button>
      ))}
    </div>
  );
}
