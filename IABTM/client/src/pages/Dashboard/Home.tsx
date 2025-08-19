import ProgressCard from "@/components/Dashboard/Progress";
import PathTracker from "@/components/Dashboard/Home/PathTracker";
import PostList from "@/pages/Feed/components/PostList";
import PostCreator from '@/components/PostCreator';
import PostCard from '@/components/3605 Feed/PostCard';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Post } from '@/types/PostType';
import { useAuthStore } from '@/storage/authStore';

import React from 'react'

function Home() {
  const { user } = useAuthStore();

  // Fetch current user's posts
  const fetchMyPosts = async () => {
    const res = await axios.get('/api/posts/history', {
      withCredentials: true
    });
    if (res.data.statusCode === 200) {
      return res.data.data;
    }
    throw new Error('Failed to load your posts.');
  };

  const { data: myPosts, isLoading, error, refetch } = useQuery({
    queryKey: ['myPosts'],
    queryFn: fetchMyPosts,
    enabled: !!user, // Only fetch if user is logged in
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Your Dashboard</h2>
          <p className="text-gray-600">Please sign in to view your posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Post Creator */}
        <PostCreator />
        
        {/* User's own posts */}
        <div className="space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading your posts...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error instanceof Error ? error.message : 'Error loading your posts.'}
                  </h3>
                  <button 
                    onClick={() => refetch()}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!isLoading && (!myPosts || myPosts.length === 0) && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-4">Share your thoughts with the world! Create your first post above.</p>
              </div>
            </div>
          )}
          
          {!isLoading && myPosts && myPosts.length > 0 && (
            <div className="space-y-6">
              {myPosts.map((post: Post) => (
                <PostCard key={post._id} {...post} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      <PathTracker/>
    </div>
  )
}

export default Home