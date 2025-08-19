'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/storage/authStore';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PostCard from '@/components/3605 Feed/PostCard';
import PostLoaderSpinner from '@/components/ui/loader/PostLoaderSpinner';
import { Post } from '@/types/PostType';
import { useRouter } from 'next/navigation';

const PublicPostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchPublicPosts();
  }, []);

  const fetchPublicPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/posts/feed/iabtm3605/public`);
      
      if (response.data.success) {
        setPosts(response.data.data || []);
      } else {
        setError('Failed to load posts');
      }
    } catch (error) {
      console.error('Error fetching public posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Redirect to sign-up when user tries to interact
  const handleInteraction = () => {
    if (!user) {
      router.push('/create-account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <PostLoaderSpinner />
            <p className="mt-4 text-gray-600">Loading amazing posts...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Discover Amazing Content
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Explore the best posts from our community. Get inspired, learn, and connect with amazing people.
          </p>

          {!user && (
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">Join the Community</h3>
              <p className="text-gray-600 mb-4">Create your own posts and connect with others!</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => router.push('/sign-in')}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => router.push('/create-account')}
                  className="flex-1 bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts Section */}
      <div className="container mx-auto px-4 py-12">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchPublicPosts}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No posts available at the moment.</p>
            <button 
              onClick={fetchPublicPosts}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Interaction Notice for Non-Logged Users */}
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-blue-800 font-medium">Want to applaud or comment?</p>
                    <p className="text-blue-600 text-sm">Sign up to interact with posts and join the conversation!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Posts */}
            {posts.map((post: Post, index: number) => (
              <div key={post._id || `post-${index}`} className="relative">
                {/* Overlay for non-logged users to redirect on interaction */}
                {!user && (
                  <div 
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={handleInteraction}
                    title="Sign up to interact with posts"
                  />
                )}
                
                <PostCard
                  _id={post._id}
                  postedBy={post.postedBy}
                  content={post.content}
                  pictures={post.pictures}
                  createdAt={post.createdAt}
                  likes={post.likes}
                  comments={post.comments}
                  applauds={post.applauds}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default PublicPostsPage; 