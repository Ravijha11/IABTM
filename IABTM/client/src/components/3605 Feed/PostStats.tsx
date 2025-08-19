// components/PostStats.tsx
import React from "react";

interface PostStatsProps {
  applauds: number;
  comments: number;
}

const PostStats: React.FC<PostStatsProps> = ({ applauds, comments }) => (
  <div className="flex gap-4 text-sm text-gray-500 mt-3 font-light border-t border-b border-[#E0E0E0] pt-2 pb-2">
    <p>👏 {applauds} Applauds</p>
    <p>{comments} comments</p>
  </div>
);

export default PostStats;
