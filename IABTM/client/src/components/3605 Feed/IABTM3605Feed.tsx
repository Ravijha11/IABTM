'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from '@/components/3605 Feed/PostCard';
import { Post } from '@/types/PostType';
import { useQuery } from '@tanstack/react-query';
import PostLoaderSpinner from '@/components/ui/loader/PostLoaderSpinner';
import getSocket from '@/lib/socket';

const IABTM3605Feed: React.FC = () => {
  const [livePosts, setLivePosts] = useState<Post[]>([]);

  const fetchIABTM3605Posts = async () => {
    try {
      console.log('Fetching IABTM 3605 feed...');
      const res = await axios.get('/api/posts/feed/iabtm3605', {
        withCredentials: true
      });
      
      console.log('IABTM 3605 Response received:', res.data);
      
      if (res.data.statusCode === 200) {
        const posts = res.data.data || [];
        console.log('IABTM 3605 posts:', posts.length);
        return Array.isArray(posts) ? posts : [];
      }
      throw new Error('Failed to load IABTM 3605 feed.');
    } catch (error) {
      console.error('Error fetching IABTM 3605 feed:', error);
      return [];
    }
  };

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['iabtm3605-posts'],
    queryFn: fetchIABTM3605Posts,
    initialData: [],
  });

  useEffect(() => {
    console.log('IABTM 3605 Posts data received:', posts);
    console.log('Posts type:', typeof posts);
    console.log('Is array:', Array.isArray(posts));
    
    let newPosts: Post[] = [];
    
    if (posts && Array.isArray(posts)) {
      newPosts = posts;
      console.log('Setting IABTM 3605 posts from array, count:', newPosts.length);
    } else {
      console.log('Invalid posts data, setting empty array');
      newPosts = [];
    }
    
    console.log('Final IABTM 3605 posts to set:', newPosts.length);
    setLivePosts(newPosts);
  }, [posts]);

  useEffect(() => {
    const socket = getSocket();
    
    // Listen for new posts
    socket.on('feed:new_post', (post: Post) => {
      console.log('New post received via socket in IABTM 3605:', post);
      setLivePosts(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [post, ...safePrev];
      });
    });
    
    // Listen for applauds
    socket.on('feed:applaud', ({ postId, userId, action }) => {
      console.log('Applaud event received in IABTM 3605:', { postId, userId, action });
      setLivePosts(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map(post => {
          if (post._id === postId) {
            let applauds = post.applauds || [];
            if (action === 'applaud') {
              applauds = [...applauds, userId];
            } else {
              applauds = applauds.filter((id: string) => id !== userId);
            }
            return { ...post, applauds };
          }
          return post;
        });
      });
    });
    
    // Listen for new comments
    socket.on('feed:new_comment', ({ postId, comment }) => {
      console.log('New comment received in IABTM 3605:', { postId, comment });
      setLivePosts(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map(post => {
          if (post._id === postId) {
            const comments = post.comments ? [...post.comments, comment] : [comment];
            return { ...post, comments };
          }
          return post;
        });
      });
    });
    
    return () => {
      socket.off('feed:new_post');
      socket.off('feed:applaud');
      socket.off('feed:new_comment');
    };
  }, []);

  // Ensure we always have a safe array
  const safeLivePosts = Array.isArray(livePosts) ? livePosts : [];
  console.log('Safe IABTM 3605 live posts count:', safeLivePosts.length);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {isLoading && <PostLoaderSpinner />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-center text-sm text-red-600">
            {error instanceof Error ? error.message : 'Something went wrong while fetching posts.'}
          </p>
        </div>
      )}

      {!isLoading && safeLivePosts.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-4">Start posting or connect with friends to see content in your IABTM 3605 feed.</p>
          </div>
        </div>
      )}

      {!isLoading && safeLivePosts.length > 0 && (
        <div>
          {safeLivePosts.map((post: Post, index: number) => {
            console.log(`Rendering IABTM 3605 post ${index}:`, post._id);
            return (
              <div key={post._id} className="mb-6">
                <PostCard {...post} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IABTM3605Feed; 