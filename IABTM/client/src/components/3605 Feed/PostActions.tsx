import React, { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/storage/authStore";
import { useRouter } from "next/navigation";

interface PostActionsProps {
  postId: string;
  isLiked: boolean;
  onCommentClick?: () => void;
}

const PostActions: React.FC<PostActionsProps> = ({ postId, isLiked, onCommentClick }) => {
  const queryClient = useQueryClient();
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  // Mutation for handling post like/unlike
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/${postId}/like`,
        {},
        {
          withCredentials: true,
        }
      );

      if (response.data.statusCode !== 200) {
        throw new Error(response.data.message || 'Failed to process applaud');
      }

      return response.data.data;
    },
    onMutate: async () => {
      // Optimistically update the UI
      const newLikedState = !localIsLiked;
      setLocalIsLiked(newLikedState);
      setIsAnimating(true);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['postLikesData', postId] });
      await queryClient.cancelQueries({ queryKey: ['hasUserLikedPost', postId] });
      
      // Snapshot the previous value
      const previousLikesData = queryClient.getQueryData(['postLikesData', postId]);
      const previousUserLikeData = queryClient.getQueryData(['hasUserLikedPost', postId]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['postLikesData', postId], (old: any) => ({
        ...old,
        count: old?.count + (newLikedState ? 1 : -1)
      }));
      
      queryClient.setQueryData(['hasUserLikedPost', postId], (old: any) => ({
        ...old,
        isLikedByUser: newLikedState
      }));
      
      return { previousLikesData, previousUserLikeData };
    },
    onError: (err, variables, context) => {
      console.log('Applaud error occurred, rolling back state');
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLikesData) {
        queryClient.setQueryData(['postLikesData', postId], context.previousLikesData);
      }
      if (context?.previousUserLikeData) {
        queryClient.setQueryData(['hasUserLikedPost', postId], context.previousUserLikeData);
      }
      setLocalIsLiked(isLiked); // Revert to original state
      setIsAnimating(false);
      
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data?.message || 'An error occurred');
      } else {
        toast.error(err.message);
      }
      console.error('Applaud error', err);
    },
    onSuccess: (data) => {
      console.log('Applaud success, data:', data);
      setIsAnimating(false);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['postLikesData', postId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedPost', postId] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['iabtm3605-posts'] });
      setIsAnimating(false);
    },
  });

  const handleLike = useCallback(() => {
    if (!user) {
      router.push('/create-account');
      return;
    }
    
    if (likeMutation.isPending || isAnimating) {
      console.log('Applaud action blocked - mutation pending or animating');
      return;
    }
    console.log('Applaud action triggered, current state:', localIsLiked);
    likeMutation.mutate();
  }, [likeMutation.isPending, isAnimating, localIsLiked, user, router]);

  const handleCommentClick = () => {
    if (!user) {
      router.push('/create-account');
      return;
    }
    
    if (onCommentClick) {
      onCommentClick();
    }
  };

  return (
    <div className="flex gap-4 md:gap-6">
      <button
        className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full transition-all duration-200 text-sm md:text-base ${
          localIsLiked 
            ? 'bg-blue-100 text-blue-600 font-semibold' 
            : 'text-gray-600 hover:bg-gray-100'
        } ${isAnimating ? 'scale-110' : ''} ${(likeMutation.isPending || isAnimating) ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleLike}
        disabled={likeMutation.isPending || isAnimating}
      >
        <img
          src={"/Feed/applaud_icon.svg"}
          className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${
            isAnimating ? 'animate-bounce' : ''
          }`}
          alt="Applaud"
        />
        <span className="hidden sm:inline">{localIsLiked ? "Applauded" : "Applaud"}</span>
      </button>

      <button 
        className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors duration-200 text-sm md:text-base"
        onClick={handleCommentClick}
      >
        <img src="/Feed/comment_icon.svg" className="w-4 h-4 md:w-5 md:h-5" alt="Comment" />
        <span className="hidden sm:inline">Comment</span>
      </button>
    </div>
  );
};

export default PostActions;