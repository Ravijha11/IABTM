// components/PostContent.tsx
import React from "react";

interface PostContentProps {
  content: string;
}

const PostContent: React.FC<PostContentProps> = ({ content }) => (
  <p className="text-sm text-gray-800 whitespace-pre-wrap mt-2">{content}</p>
);

export default PostContent;
