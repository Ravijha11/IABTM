import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import UserHeader from "./UserHeader";
import PostContent from "./PostContent";
import ImageGallery from "./ImageGallery";
import PostStats from "./PostStats";
import PostActions from "./PostActions";
import CommentsSection from "./CommentsSection";
import CommentInput from "./CommentInput";
import PostMenu from "./PostMenu";
import EditPostModal from "./EditPostModal";
import { useAuthStore } from "@/storage/authStore";
import { Post } from "@/types/PostType";


const PostCard: React.FC<Post> = ({
    _id,
    postedBy,
    content,
    pictures,
    createdAt,
    likes,
    comments,
    applauds,
}) => {
    const {user} = useAuthStore();
    const queryClient = useQueryClient();
    const currentUserAvatar = user?.profilePicture || "/default-profile.svg";
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Query to get the current likes data
    const { data: likeData } = useQuery({
        queryKey: ['postLikesData', _id],
        queryFn: async () => {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/${_id}/likesData`,
                { withCredentials: true }
            );

            if (response.data.statusCode !== 200) {
                throw new Error('Failed to fetch like count');
            }

            return response.data.message;
        },
        initialData: { count: likes?.count || 0 },
    });

    // Query to check if the current user has liked the post
    const { data: userLikeData } = useQuery({
        queryKey: ['hasUserLikedPost', _id],
        queryFn: async () => {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/${_id}/likes/check`,
                { withCredentials: true }
            );

            if (response.data.statusCode !== 200) {
                throw new Error('Failed to fetch like status');
            }

            return response.data.message;
        },
    });

    // Query to get comments
    const { data: commentsData } = useQuery({
        queryKey: ['postComments', _id],
        queryFn: async () => {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/comment/${_id}/showAll`,
                { withCredentials: true }
            );

            if (response.data.statusCode !== 200) {
                throw new Error('Failed to fetch comments');
            }

            return response.data.data;
        },
        initialData: { comments: comments || [] },
    });

    const applaudCount = likeData?.count || applauds?.length || likes?.count || 0;
    const isLiked = userLikeData?.isLikedByUser || false;
    const postComments = commentsData?.comments || comments || [];
    const topComment = postComments.length > 0 ? postComments[0] : null;

    // Handle post edit
    const handleEdit = () => {
        setShowEditModal(true);
    };

    // Handle post update
    const handlePostUpdate = (updatedPost: Post) => {
        // Update the post in all relevant queries
        queryClient.setQueryData(['posts'], (old: Post[] | undefined) => {
            if (!old) return [updatedPost];
            return old.map(post => post._id === updatedPost._id ? updatedPost : post);
        });

        queryClient.setQueryData(['iabtm3605-posts'], (old: Post[] | undefined) => {
            if (!old) return [updatedPost];
            return old.map(post => post._id === updatedPost._id ? updatedPost : post);
        });

        queryClient.setQueryData(['myPosts'], (old: Post[] | undefined) => {
            if (!old) return [updatedPost];
            return old.map(post => post._id === updatedPost._id ? updatedPost : post);
        });
    };

    // Handle post delete
    const handlePostDelete = () => {
        // Remove the post from all relevant queries
        queryClient.setQueryData(['posts'], (old: Post[] | undefined) => {
            if (!old) return [];
            return old.filter(post => post._id !== _id);
        });

        queryClient.setQueryData(['iabtm3605-posts'], (old: Post[] | undefined) => {
            if (!old) return [];
            return old.filter(post => post._id !== _id);
        });

        queryClient.setQueryData(['myPosts'], (old: Post[] | undefined) => {
            if (!old) return [];
            return old.filter(post => post._id !== _id);
        });
    };

    return (
        <>
            <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 relative">
                {/* Post Menu */}
                <PostMenu
                    postId={_id}
                    postedBy={postedBy}
                    onEdit={handleEdit}
                    onDelete={handlePostDelete}
                />

                {/* User Header */}
                <div className="flex items-center gap-3 mb-4">
                    <img
                        src={postedBy.profilePicture || '/default-profile.svg'}
                        alt={postedBy.name}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 object-cover flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-semibold text-gray-900 text-sm md:text-base truncate">{postedBy.name}</span>
                        <span className="text-xs md:text-sm text-gray-500">{new Date(createdAt).toLocaleString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}</span>
                    </div>
                </div>

                {/* Post Text Content */}
                <div className="mb-4">
                    <p className="text-gray-900 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {content}
                    </p>
                </div>

                {/* Facebook-like Image Gallery */}
                {pictures && pictures.length > 0 && (
                    <div className="mb-4">
                        <ImageGallery images={pictures} />
                    </div>
                )}

                {/* Stats Row */}
                <div className="flex items-center gap-4 md:gap-6 py-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <span role="img" aria-label="applaud" className="text-base md:text-lg">👏</span> 
                        <span>{applaudCount} Applauds</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <img src="/Feed/comment_icon.svg" className="w-3 h-3 md:w-4 md:h-4" alt="Comment" /> 
                        <span>{postComments.length} Comments</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 md:gap-6 py-3 border-t border-gray-100">
                    <PostActions 
                        postId={_id} 
                        isLiked={isLiked} 
                        onCommentClick={() => setShowCommentsModal(true)}
                    />
                </div>

                {/* Top Comment Preview */}
                {topComment && (
                    <div className="flex gap-3 py-3 border-t border-gray-100">
                        <img
                            src={topComment.commentor?.profilePicture || '/default-profile.svg'}
                            alt={topComment.commentor?.name || 'User'}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-gray-900">
                                        {topComment.commentor?.name || 'Anonymous'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(topComment.createdAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                    {topComment.content}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Show More Comments Link */}
                {postComments.length > 1 && (
                    <div className="py-2 border-t border-gray-100">
                        <button
                            onClick={() => setShowCommentsModal(true)}
                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            View all {postComments.length} comments
                        </button>
                    </div>
                )}

                {/* Comment Input */}
                <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                    <img
                        src={currentUserAvatar}
                        alt="Your profile"
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                        <CommentInput userAvatar={currentUserAvatar} postId={_id} />
                    </div>
                </div>
            </div>

            {/* Comments Modal */}
            {showCommentsModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowCommentsModal(false)}
                >
                    <div 
                        className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                            <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                            <button
                                onClick={() => setShowCommentsModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Comments Section */}
                        <div className="flex-1 overflow-y-auto p-4 bg-white">
                            <CommentsSection postId={_id} comments={postComments} />
                        </div>

                        {/* Comment Input in Modal */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <CommentInput userAvatar={currentUserAvatar} postId={_id} />
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Post Modal */}
            <EditPostModal
                post={{
                    _id,
                    postedBy,
                    content,
                    pictures,
                    createdAt,
                    likes,
                    comments,
                    applauds,
                }}
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onUpdate={handlePostUpdate}
            />
        </>
    );
};

export default PostCard;