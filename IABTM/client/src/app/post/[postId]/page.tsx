'use client';

import React from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import PostCard from '@/components/3605 Feed/PostCard';
import { useQuery } from '@tanstack/react-query';
import PostLoaderSpinner from '@/components/ui/loader/PostLoaderSpinner';

interface ParticularPostPageProps {
    params: Promise<{
        postId: string;
    }>;
}

const ParticularPostPage: React.FC<ParticularPostPageProps> = ({ params }) => {
    const router = useRouter();
    const resolvedParams = React.use(params);
    const { postId } = resolvedParams;

    console.log("postId", postId);

    const fetchPost = async () => {
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/get/${postId}`
            );
            const { statusCode, message } = res.data;

            if (statusCode === 200) {
                console.log('Post fetched successfully:', message);
                return message;
            }

            throw new Error('Failed to load post.');
        } catch (error) {
            console.error('Error fetching post:', error);
            throw new Error('Failed to load post.');
        }
    };

    const { data: post, isLoading, error } = useQuery({
        queryKey: ['post', postId],
        queryFn: fetchPost,
    });

    console.log("post", post);

    return (
        <div className="max-w-2xl mx-auto p-4">
            {isLoading && <PostLoaderSpinner />}

            {error && (
                <div className="text-center py-8">
                    <p className="text-red-500 mb-4">
                        {error instanceof Error ? error.message : 'Something went wrong while fetching this post.'}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition cursor-pointer"
                    >
                        Go Back
                    </button>
                </div>
            )}

            {!isLoading && post && (
                <PostCard
                    _id={post._id}
                    postedBy={post.postedBy}
                    content={post.content}
                    pictures={post.pictures}
                    createdAt={post.createdAt}
                    likes={post.likes}
                    comments={post.comments}
                />
            )}
        </div>
    );
};

export default ParticularPostPage;