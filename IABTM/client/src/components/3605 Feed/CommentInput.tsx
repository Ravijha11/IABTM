import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import { post_type } from "@/types/PostType";
import { useAuthStore } from "@/storage/authStore";
import { useRouter } from "next/navigation";

interface CommentInputProps {
  userAvatar: string;
  postId: string;
}

const CommentInput: React.FC<CommentInputProps> = ({ userAvatar, postId }) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const router = useRouter();

  const commentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/comment/${postId}/create`,
        { content: commentText, post_type: post_type.post },
        { withCredentials: true }
      );
       
      if (response.data.statusCode !== 200) {
        throw new Error(response.data.message || 'Failed to add comment');
      }

      return response.data.data;
    },
    onMutate: async (commentText) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['postComments', postId] });
      
      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(['postComments', postId]);
      
      // Optimistically update to the new value
      const optimisticComment = {
        _id: `temp-${Date.now()}`,
        content: commentText,
        commentor: {
          _id: 'current-user',
          name: 'You',
          profilePicture: userAvatar
        },
        createdAt: new Date().toISOString(),
        post_type: post_type.post
      };
      
      queryClient.setQueryData(['postComments', postId], (old: any) => ({
        ...old,
        comments: [optimisticComment, ...(old?.comments || [])]
      }));
      
      return { previousComments };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousComments) {
        queryClient.setQueryData(['postComments', postId], context.previousComments);
      }
      
      if (err.message.includes("403")) {
        toast.error("Please login to comment");
        return;
      }

      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data?.message || 'An error occurred');
      } else {
        toast.error('Unable to add comment');
      }
    },
    onSuccess: (data) => {
      toast.success('Comment added successfully!');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setIsSubmitting(false);
    }
  });

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!user) {
      e.preventDefault();
      router.push('/create-account');
      return;
    }
    
    if (e.key === 'Enter' && comment.trim() && !isSubmitting) {
      e.preventDefault();
      setIsSubmitting(true);
      commentMutation.mutate(comment);
      setComment("");
    }
  };

  const handleButtonSubmit = () => {
    if (!user) {
      router.push('/create-account');
      return;
    }
    
    if (comment.trim() && !isSubmitting) {
      setIsSubmitting(true);
      commentMutation.mutate(comment);
      setComment("");
    }
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder={user ? "Write a comment..." : "Sign up to comment..."}
          className="w-full border border-gray-200 rounded-full px-4 py-3 pr-12 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleSubmit}
          disabled={commentMutation.isPending || isSubmitting}
          onClick={() => !user && router.push('/create-account')}
        />
        <button
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200 ${
            comment.trim() && !isSubmitting
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          onClick={handleButtonSubmit}
          disabled={commentMutation.isPending || isSubmitting || !comment.trim()}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <img src="/Feed/send_icon.svg" alt="Send" className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default CommentInput;