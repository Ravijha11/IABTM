// components/UserHeader.tsx
import React from "react";

interface UserHeaderProps {
  name: string;
  date: string;
  profilePicture?: string;
}

const UserHeader: React.FC<UserHeaderProps> = ({ name, date, profilePicture }) => (
  <div className="flex items-center gap-3">
    <img src={profilePicture} alt={name} className="w-8 h-8 rounded-full" />
    <div>
      <p className="text-sm font-semibold">{name}</p>
      <p className="text-xs text-[#8F8F8F] font-light">{date}</p>
    </div>
  </div>
);

export default UserHeader;
