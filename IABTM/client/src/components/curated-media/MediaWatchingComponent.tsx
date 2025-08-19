import axios from "axios";
import { toast } from "react-toastify";
import { YouTubePlayer } from "./YoutubeVideoPlayer";
import { FilmMedia } from "@/types/userType";
import { Eye } from "lucide-react";
import { useAuthStore } from "@/storage/authStore";
import { useEffect, useState } from "react";

const MediaWatchingComponent = ({
  media,
  onBack,
}: {
  media: FilmMedia;
  onBack: () => void;
}) => {
  const { setMediaStatuses, mediaStatuses, setUser } = useAuthStore();
  const [isViewed, setIsViewed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMarkingViewed, setIsMarkingViewed] = useState<boolean>(false);

  useEffect(() => {
    const checkIfViewed = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/curated-paths/media-progress/${media._id}`,
          { withCredentials: true }
        );
        const viewed = response.data?.data?.isViewed;
        setIsViewed(viewed);
        setMediaStatuses((prev: Record<string, boolean>) => ({
          ...prev,
          [media._id]: viewed,
        }) as Record<string, boolean>);
      } catch (error) {
        console.error("Error checking media progress:", error);
        setIsViewed(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkIfViewed();
  }, [media._id, setMediaStatuses]);

  const handleMarkAsViewed = async () => {
    setIsMarkingViewed(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/curated-paths/mark-viewed`,
        { mediaId: media._id },
        { withCredentials: true }
      );

      const { statusCode, data } = response.data;

      if (statusCode == 200) {
        const updatePathResponse = await axios.patch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/curated-paths/${data.pathId}/progress`,
          {},
          { withCredentials: true }
        );

        if (updatePathResponse.data.statusCode == 200) {
          setMediaStatuses((prev: Record<string, boolean>) => ({
            ...prev,
            [media._id]: true,
          }) as Record<string, boolean>);

          setUser(updatePathResponse.data.data);
          toast.success("Marked as viewed!");
          setIsViewed(true);
        }
      }
    } catch (error) {
      console.error("Error marking as viewed:", error);
      toast.error("Failed to mark as viewed. Please try again.");
    } finally {
      setIsMarkingViewed(false);
    }
  };

  const handleBackClick = () => {
    if (typeof window !== 'undefined' && (window as any).refreshMediaStatuses) {
      (window as any).refreshMediaStatuses();
    }
    onBack();
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          onClick={handleBackClick}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm sm:text-base">Back to Media List</span>
        </button>

        {/* Media Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* YouTube Player */}
          <div className="relative w-full h-64 md:h-96 lg:h-[500px]">
            <YouTubePlayer videoLink={media.videoLink} />
          </div>

          {/* Media Info */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between w-full mt-2 mb-4 gap-4">
                  {/* Loading or Status */}
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-200 rounded px-3 py-2 w-20 h-6"></div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4">
                      {isViewed ? (
                        <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                          <Eye className="scale-75 mr-1 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">Watched</span>
                        </div>
                      ) : (
                        <div className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
                          <Eye className="scale-75 mr-1 text-blue-600" />
                          <span className="text-xs text-blue-700 font-medium">New</span>
                        </div>
                      )}

                      {!isViewed && (
                        <button
                          onClick={handleMarkAsViewed}
                          disabled={isMarkingViewed}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            isMarkingViewed
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          {isMarkingViewed ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                              Marking...
                            </div>
                          ) : (
                            'Mark as Watched'
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {media.title}
                </h1>
              </div>
            </div>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
              {media.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaWatchingComponent;
