"use client";
import React, { useEffect, useState } from 'react';
import MediaListPage from '@/pages/Onboarding/UniquePath/MediaListPage';

// Define types for the component props
interface CuratedPath {
  _id: string;
  currentImagine: string;
  selfImagine: string;
  betterThrough: string;
  numberOfContent: number;
  contentFinished: number;
  curatedMedia: {
    _id: string;
    filmMedia: Array<{
      _id: string;
      title: string;
      videoLink: string;
      description: string;
      thumbnail: string;
      attributes: {
        currentSelf: string[];
        imagineSelf: string[];
      };
    }>;
    artMedia: any[];
    musicMedia: any[];
  };
}

interface CuratedMediaContentProps {
  currentPath: CuratedPath | null;
}

export default function CuratedMediaContent({ currentPath }: CuratedMediaContentProps) {
  // Map the current path's curated media to the format expected by MediaListPage
  const filmMedia = currentPath?.curatedMedia?.filmMedia || [];
  
  // Transform the film media into the format expected by MediaListPage
  const mappedMedia = filmMedia.map(item => ({
    _id: item._id,
    type: 'Video',
    title: item.title,
    description: item.description,
    thumbnail: item.thumbnail || `https://img.youtube.com/vi/${getYoutubeVideoId(item.videoLink)}/hqdefault.jpg`,
    videoLink: item.videoLink,
    isViewed: false // We can implement view tracking in the future
  }));

  // Extract YouTube video ID from URL (helper function)
  function getYoutubeVideoId(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      } else if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.substring(1);
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  return (
    <div className="py-4">
      {currentPath ? (
        <MediaListPage 
          featuredMedia={mappedMedia}
          pathTitle={`${currentPath.currentImagine} to ${currentPath.selfImagine}`}
        />
      ) : (
        <div className="text-center py-8">
          <p>Personalised content will be pushed soon.</p>
        </div>
      )}
    </div>
  );
}