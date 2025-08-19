import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Post } from "@/types/PostType";

interface CommentsSectionProps {
  postId: string;
  comments?: any[];
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ postId, comments: initialComments }) => {
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/comment/${postId}/showAll`,
        { withCredentials: true }
      );

      if (response.data.statusCode !== 200) {
        throw new Error('Failed to fetch comments');
      }

      return response.data.data;
    },
    initialData: { comments: initialComments || [] },
    enabled: !!postId,
  });

  const comments = commentsData?.comments || initialComments || [];

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-500">Loading comments...</span>
        </div>
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {comments.map((comment: any) => (
        <div key={comment._id} className="flex gap-3">
          <img
            src={comment.commentor?.profilePicture || '/default-profile.svg'}
            alt={comment.commentor?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {comment.commentor?.name || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentsSection;