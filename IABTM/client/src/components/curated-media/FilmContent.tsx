"use client";
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/storage/authStore'; 
import MediaListPage from '@/pages/Onboarding/UniquePath/MediaListPage';
import {CuratedPath, FilmMedia, User} from '@/types/userType'
import MediaWatchingComponent from './MediaWatchingComponent'


export default function FilmContent() {
  const { user , mediaStatuses} = useAuthStore();
  const [uniqueMediaByPath, setUniqueMediaByPath] = useState<Array<{
    path: CuratedPath;
    uniqueMedia: FilmMedia[];
  }>>([]);
  
  const [selectedMedia, setSelectedMedia] = useState<FilmMedia | null>(null);

  useEffect(() => {
    if (!user || !user.curatedPaths || user.curatedPaths.length === 0) {
      setUniqueMediaByPath([]);
      return;
    }

    // Keep track of all media IDs that have been processed to avoid duplicates
    const processedMediaIds = new Set<string>();
    const pathsWithUniqueMedia: Array<{
      path: CuratedPath;
      uniqueMedia: FilmMedia[];
    }> = [];

    // Process each curated path
    user.curatedPaths.forEach((path) => {
      const uniqueMediaForPath: FilmMedia[] = [];

      // Process film media from current path
      if (path.curatedMedia?.filmMedia) {
        path.curatedMedia.filmMedia.forEach((filmItem) => {
          // Only add if we haven't seen this media ID before
          if (!processedMediaIds.has(filmItem._id)) {
            processedMediaIds.add(filmItem._id);
            uniqueMediaForPath.push({
              _id: filmItem._id,
              type: 'Video',
              title: filmItem.title,
              description: filmItem.description,
              thumbnail: filmItem.thumbnail,
              videoLink: filmItem.videoLink,
              attributes: filmItem.attributes
            });
          }
        });
      }

      // Only add path if it has unique media
      if (uniqueMediaForPath.length > 0) {
        pathsWithUniqueMedia.push({
          path,
          uniqueMedia: uniqueMediaForPath
        });
      }
    });

    setUniqueMediaByPath(pathsWithUniqueMedia);
  }, [user]);

  // Handler for when a media item is clicked
  const handleMediaClick = (media: FilmMedia) => {
    setSelectedMedia(media);
  };

  // Handler for going back to the list
  const handleBackToList = () => {
    setSelectedMedia(null);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Please log in to view your personalized content.</p>
      </div>
    );
  }

  if (!user.curatedPaths || user.curatedPaths.length === 0) {
    return (
      <div className="text-center py-8">
        <p>No curated paths available. Please complete your onboarding process.</p>
      </div>
    );
  }

  if (uniqueMediaByPath.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-lg text-gray-500 font-medium text-center">Personalized content will be pushed soon.</p>
      </div>
    );
  }

  // If a media is selected, show the media watching component
  if (selectedMedia) {
    return (
      <MediaWatchingComponent 
        media={selectedMedia} 
        onBack={handleBackToList} 
      />
    );
  }

  // Otherwise, show the media list
  return (
    <div>
      {uniqueMediaByPath.map(({ path, uniqueMedia }) => (
        <div key={path._id} className="">
          <MediaListPage 
            featuredMedia={uniqueMedia}
            pathTitle={`${path.currentImagine} to ${path.selfImagine}`}
            onMediaClick={handleMediaClick} 
          />
        </div>
      ))}
    </div>
  );
}